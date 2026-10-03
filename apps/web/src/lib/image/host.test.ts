import { describe, expect, test } from "bun:test";
import { routeImageHost } from "./host.ts";

function route(url: string): Request | Response {
	return routeImageHost(new Request(url));
}

describe("image host routing", () => {
	test("rewrites the image subdomain to the /img prefix", () => {
		const routed = route("https://img.noyzi.dev/v1/dawid%2Fmeshy.svg?w=1280");
		expect(routed instanceof Request).toBe(true);
		expect((routed as Request).url).toBe(
			"https://img.noyzi.dev/img/v1/dawid%2Fmeshy.svg?w=1280",
		);
		expect((route("https://img.noyzi.dev/latest/x.svg") as Request).url).toBe(
			"https://img.noyzi.dev/img/latest/x.svg",
		);
	});

	test("keeps the image subdomain free of site pages", () => {
		for (const path of ["/docs", "/img/v1/x.svg", "/v1", "/og.png"]) {
			const routed = route(`https://img.noyzi.dev${path}`);
			expect(routed instanceof Response).toBe(true);
			expect((routed as Response).status).toBe(404);
		}
	});

	test("gives the image subdomain a home, robots.txt and a generated favicon", async () => {
		const home = route("https://img.noyzi.dev/") as Response;
		expect(home.status).toBe(302);
		expect(home.headers.get("location")).toBe("https://noyzi.dev/docs");
		const robots = route("https://img.noyzi.dev/robots.txt") as Response;
		expect(robots.status).toBe(200);
		expect(await robots.text()).toContain("Allow: /");
		expect((route("https://img.noyzi.dev/favicon.ico") as Request).url).toBe(
			"https://img.noyzi.dev/img/v1/noyzi.png?w=64&h=64",
		);
	});

	test("redirects /img on the site to the subdomain", () => {
		for (const host of ["noyzi.dev", "www.noyzi.dev"]) {
			const routed = route(`https://${host}/img/v1/noyzi.svg?w=320`);
			expect(routed instanceof Response).toBe(true);
			expect((routed as Response).status).toBe(301);
			expect((routed as Response).headers.get("location")).toBe(
				"https://img.noyzi.dev/v1/noyzi.svg?w=320",
			);
		}
	});

	test("leaves everything else alone", () => {
		const request = new Request("https://noyzi.dev/docs");
		expect(routeImageHost(request)).toBe(request);
		const local = new Request("http://localhost:3000/img/v1/noyzi.svg");
		expect(routeImageHost(local)).toBe(local);
	});
});
