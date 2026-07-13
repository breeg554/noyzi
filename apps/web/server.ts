import path from "node:path";

const port = Number(process.env.PORT ?? 3000);
const clientDirectory = "./dist/client";
const serverEntryPoint = "./dist/server/server.js";
const preloadMaxBytes = Number(
	process.env.ASSET_PRELOAD_MAX_SIZE ?? 5 * 1024 * 1024,
);
const enableEtag = (process.env.ASSET_PRELOAD_ENABLE_ETAG ?? "true") === "true";
const enableGzip = (process.env.ASSET_PRELOAD_ENABLE_GZIP ?? "true") === "true";
const gzipMinBytes = Number(process.env.ASSET_PRELOAD_GZIP_MIN_SIZE ?? 1024);
const gzipTypes = (
	process.env.ASSET_PRELOAD_GZIP_MIME_TYPES ??
	"text/,application/javascript,application/json,application/xml,image/svg+xml"
)
	.split(",")
	.map((value) => value.trim())
	.filter(Boolean);

type StartHandler = {
	fetch: (request: Request) => Response | Promise<Response>;
};

type StaticRoute = (request: Request) => Response | Promise<Response>;

function canGzip(mimeType: string) {
	return gzipTypes.some((type) =>
		type.endsWith("/") ? mimeType.startsWith(type) : mimeType === type,
	);
}

function createStaticRoute(
	bytes: Uint8Array<ArrayBuffer>,
	mimeType: string,
	immutable: boolean,
): StaticRoute {
	const etag = enableEtag
		? `W/"${Bun.hash(bytes).toString(16)}-${bytes.byteLength.toString()}"`
		: undefined;
	const gzip =
		enableGzip && bytes.byteLength >= gzipMinBytes && canGzip(mimeType)
			? Bun.gzipSync(bytes)
			: undefined;

	return (request) => {
		if (etag && request.headers.get("if-none-match") === etag) {
			return new Response(null, { status: 304, headers: { ETag: etag } });
		}

		const compressed =
			gzip && request.headers.get("accept-encoding")?.includes("gzip");
		const body = compressed ? gzip : bytes;
		const headers: Record<string, string> = {
			"Cache-Control": immutable
				? "public, max-age=31536000, immutable"
				: "public, max-age=3600",
			"Content-Length": body.byteLength.toString(),
			"Content-Type": mimeType,
		};

		if (etag) headers.ETag = etag;
		if (compressed) headers["Content-Encoding"] = "gzip";

		return new Response(new Uint8Array(body), { headers });
	};
}

async function loadStaticRoutes(): Promise<Record<string, StaticRoute>> {
	const routes: Record<string, StaticRoute> = {};
	const glob = new Bun.Glob("**/*");

	for await (const relativePath of glob.scan({ cwd: clientDirectory })) {
		const filePath = path.join(clientDirectory, relativePath);
		const file = Bun.file(filePath);

		if (!(await file.exists()) || file.size === 0) continue;

		const route = `/${relativePath.split(path.sep).join(path.posix.sep)}`;
		const mimeType = file.type || "application/octet-stream";

		if (file.size > preloadMaxBytes) {
			routes[route] = () =>
				new Response(Bun.file(filePath), {
					headers: {
						"Cache-Control": "public, max-age=3600",
						"Content-Type": mimeType,
					},
				});
			continue;
		}

		routes[route] = createStaticRoute(
			new Uint8Array(await file.arrayBuffer()),
			mimeType,
			true,
		);
	}

	return routes;
}

async function start() {
	const module = (await import(serverEntryPoint)) as { default: StartHandler };
	const routes = await loadStaticRoutes();

	const server = Bun.serve({
		hostname: "0.0.0.0",
		port,
		routes: {
			...routes,
			"/*": (request) => module.default.fetch(request),
		},
		error(error) {
			console.error(error);
			return new Response("Internal Server Error", { status: 500 });
		},
	});

	console.log(`Noyzi is listening on http://localhost:${server.port ?? port}`);
}

void start();
