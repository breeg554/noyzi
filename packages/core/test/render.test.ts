import { describe, expect, test } from "bun:test";
import {
	createAnimatedCanvasGroup,
	drawToAnimatedCanvas,
	generate,
	toAnimatedCanvas,
	toCss,
	toSvg,
	toSvgDataUri,
} from "../src/index.ts";

describe("animated canvas renderers", () => {
	test("rejects motion values outside the supported ranges", async () => {
		const canvas = {} as HTMLCanvasElement;
		await expect(
			drawToAnimatedCanvas(generate("invalid-strength"), canvas, {
				strength: 15,
			}),
		).rejects.toThrow("strength must be a finite number between 0 and 3");
		await expect(
			drawToAnimatedCanvas(generate("invalid-speed"), canvas, {
				speed: Number.NaN,
			}),
		).rejects.toThrow("speed must be a finite number between 0 and 10");
	});

	test("shared canvas groups reject outside a browser environment", () => {
		expect(() => createAnimatedCanvasGroup()).toThrow(
			"createAnimatedCanvasGroup requires a browser environment",
		);
	});

	test("returns null when WebGL 2 is unavailable", async () => {
		let imageSource = "";
		const textureCanvas = {
			height: 0,
			getContext: () => ({ drawImage: () => {} }),
			width: 0,
		} as unknown as HTMLCanvasElement;
		class TestImage {
			onload: (() => void) | null = null;
			onerror: (() => void) | null = null;

			set src(value: string) {
				imageSource = value;
				queueMicrotask(() => this.onload?.());
			}
		}
		const globals = globalThis as typeof globalThis & {
			document?: Document;
			Image?: typeof Image;
		};
		const previousImage = globals.Image;
		const previousDocument = globals.document;
		globals.Image = TestImage as unknown as typeof Image;
		globals.document = {
			createElement: () => textureCanvas,
		} as unknown as Document;
		const canvas = {
			width: 1000,
			height: 1000,
			getBoundingClientRect: () => ({ height: 40, width: 80 }),
			getContext: () => null,
		} as unknown as HTMLCanvasElement;

		try {
			expect(
				await drawToAnimatedCanvas(generate("fallback"), canvas, {
					maxPixelRatio: 1,
				}),
			).toBeNull();
			expect(canvas.width).toBe(80);
			expect(canvas.height).toBe(40);
			expect(textureCanvas.width).toBe(80);
			expect(textureCanvas.height).toBe(80);
			expect(decodeURIComponent(imageSource)).toContain('width="1000"');
			expect(decodeURIComponent(imageSource)).toContain('height="1000"');
		} finally {
			if (previousImage) {
				globals.Image = previousImage;
			} else {
				delete globals.Image;
			}
			if (previousDocument) {
				globals.document = previousDocument;
			} else {
				delete globals.document;
			}
		}
	});

	test("toAnimatedCanvas rejects outside a browser environment", async () => {
		await expect(toAnimatedCanvas(generate("server"))).rejects.toThrow(
			"toAnimatedCanvas requires a browser environment",
		);
	});
});

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

	test("renders one continuous noise-warped color surface", () => {
		const svg = toSvg(generate("count"));
		expect(svg.match(/<linearGradient/g)).toHaveLength(1);
		expect(svg.match(/<feTurbulence/g)).toHaveLength(1);
		expect(svg.match(/<feDisplacementMap/g)).toHaveLength(1);
		expect(svg.match(/<feGaussianBlur/g)).toHaveLength(2);
		expect(svg).not.toContain("<path ");
	});

	test("renders every requested palette color", () => {
		for (const count of [2, 4, 6, 8]) {
			const spec = generate("palette-count", {
				colors: count,
				vignette: false,
			});
			const svg = toSvg(spec);
			expect(svg.match(/<stop /g)).toHaveLength(count + 1);
			for (const color of spec.palette) {
				expect(svg).toContain(color.hex);
			}
		}
	});

	test("gradient ids are namespaced per seed", () => {
		const a = toSvg(generate("a"));
		const b = toSvg(generate("b"));
		const idOf = (svg: string) => svg.match(/id="(m[^-"]+)-g"/)?.[1];
		expect(idOf(a)).toBeDefined();
		expect(idOf(a)).not.toBe(idOf(b));
	});

	test("vignette is on by default", () => {
		const spec = generate("dirty");
		expect(spec.vignette).toEqual({ strength: 0.08 });
		const svg = toSvg(spec);
		expect(svg).toContain('stop-color="#000" stop-opacity="0.08"');
	});

	test("vignette can be disabled", () => {
		const svg = toSvg(generate("clean", { vignette: false }));
		expect(svg).not.toContain('stop-color="#000"');
	});

	test("vignette accepts custom strength", () => {
		const svg = toSvg(generate("dirty", { vignette: { strength: 0.3 } }));
		expect(svg).toContain('stop-opacity="0.3"');
	});

	test("vignette does not change field geometry", () => {
		const clean = generate("stable", { vignette: false });
		const dirty = generate("stable");
		expect(dirty.fields).toEqual(clean.fields);
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

	test("preserves SVG dimensions in the encoded output", () => {
		const spec = generate("sized-uri");
		const options = { width: 640, height: 360 };
		const uri = toSvgDataUri(spec, options);
		expect(decodeURIComponent(uri.slice("data:image/svg+xml,".length))).toBe(
			toSvg(spec, options),
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

	test("embeds the exact organic svg renderer", () => {
		const spec = generate("layers");
		const css = toCss(spec);
		expect(css.backgroundImage).toBe(`url("${toSvgDataUri(spec)}")`);
		expect(decodeURIComponent(css.backgroundImage)).toContain(
			"<feGaussianBlur",
		);
		expect(decodeURIComponent(css.backgroundImage)).toContain("<feTurbulence");
		expect(decodeURIComponent(css.backgroundImage)).toContain(
			spec.background.hex,
		);
	});

	test("forwards artwork dimensions and includes complete background sizing", () => {
		const spec = generate("sized-css");
		const options = { width: 480, height: 320 };
		const css = toCss(spec, options);
		expect(css).toEqual({
			backgroundColor: spec.background.hex,
			backgroundImage: `url("${toSvgDataUri(spec, options)}")`,
			backgroundPosition: "center",
			backgroundRepeat: "no-repeat",
			backgroundSize: "100% 100%",
		});
	});

	test("includes vignette layer by default", () => {
		const css = toCss(generate("dirty"));
		expect(decodeURIComponent(css.backgroundImage)).toContain(
			'stop-opacity="0.08"',
		);
	});

	test("omits vignette layer when disabled", () => {
		const css = toCss(generate("clean", { vignette: false }));
		expect(decodeURIComponent(css.backgroundImage)).not.toContain(
			'stop-color="#000"',
		);
	});
});
