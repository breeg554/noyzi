import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { MAX_COLORS, MIN_COLORS } from "./gallery-options.ts";
import { IMAGE_HOST } from "./image/host.ts";
import {
	DEFAULT_IMAGE_SIZE,
	ImageError,
	MAX_IMAGE_SIZE,
	MAX_RASTER_SIZE,
	MAX_SEED_LENGTH,
	parseImageRequest,
} from "./image/image.ts";
import { IMAGE_VERSIONS, LATEST_IMAGE_VERSION } from "./image/versions.ts";

const hexColor = z.string().regex(/^#[\da-f]{6}$/i, "Use #rrggbb hex colors");
const palette = z.array(hexColor).min(MIN_COLORS).max(MAX_COLORS);
const dimension = z.number().int().min(1).max(MAX_IMAGE_SIZE);
const format = z.enum(["png", "webp", "jpg", "svg"]);

const inputSchema = z
	.object({
		seed: z
			.string()
			.min(1)
			.max(MAX_SEED_LENGTH)
			.describe(
				"Stable artwork identifier. Reuse with the same palette size to keep composition; change for a new variation. Use a non-sensitive label.",
			),
		palette: palette
			.optional()
			.describe(
				"2–8 #rrggbb colors: background first, accents after. Omit for a palette derived from the seed.",
			),
		width: dimension
			.default(DEFAULT_IMAGE_SIZE)
			.describe(
				`Width in pixels. Maximum ${MAX_RASTER_SIZE} for PNG, WebP, and JPG; ${MAX_IMAGE_SIZE} for SVG.`,
			),
		height: dimension
			.default(DEFAULT_IMAGE_SIZE)
			.describe(
				`Height in pixels. Maximum ${MAX_RASTER_SIZE} for PNG, WebP, and JPG; ${MAX_IMAGE_SIZE} for SVG.`,
			),
		format: format
			.default("png")
			.describe(
				"PNG for general use, WebP or JPG for compressed images, SVG for scalable artwork.",
			),
	})
	.strict();

function createServer() {
	const server = new McpServer({ name: "noyzi", version: "1.0.0" });

	server.registerTool(
		"generate_gradient",
		{
			title: "Generate Noyzi gradient",
			description:
				"Create a deterministic textured gradient for backgrounds, covers, placeholders, or avatars. Reuse the seed and palette size to preserve composition; change palette colors to recolor or the seed for a new variation. Returns a versioned public image URL and its settings. Creates abstract backgrounds without text, logos, or illustrations.",
			inputSchema,
			outputSchema: z.object({
				url: z.string().url(),
				seed: z.string(),
				palette,
				width: dimension,
				height: dimension,
				format,
				version: z.literal(LATEST_IMAGE_VERSION),
			}),
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
			_meta: { securitySchemes: [{ type: "noauth" }] },
		},
		({ seed, palette: colors, width, height, format }) => {
			try {
				const version = LATEST_IMAGE_VERSION;
				const url = new URL(
					`https://${IMAGE_HOST}/${version}/${encodeURIComponent(seed)}.${format}`,
				);
				url.searchParams.set("w", String(width));
				url.searchParams.set("h", String(height));
				if (colors) {
					url.searchParams.set(
						"palette",
						colors.map((color) => color.slice(1).toLowerCase()).join(","),
					);
				}
				const request = parseImageRequest(
					url.pathname.slice(`/${version}/`.length),
					url.search,
				);
				const renderer = IMAGE_VERSIONS[version];
				const spec = renderer.generate(
					renderer.seedHash(seed),
					request.options,
				);
				const result = {
					url: url.href,
					seed,
					palette: spec.palette.map((color) => color.hex),
					width,
					height,
					format,
					version,
				};
				return {
					content: [{ type: "text", text: JSON.stringify(result) }],
					structuredContent: result,
				};
			} catch (error) {
				if (!(error instanceof ImageError || error instanceof URIError)) {
					throw error;
				}
				return {
					isError: true,
					content: [
						{
							type: "text",
							text:
								error instanceof ImageError
									? error.message
									: "seed must contain valid Unicode characters",
						},
					],
				};
			}
		},
	);

	return server;
}

export async function mcpResponse(request: Request): Promise<Response> {
	const headers = new Headers({
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "POST, OPTIONS",
		"Access-Control-Allow-Headers":
			"Content-Type, Accept, MCP-Protocol-Version, Mcp-Session-Id, Last-Event-ID",
		"Cache-Control": "no-store",
	});
	if (request.method === "OPTIONS") {
		return new Response(null, { status: 204, headers });
	}
	if (request.method !== "POST") {
		headers.set("Allow", "POST, OPTIONS");
		return Response.json(
			{
				jsonrpc: "2.0",
				id: null,
				error: { code: -32000, message: "Method not allowed" },
			},
			{ status: 405, headers },
		);
	}

	const server = createServer();
	const transport = new WebStandardStreamableHTTPServerTransport({
		sessionIdGenerator: undefined,
		enableJsonResponse: true,
		maxRequestBodySize: 16 * 1024,
	});
	try {
		await server.connect(transport);
		const response = await transport.handleRequest(request);
		for (const [key, value] of headers) response.headers.set(key, value);
		return response;
	} finally {
		await server.close();
	}
}
