import { describe, expect, test } from "bun:test";
import {
	drawToCanvas,
	generate,
	hexToOklch,
	isSequentialSeed,
	oklchToHex,
	paletteFromSeed,
	seedHash,
	toBlob,
	toCanvas,
	toDataUrl,
} from "../src/index.ts";

describe("hexToOklch", () => {
	test("round-trips supported hex colors", () => {
		for (const color of ["#000000", "#ffffff", "#112233", "#abcdef"] as const) {
			expect(oklchToHex(hexToOklch(color))).toBe(color);
		}
		expect(oklchToHex(hexToOklch("#0f0"))).toBe("#00ff00");
	});
});

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
	test("defaults to four colors", () => {
		expect(paletteFromSeed("default")).toHaveLength(4);
	});

	test("is deterministic", () => {
		expect(paletteFromSeed("dawn")).toEqual(paletteFromSeed("dawn"));
	});

	test("returns the requested number of stops, clamped to 2..8", () => {
		expect(paletteFromSeed("x", 3)).toHaveLength(3);
		expect(paletteFromSeed("x")).toHaveLength(4);
		expect(paletteFromSeed("x", 0)).toHaveLength(2);
		expect(paletteFromSeed("x", 99)).toHaveLength(8);
	});

	test("matches the complete palette retained by generate", () => {
		const spec = generate("dawn", { colors: 6 });
		const palette = paletteFromSeed("dawn", 6);
		expect(spec.palette).toEqual(palette);
	});

	test("works with hashed seeds", () => {
		const seed = seedHash("dawid@example.com");
		const palette = paletteFromSeed(seed, 4);
		expect(palette).toHaveLength(4);
		for (const stop of palette) {
			expect(stop.hex).toMatch(/^#[0-9a-f]{6}$/);
		}
	});

	test("keeps every generated family soft and light", () => {
		for (const seed of ["red", "blue", "violet", "orange", "cyan"]) {
			const palette = paletteFromSeed(seed);
			for (const color of palette) {
				expect(color.oklch.l).toBeGreaterThanOrEqual(0.62);
				expect(color.oklch.c).toBeLessThanOrEqual(0.14);
			}
		}
	});

	test("keeps the neutral base distinctly luminous", () => {
		for (const seed of ["dune", "coastal", "earthy", "lavender", "sunset"]) {
			expect(paletteFromSeed(seed)[0]?.oklch.l).toBeGreaterThanOrEqual(0.88);
		}
	});
});

describe("raster renderers", () => {
	test("drawToCanvas rasterizes the exact sized SVG", async () => {
		let source = "";
		let draw: unknown[] = [];
		class TestImage {
			onload: (() => void) | null = null;
			onerror: (() => void) | null = null;

			set src(value: string) {
				source = value;
				queueMicrotask(() => this.onload?.());
			}
		}
		const globals = globalThis as typeof globalThis & { Image?: typeof Image };
		const previousImage = globals.Image;
		globals.Image = TestImage as unknown as typeof Image;
		const canvas = {
			width: 320,
			height: 180,
			getContext: () => ({
				drawImage: (...values: unknown[]) => {
					draw = values;
				},
			}),
		};

		try {
			const spec = generate("raster");
			await drawToCanvas(spec, canvas as unknown as HTMLCanvasElement, {
				width: 640,
				height: 360,
			});
			expect(decodeURIComponent(source)).toContain('width="640" height="360"');
			expect(draw.slice(1)).toEqual([0, 0, 320, 180]);
		} finally {
			if (previousImage) {
				globals.Image = previousImage;
			} else {
				delete globals.Image;
			}
		}
	});

	test("toBlob and toDataUrl encode the current SVG raster", async () => {
		class TestImage {
			onload: (() => void) | null = null;
			onerror: (() => void) | null = null;

			set src(_value: string) {
				queueMicrotask(() => this.onload?.());
			}
		}
		const canvas = {
			width: 0,
			height: 0,
			getContext: () => ({ drawImage: () => {} }),
			toBlob: (callback: (blob: Blob | null) => void, type?: string) =>
				callback(
					new Blob(["gradient"], type === undefined ? undefined : { type }),
				),
			toDataURL: (type?: string) => `data:${type};base64,Z3JhZGllbnQ=`,
		};
		const globals = globalThis as typeof globalThis & {
			Image?: typeof Image;
			document?: Document;
		};
		const previousImage = globals.Image;
		const previousDocument = globals.document;
		globals.Image = TestImage as unknown as typeof Image;
		globals.document = {
			createElement: () => canvas,
		} as unknown as Document;

		try {
			const spec = generate("encoding");
			const blob = await toBlob(spec, {
				width: 320,
				height: 180,
				type: "image/png",
			});
			const dataUrl = await toDataUrl(spec, {
				width: 320,
				height: 180,
				type: "image/png",
			});
			expect(blob.type).toBe("image/png");
			expect(dataUrl).toBe("data:image/png;base64,Z3JhZGllbnQ=");
			expect([canvas.width, canvas.height]).toEqual([320, 180]);
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

	test("toCanvas rejects outside a browser environment", () => {
		expect(toCanvas(generate("dawn"))).rejects.toThrow("browser environment");
	});

	test("toDataUrl rejects outside a browser environment", () => {
		expect(toDataUrl(generate("dawn"))).rejects.toThrow("browser environment");
	});
});
