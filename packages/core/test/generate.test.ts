import { describe, expect, test } from "bun:test";
import { generate } from "../src/index.ts";

describe("generate", () => {
	test("same seed produces identical spec", () => {
		expect(generate("hello")).toEqual(generate("hello"));
	});

	test("numeric and string seeds are equivalent", () => {
		expect(generate(42)).toEqual(generate("42"));
	});

	test("different seeds produce different specs", () => {
		expect(generate("hello")).not.toEqual(generate("world"));
	});

	test("spec is stable across releases (frozen snapshot)", () => {
		expect(generate("meshy")).toMatchSnapshot();
	});

	test("options are deterministic", () => {
		expect(generate("x", { colors: 3 })).toEqual(generate("x", { colors: 3 }));
	});

	test("colors option controls blob count", () => {
		expect(generate("x", { colors: 2 }).blobs).toHaveLength(1);
		expect(generate("x", { colors: 6 }).blobs).toHaveLength(5);
	});

	test("colors option is clamped to 2..8", () => {
		expect(generate("x", { colors: 0 }).blobs).toHaveLength(1);
		expect(generate("x", { colors: 99 }).blobs).toHaveLength(7);
	});

	test("warp can be disabled", () => {
		expect(generate("x", { warp: false }).warp).toBeNull();
	});

	test("warp overrides are applied", () => {
		const spec = generate("x", { warp: { frequency: 0.01, scale: 0.3 } });
		expect(spec.warp?.frequency).toBe(0.01);
		expect(spec.warp?.scale).toBe(0.3);
	});

	test("disabling warp does not change other fields", () => {
		const full = generate("x");
		const bare = generate("x", { warp: false });
		expect(bare.blobs).toEqual(full.blobs);
		expect(bare.background).toEqual(full.background);
	});

	test("spec is JSON round-trippable", () => {
		const spec = generate("json");
		expect(JSON.parse(JSON.stringify(spec))).toEqual(spec);
	});

	test("all colors are valid hex", () => {
		const spec = generate("colors");
		const hex = /^#[0-9a-f]{6}$/;
		expect(spec.background.hex).toMatch(hex);
		for (const blob of spec.blobs) {
			expect(blob.color.hex).toMatch(hex);
		}
	});

	test("blob geometry stays within bounds", () => {
		for (const seed of ["a", "b", "c", "d", "e", "f", "g", "h"]) {
			for (const blob of generate(seed).blobs) {
				expect(blob.x).toBeGreaterThanOrEqual(-0.25);
				expect(blob.x).toBeLessThanOrEqual(1.25);
				expect(blob.y).toBeGreaterThanOrEqual(-0.25);
				expect(blob.y).toBeLessThanOrEqual(1.25);
				expect(blob.radius).toBeGreaterThan(0);
			}
		}
	});
});
