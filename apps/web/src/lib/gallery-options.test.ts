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
