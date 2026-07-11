import { describe, expect, test } from "bun:test";
import {
	generate,
	isSequentialSeed,
	paletteFromSeed,
	seedHash,
	toCanvas,
	toDataUrl,
} from "../src/index.ts";

describe("isSequentialSeed", () => {
	test("detects integer-like seeds", () => {
		expect(isSequentialSeed(42)).toBe(true);
		expect(isSequentialSeed("42")).toBe(true);
		expect(isSequentialSeed(-7)).toBe(true);
		expect(isSequentialSeed("noyzi")).toBe(false);
		expect(isSequentialSeed("user-42")).toBe(false);
		expect(isSequentialSeed(1.5)).toBe(false);
	});
});

describe("paletteFromSeed", () => {
	test("is deterministic", () => {
		expect(paletteFromSeed("dawn")).toEqual(paletteFromSeed("dawn"));
	});

	test("returns the requested number of stops, clamped to 2..8", () => {
		expect(paletteFromSeed("x", 3)).toHaveLength(3);
		expect(paletteFromSeed("x")).toHaveLength(6);
		expect(paletteFromSeed("x", 0)).toHaveLength(2);
		expect(paletteFromSeed("x", 99)).toHaveLength(8);
	});

	test("matches the colors used by generate for the same seed", () => {
		const spec = generate("dawn", { colors: 6 });
		const palette = paletteFromSeed("dawn", 6);
		expect(palette[0]).toEqual(spec.background);
		expect(palette.slice(1)).toEqual(spec.blobs.map((b) => b.color));
	});

	test("works with hashed seeds", () => {
		const seed = seedHash("dawid@example.com");
		const palette = paletteFromSeed(seed, 4);
		expect(palette).toHaveLength(4);
		for (const stop of palette) {
			expect(stop.hex).toMatch(/^#[0-9a-f]{6}$/);
		}
	});
});

describe("raster renderers", () => {
	test("toCanvas rejects outside a browser environment", () => {
		expect(toCanvas(generate("dawn"))).rejects.toThrow("browser environment");
	});

	test("toDataUrl rejects outside a browser environment", () => {
		expect(toDataUrl(generate("dawn"))).rejects.toThrow("browser environment");
	});
});
