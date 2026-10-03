export const IMAGE_HOST = "img.noyzi.dev";
export const IMAGE_PREFIX = "/img";
export const FAVICON_PATH = "/v1/noyzi.png";
export const FAVICON_SEARCH = "?w=64&h=64";

const SITE_HOSTS = ["noyzi.dev", "www.noyzi.dev"];
const IMAGE_PATH = /^\/(v\d+|latest)\//;

export function publicImagePath(url: URL, path: string): string {
	return url.hostname === IMAGE_HOST ? path : `${IMAGE_PREFIX}${path}`;
}

export function routeImageHost(request: Request): Request | Response {
	const url = new URL(request.url);

	if (url.hostname === IMAGE_HOST) {
		if (url.pathname === "/") {
			return new Response(null, {
				status: 302,
				headers: {
					"Cache-Control": "public, max-age=3600",
					Location: "https://noyzi.dev/docs",
				},
			});
		}
		if (url.pathname === "/robots.txt") {
			return new Response("User-agent: *\nAllow: /\n", {
				headers: {
					"Cache-Control": "public, max-age=86400",
					"Content-Type": "text/plain; charset=utf-8",
				},
			});
		}
		if (url.pathname === "/favicon.ico") {
			const favicon = new URL(url);
			favicon.pathname = `${IMAGE_PREFIX}${FAVICON_PATH}`;
			favicon.search = FAVICON_SEARCH;
			return new Request(favicon, request);
		}
		if (!IMAGE_PATH.test(url.pathname)) {
			return new Response("Not found\n", {
				status: 404,
				headers: {
					"Cache-Control": "public, max-age=300",
					"Content-Type": "text/plain; charset=utf-8",
				},
			});
		}
		const rewritten = new URL(url);
		rewritten.pathname = `${IMAGE_PREFIX}${url.pathname}`;
		return new Request(rewritten, request);
	}

	if (
		SITE_HOSTS.includes(url.hostname) &&
		url.pathname.startsWith(`${IMAGE_PREFIX}/`)
	) {
		const path = url.pathname.slice(IMAGE_PREFIX.length);
		return new Response(null, {
			status: 301,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Cache-Control": "public, max-age=86400",
				Location: `https://${IMAGE_HOST}${path}${url.search}`,
			},
		});
	}

	return request;
}
