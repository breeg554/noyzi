import { describe, expect, test } from "bun:test";
import { generate, toCss, toSvg, toSvgDataUri } from "../src/index.ts";

describe("toSvg", () => {
	test("same seed produces identical svg", () => {
		expect(toSvg(generate("hello"))).toBe(toSvg(generate("hello")));
	});

	test("svg output is stable (frozen snapshot)", () => {
		expect(toSvg(generate("meshy"))).toMatchSnapshot();
	});

	test("respects width and height", () => {
		const svg = toSvg(generate("size"), { width: 400, height: 300 });
		expect(svg).toContain('width="400"');
		expect(svg).toContain('height="300"');
		expect(svg).toContain('viewBox="0 0 400 300"');
	});

	test("contains one radial gradient per blob", () => {
		const spec = generate("count");
		const svg = toSvg(spec);
		expect(svg.match(/<radialGradient/g)).toHaveLength(spec.blobs.length);
	});

	test("includes displacement warp with spec seed", () => {
		const spec = generate("wavy");
		const svg = toSvg(spec);
		expect(svg).toContain("feDisplacementMap");
		expect(svg).toContain(`seed="${spec.warp?.seed}"`);
	});

	test("omits warp when disabled", () => {
		expect(toSvg(generate("flat", { warp: false }))).not.toContain(
			"feDisplacementMap",
		);
	});

	test("no turbulence at all when warp is disabled", () => {
		expect(toSvg(generate("bare", { warp: false }))).not.toContain(
			"feTurbulence",
		);
	});

	test("gradient ids are namespaced per seed", () => {
		const a = toSvg(generate("a"));
		const b = toSvg(generate("b"));
		const idOf = (svg: string) => svg.match(/id="(m[^-"]+)-b0"/)?.[1];
		expect(idOf(a)).toBeDefined();
		expect(idOf(a)).not.toBe(idOf(b));
	});
});

describe("toSvgDataUri", () => {
	test("produces an encoded svg data uri", () => {
		const uri = toSvgDataUri(generate("uri"));
		expect(uri.startsWith("data:image/svg+xml,")).toBe(true);
		expect(decodeURIComponent(uri.slice("data:image/svg+xml,".length))).toBe(
			toSvg(generate("uri")),
		);
	});
});

describe("toCss", () => {
	test("same seed produces identical css", () => {
		expect(toCss(generate("hello"))).toEqual(toCss(generate("hello")));
	});

	test("css output is stable (frozen snapshot)", () => {
		expect(toCss(generate("meshy"))).toMatchSnapshot();
	});

	test("background color matches spec", () => {
		const spec = generate("bg");
		expect(toCss(spec).backgroundColor).toBe(spec.background.hex);
	});

	test("contains one layer per blob, darkest first", () => {
		const spec = generate("layers");
		const css = toCss(spec);
		expect(css.backgroundImage.match(/radial-gradient/g)).toHaveLength(
			spec.blobs.length,
		);
		const lastBlob = spec.blobs[spec.blobs.length - 1];
		expect(css.backgroundImage.indexOf(lastBlob?.color.hex ?? "")).toBeLessThan(
			css.backgroundImage.indexOf(spec.blobs[0]?.color.hex ?? ""),
		);
	});
});
