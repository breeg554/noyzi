import { describe, expect, test } from "bun:test";
import { generate, seedHash, toSvg } from "@noyzi/core";
import {
	ImageError,
	imageResponse,
	latestImageRedirect,
	parseImageRequest,
	renderImage,
} from "./image.ts";
import { IMAGE_VERSIONS, type ImageVersion } from "./versions.ts";

const FROZEN: Record<ImageVersion, Record<string, string>> = {
	v1: {
		"noyzi.svg":
			"bda51d429163598757f0c527c22fee55c0e44b492a49b79ea172e7abb2857cc2",
		"dawid%2Fmeshy.svg?w=1280&h=320":
			"5386f3b59b8dab434b8f2eea33a96fa8d4a203f5b15b91f4c7585e099ec86b31",
		"42.svg?colors=6&vignette=false":
			"8a44b4cd8a8741e7b233dde775f769801c8badef69ffaacc20e854e29d8ee495",
		"brand.svg?palette=0b1020,ff5a5f,ffd166&vignette=0.2&w=800&h=600":
			"109ff8214f4053feef4b3ff131f5728e99e507eae67cf6f0b7f14700d3594a14",
	},
};

async function sha(text: string): Promise<string> {
	const digest = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(text),
	);
	return [...new Uint8Array(digest)]
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

function get(path: string): Request {
	return new Request(`https://noyzi.dev${path}`);
}

function parse(path: string, search = "") {
	return parseImageRequest(path, search);
}

function parseError(path: string, search = ""): string {
	try {
		parseImageRequest(path, search);
	} catch (error) {
		if (error instanceof ImageError) return error.message;
		throw error;
	}
	throw new Error("expected an error");
}

describe("image url parsing", () => {
	test("uses defaults", () => {
		expect(parse("noyzi.svg")).toEqual({
			seed: "noyzi",
			width: 1000,
			height: 1000,
			options: {},
		});
	});

	test("decodes seeds once, including slashes", () => {
		expect(parse("dawid%2Fmeshy.svg").seed).toBe("dawid/meshy");
		expect(parse("dawid/meshy.svg").seed).toBe("dawid/meshy");
		expect(parse("hello%20world.svg").seed).toBe("hello world");
		expect(parse("100%2525.svg").seed).toBe("100%25");
	});

	test("reads every option", () => {
		expect(
			parse(
				"x.svg",
				"?w=1280&h=320&palette=%23FFFFFF,000000,ff5a5f&vignette=0.25",
			),
		).toEqual({
			seed: "x",
			width: 1280,
			height: 320,
			options: {
				palette: ["#ffffff", "#000000", "#ff5a5f"],
				vignette: { strength: 0.25 },
			},
		});
		expect(parse("x.svg", "?colors=6").options).toEqual({ colors: 6 });
		expect(parse("x.svg", "?vignette=false").options).toEqual({
			vignette: false,
		});
		expect(parse("x.svg", "?vignette=0").options).toEqual({ vignette: false });
	});

	test("rejects bad input", () => {
		expect(parseError("x.png")).toBe("Not found");
		expect(parseError(".svg")).toContain("missing");
		expect(parseError(`${"a".repeat(257)}.svg`)).toContain("longer");
		expect(parseError("%E0%A4%A.svg")).toContain("encoding");
		expect(parseError("x.svg", "?size=og")).toContain("unknown");
		expect(parseError("x.svg", "?w=1&w=2")).toContain("repeated");
		expect(parseError("x.svg", "?w=0")).toContain("1 to 4096");
		expect(parseError("x.svg", "?w=5000")).toContain("1 to 4096");
		expect(parseError("x.svg", "?w=10.5")).toContain("whole");
		expect(parseError("x.svg", "?colors=9")).toContain("2 to 8");
		expect(parseError("x.svg", "?colors=4&palette=ffffff,000000")).toContain(
			"either",
		);
		expect(parseError("x.svg", "?palette=ffffff")).toContain("colors");
		expect(parseError("x.svg", "?palette=fff,000")).toContain("6-digit");
		expect(parseError("x.svg", "?palette=ffffff,red")).toContain("hex");
		expect(parseError("x.svg", "?vignette=2")).toContain("vignette");
	});
});

describe("image rendering", () => {
	test("matches the React components for the same seed", () => {
		const svg = renderImage("v1", parse("dawid.svg", "?w=600&h=400"));
		expect(svg).toBe(
			toSvg(generate(seedHash("dawid")), { width: 600, height: 400 }),
		);
	});

	test("every version keeps its frozen output", async () => {
		for (const [version, cases] of Object.entries(FROZEN)) {
			for (const [url, hash] of Object.entries(cases)) {
				const [path = "", search = ""] = url.split("?");
				const svg = renderImage(
					version as ImageVersion,
					parse(path, search ? `?${search}` : ""),
				);
				const actual = await sha(svg);
				if (actual !== hash) {
					throw new Error(
						`${version}/${url} changed (${actual}). Old image URLs must never change: add a new version instead.`,
					);
				}
			}
		}
		expect(Object.keys(FROZEN)).toEqual(Object.keys(IMAGE_VERSIONS));
	});
});

describe("image responses", () => {
	test("serves cacheable svg", async () => {
		const response = imageResponse(get("/img/v1/noyzi.svg?w=320&h=200"), "v1");
		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toBe(
			"image/svg+xml; charset=utf-8",
		);
		expect(response.headers.get("cache-control")).toBe(
			"public, max-age=31536000, immutable",
		);
		expect(response.headers.get("access-control-allow-origin")).toBe("*");
		expect(response.headers.get("x-noyzi-version")).toBe("v1");
		expect(await response.text()).toContain('width="320"');
	});

	test("returns readable errors", async () => {
		const response = imageResponse(get("/img/v1/x.svg?nope=1"), "v1");
		expect(response.status).toBe(400);
		expect(response.headers.get("cache-control")).toBe("public, max-age=300");
		expect(await response.text()).toContain("unknown parameter");
		expect(imageResponse(get("/img/v1/x.png"), "v1").status).toBe(404);
	});

	test("latest redirects to the current version", () => {
		const response = latestImageRedirect(
			get("/img/latest/dawid%2Fmeshy.svg?w=1280"),
		);
		expect(response.status).toBe(302);
		expect(response.headers.get("location")).toBe(
			"/img/v1/dawid%2Fmeshy.svg?w=1280",
		);
		expect(response.headers.get("cache-control")).toBe("public, max-age=3600");
		const onImageHost = latestImageRedirect(
			new Request("https://img.noyzi.dev/img/latest/noyzi.svg"),
		);
		expect(onImageHost.headers.get("location")).toBe("/v1/noyzi.svg");
	});
});
