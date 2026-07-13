import { describe, expect, test } from "bun:test";
import { generate, type HexColor } from "../src/index.ts";

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
		expect(generate("noyzi")).toMatchSnapshot();
	});

	test("options are deterministic", () => {
		expect(generate("x", { colors: 3 })).toEqual(generate("x", { colors: 3 }));
	});

	test("defaults to four colors", () => {
		expect(generate("x").palette).toHaveLength(4);
	});

	test("colors option controls field count", () => {
		expect(generate("x", { colors: 2 }).fields).toHaveLength(1);
		expect(generate("x", { colors: 3 }).fields).toHaveLength(2);
		expect(generate("x", { colors: 6 }).fields.length).toBeGreaterThanOrEqual(
			2,
		);
		expect(generate("x", { colors: 6 }).fields.length).toBeLessThanOrEqual(3);
	});

	test("colors option is retained as the complete render palette", () => {
		expect(generate("x", { colors: 2 }).palette).toHaveLength(2);
		expect(generate("x", { colors: 5 }).palette).toHaveLength(5);
		expect(generate("x", { colors: 8 }).palette).toHaveLength(8);
	});

	test("colors option is clamped to 2..8", () => {
		expect(generate("x", { colors: 0 }).fields).toHaveLength(1);
		expect(generate("x", { colors: 99 }).fields.length).toBeGreaterThanOrEqual(
			3,
		);
		expect(generate("x", { colors: 99 }).fields.length).toBeLessThanOrEqual(4);
	});

	test("custom palette controls the rendered colors", () => {
		const spec = generate("brand", {
			palette: ["#123", "#ABCDEF", "#ff5500"],
		});

		expect(spec.palette.map((color) => color.hex)).toEqual([
			"#112233",
			"#abcdef",
			"#ff5500",
		]);
		expect(spec.palette[0]).toEqual(spec.background);
		expect(spec.fields.map((field) => field.color.hex)).toEqual([
			"#abcdef",
			"#ff5500",
		]);
	});

	test("custom palette overrides colors without changing seeded geometry", () => {
		const first = generate("brand", {
			colors: 8,
			palette: ["#112233", "#445566", "#778899"],
		});
		const second = generate("brand", {
			palette: ["#ffeecc", "#ccbbaa", "#998877"],
		});

		expect(first.palette).toHaveLength(3);
		expect(first.fields.map(({ color: _color, ...field }) => field)).toEqual(
			second.fields.map(({ color: _color, ...field }) => field),
		);
	});

	test("custom palette validates its size and colors", () => {
		expect(() => generate("brand", { palette: ["#123456"] })).toThrow(
			"between 2 and 8",
		);
		expect(() =>
			generate("brand", { palette: ["red" as HexColor, "#123456"] }),
		).toThrow("Invalid palette color");
	});

	test("spec is JSON round-trippable", () => {
		const spec = generate("json");
		expect(JSON.parse(JSON.stringify(spec))).toEqual(spec);
	});

	test("all colors are valid hex", () => {
		const spec = generate("colors");
		const hex = /^#[0-9a-f]{6}$/;
		expect(spec.background.hex).toMatch(hex);
		for (const color of spec.palette) {
			expect(color.hex).toMatch(hex);
		}
		for (const field of spec.fields) {
			expect(field.color.hex).toMatch(hex);
		}
	});

	test("field geometry stays structured and within bounds", () => {
		for (const seed of ["a", "b", "c", "d", "e", "f", "g", "h"]) {
			for (const field of generate(seed).fields) {
				expect(field.x).toBeGreaterThanOrEqual(-0.3);
				expect(field.x).toBeLessThanOrEqual(1.3);
				expect(field.y).toBeGreaterThanOrEqual(-0.3);
				expect(field.y).toBeLessThanOrEqual(1.3);
				expect(field.points.length).toBeGreaterThanOrEqual(10);
				expect(field.points.length).toBeLessThanOrEqual(14);
				expect(
					new Set(field.points.map((point) => point.x)).size,
				).toBeGreaterThan(4);
				expect(field.feather).toBeGreaterThan(0);
				expect(field.opacity).toBeGreaterThanOrEqual(0.88);
				expect(field.opacity).toBeLessThanOrEqual(0.98);
			}
		}
	});

	test("sequential integer seeds rotate through distinct palette families", () => {
		const backgrounds = Array.from(
			{ length: 10 },
			(_, index) => generate(index + 1).background.hex,
		);
		expect(new Set(backgrounds).size).toBeGreaterThanOrEqual(5);
	});
});
