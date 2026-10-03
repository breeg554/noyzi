import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { generate, seedHash, toPixels } from "../src/index.ts";
import type { Reference } from "./browser/capture.ts";
import { caseName, RASTER_CASES } from "./browser/cases.ts";
import { grainOf, lookDiff, lookOf } from "./browser/look.ts";

const LOOK_LIMIT = 2.5;
const GRAIN_TOLERANCE = 0.15;
const REFERENCE = new URL("./browser/reference.json", import.meta.url);

describe("toPixels", () => {
	test("returns opaque RGBA at the requested size", () => {
		for (const [width, height] of [
			[1, 1],
			[7, 3],
			[64, 64],
		] as const) {
			const pixels = toPixels(generate("size"), { width, height });
			expect(pixels.width).toBe(width);
			expect(pixels.height).toBe(height);
			expect(pixels.data.length).toBe(width * height * 4);
			expect(pixels.data.every((value, index) => index % 4 !== 3 || value === 255)).toBe(true);
		}
	});

	test("is deterministic", () => {
		const spec = generate(seedHash("again"));
		const a = toPixels(spec, { width: 300, height: 200 });
		const b = toPixels(spec, { width: 300, height: 200 });
		expect(Buffer.from(a.data).equals(Buffer.from(b.data))).toBe(true);
	});
});

describe("toPixels matches the browser SVG", () => {
	if (!existsSync(REFERENCE)) {
		test("browser reference exists", () => {
			throw new Error(
				"Missing test/browser/reference.json. Run `bun test/browser/capture.ts` in packages/core and open the link in Chrome.",
			);
		});
		return;
	}
	const reference = JSON.parse(readFileSync(REFERENCE, "utf8")) as Reference;

	for (const c of RASTER_CASES) {
		const name = caseName(c);
		test(name, () => {
			const expected = reference.cases.find((item) => item.name === name);
			if (!expected) throw new Error(`${name} is missing from reference.json, capture it again`);
			const pixels = toPixels(generate(seedHash(c.seed), c.options), {
				width: c.width,
				height: c.height,
			});
			const diff = lookDiff(lookOf(pixels.data, c.width, c.height), {
				width: expected.look.width,
				height: expected.look.height,
				rgb: new Uint8Array(Buffer.from(expected.look.rgb, "base64")),
			});
			const grain = grainOf(pixels.data, c.width, c.height) / expected.grain;
			console.log(`${name}: look diff ${diff.toFixed(2)}, grain ${(grain * 100).toFixed(0)}% of ${reference.browser}`);
			expect(diff).toBeLessThanOrEqual(LOOK_LIMIT);
			expect(Math.abs(grain - 1)).toBeLessThanOrEqual(GRAIN_TOLERANCE);
		});
	}
});
