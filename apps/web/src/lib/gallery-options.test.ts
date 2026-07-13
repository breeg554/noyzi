import { describe, expect, test } from "bun:test";
import {
	DEFAULT_GALLERY_OPTIONS,
	isDefaultGalleryOptions,
	parseGallerySearch,
	resolveGalleryOptions,
	toGallerySearch,
	toGenerateOptions,
} from "./gallery-options.ts";

describe("gallery vignette options", () => {
	test("defaults to a subtle vignette", () => {
		expect(resolveGalleryOptions({}).vignette).toBe(0.08);
		expect(toGenerateOptions(DEFAULT_GALLERY_OPTIONS)).toEqual({
			colors: 4,
			vignette: { strength: 0.08 },
		});
	});

	test("parses and serializes custom vignette strength", () => {
		expect(parseGallerySearch({ vignette: 0.18 })).toEqual({
			vignette: 0.18,
		});
		expect(
			toGallerySearch({ ...DEFAULT_GALLERY_OPTIONS, vignette: 0.18 }),
		).toEqual({ vignette: 0.18 });
	});

	test("omits the default and rejects out-of-range values", () => {
		expect(parseGallerySearch({ vignette: 0.08 })).toEqual({});
		expect(parseGallerySearch({ vignette: -0.02 })).toEqual({});
		expect(parseGallerySearch({ vignette: 0.32 })).toEqual({});
	});

	test("zero disables the generated vignette", () => {
		const options = { ...DEFAULT_GALLERY_OPTIONS, vignette: 0 };
		expect(toGenerateOptions(options).vignette).toBe(false);
		expect(isDefaultGalleryOptions(options)).toBe(false);
	});
});

describe("gallery palette options", () => {
	test("parses and serializes a custom palette", () => {
		const palette = "#f5eee0,#8fb9be,#ebdac3";
		expect(parseGallerySearch({ palette })).toEqual({ palette });
		expect(
			toGallerySearch({
				...DEFAULT_GALLERY_OPTIONS,
				palette: ["#f5eee0", "#8fb9be", "#ebdac3"],
			}),
		).toEqual({ palette });
	});

	test("rejects malformed palettes", () => {
		expect(parseGallerySearch({ palette: "#fff" })).toEqual({});
		expect(parseGallerySearch({ palette: "#f5eee0,red" })).toEqual({});
		expect(
			parseGallerySearch({
				palette:
					"#000000,#111111,#222222,#333333,#444444,#555555,#666666,#777777,#888888",
			}),
		).toEqual({});
	});

	test("custom palette overrides generated color count", () => {
		const options = {
			...DEFAULT_GALLERY_OPTIONS,
			colors: 8,
			palette: ["#f5eee0", "#8fb9be", "#ebdac3"],
		} as const;
		expect(toGenerateOptions(options)).toEqual({
			palette: options.palette,
			vignette: { strength: 0.08 },
		});
		expect(isDefaultGalleryOptions(options)).toBe(false);
	});
});
