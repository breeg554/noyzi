import { describe, expect, test } from "bun:test";
import { generate, toCss, toSvg, toSvgDataUri } from "../src/index.ts";

describe("toSvg", () => {
	test("same seed produces identical svg", () => {
		expect(toSvg(generate("hello"))).toBe(toSvg(generate("hello")));
	});

	test("svg output is stable (frozen snapshot)", () => {
		expect(toSvg(generate("noyzi"))).toMatchSnapshot();
	});

	test("respects width and height", () => {
		const svg = toSvg(generate("size"), { width: 400, height: 300 });
		expect(svg).toContain('width="400"');
		expect(svg).toContain('height="300"');
		expect(svg).toContain('viewBox="0 0 400 300"');
	});

	test("contains one radial gradient per blob plus vignette", () => {
		const spec = generate("count");
		const svg = toSvg(spec);
		expect(svg.match(/<radialGradient/g)).toHaveLength(spec.blobs.length + 1);
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

	test("vignette is on by default", () => {
		const spec = generate("dirty");
		expect(spec.vignette).toEqual({ strength: 0.18 });
		const svg = toSvg(spec);
		expect(svg).toContain('stop-color="#000" stop-opacity="0.18"');
	});

	test("vignette can be disabled", () => {
		const svg = toSvg(generate("clean", { vignette: false }));
		expect(svg).not.toContain('stop-color="#000"');
	});

	test("vignette accepts custom strength", () => {
		const svg = toSvg(generate("dirty", { vignette: { strength: 0.3 } }));
		expect(svg).toContain('stop-opacity="0.3"');
	});

	test("vignette does not change blob geometry", () => {
		const clean = generate("stable", { vignette: false });
		const dirty = generate("stable");
		expect(dirty.blobs).toEqual(clean.blobs);
		expect(dirty.warp).toEqual(clean.warp);
	});

	test("dirty svg output is stable (frozen snapshot)", () => {
		expect(toSvg(generate("noyzi"))).toMatchSnapshot("dirty-default");
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
		expect(toCss(generate("noyzi"))).toMatchSnapshot();
	});

	test("background color matches spec", () => {
		const spec = generate("bg");
		expect(toCss(spec).backgroundColor).toBe(spec.background.hex);
	});

	test("contains one layer per blob plus vignette, darkest blob first", () => {
		const spec = generate("layers");
		const css = toCss(spec);
		expect(css.backgroundImage.match(/radial-gradient/g)).toHaveLength(
			spec.blobs.length + 1,
		);
		const lastBlob = spec.blobs[spec.blobs.length - 1];
		expect(css.backgroundImage.indexOf(lastBlob?.color.hex ?? "")).toBeLessThan(
			css.backgroundImage.indexOf(spec.blobs[0]?.color.hex ?? ""),
		);
	});

	test("includes vignette layer by default", () => {
		const css = toCss(generate("dirty"));
		expect(css.backgroundImage).toContain("rgba(0,0,0,0.18) 100%)");
	});

	test("omits vignette layer when disabled", () => {
		const css = toCss(generate("clean", { vignette: false }));
		expect(css.backgroundImage).not.toContain("rgba(0,0,0");
	});
});
