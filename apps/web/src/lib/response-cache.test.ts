import { describe, expect, test } from "bun:test";
import { preventHtmlCaching } from "./response-cache.ts";

describe("HTML response caching", () => {
	test("replaces leaked immutable caching on pages while preserving their response", async () => {
		const original = new Response("<h1>Noyzi</h1>", {
			status: 404,
			headers: {
				"Content-Type": "text/html; charset=utf-8",
				"Cache-Control": "public, max-age=31536000, immutable",
				"Set-Cookie": "session=example; HttpOnly",
			},
		});
		const response = preventHtmlCaching(original);
		expect(response.headers.get("Cache-Control")).toBe("no-store");
		expect(response.status).toBe(404);
		expect(response.headers.get("Set-Cookie")).toBe(
			"session=example; HttpOnly",
		);
		expect(await response.text()).toBe("<h1>Noyzi</h1>");
	});

	test("disables caching for HTML without an existing policy", () => {
		const response = preventHtmlCaching(
			new Response("page", { headers: { "Content-Type": "Text/HTML" } }),
		);
		expect(response.headers.get("Cache-Control")).toBe("no-store");
	});

	for (const contentType of [
		"application/javascript",
		"text/css",
		"image/svg+xml",
		"application/json",
	]) {
		test(`preserves caching for ${contentType}`, () => {
			const original = new Response("asset", {
				headers: {
					"Content-Type": contentType,
					"Cache-Control": "public, max-age=31536000, immutable",
				},
			});
			expect(preventHtmlCaching(original)).toBe(original);
			expect(original.headers.get("Cache-Control")).toBe(
				"public, max-age=31536000, immutable",
			);
		});
	}
});
