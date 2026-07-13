import type { GenerateOptions } from "@noyzi/core";

export const MIN_COLORS = 2;
export const MAX_COLORS = 8;

export const ROUNDED = ["none", "sm", "md", "xl", "full"] as const;
export type RoundedOption = (typeof ROUNDED)[number];

export interface GalleryOptions {
	colors: number;
	rounded: RoundedOption;
	vignette: number;
}

export const DEFAULT_GALLERY_OPTIONS: GalleryOptions = {
	colors: 4,
	rounded: "md",
	vignette: 0.08,
};

export type GallerySearch = Partial<GalleryOptions>;

function isRounded(value: unknown): value is RoundedOption {
	return ROUNDED.includes(value as RoundedOption);
}

export function parseGallerySearch(
	search: Record<string, unknown>,
): GallerySearch {
	const result: GallerySearch = {};
	const colors = Number(search.colors);
	if (
		Number.isInteger(colors) &&
		colors >= MIN_COLORS &&
		colors <= MAX_COLORS &&
		colors !== DEFAULT_GALLERY_OPTIONS.colors
	) {
		result.colors = colors;
	}
	if (
		isRounded(search.rounded) &&
		search.rounded !== DEFAULT_GALLERY_OPTIONS.rounded
	) {
		result.rounded = search.rounded;
	}
	const vignette = Number(search.vignette);
	if (
		Number.isFinite(vignette) &&
		vignette >= 0 &&
		vignette <= 0.3 &&
		vignette !== DEFAULT_GALLERY_OPTIONS.vignette
	) {
		result.vignette = vignette;
	}
	return result;
}

export function resolveGalleryOptions(search: GallerySearch): GalleryOptions {
	return { ...DEFAULT_GALLERY_OPTIONS, ...search };
}

export function toGallerySearch(options: GalleryOptions): GallerySearch {
	const search: GallerySearch = {};
	if (options.colors !== DEFAULT_GALLERY_OPTIONS.colors)
		search.colors = options.colors;
	if (options.rounded !== DEFAULT_GALLERY_OPTIONS.rounded)
		search.rounded = options.rounded;
	if (options.vignette !== DEFAULT_GALLERY_OPTIONS.vignette)
		search.vignette = options.vignette;
	return search;
}

export function isDefaultGalleryOptions(options: GalleryOptions): boolean {
	return (
		options.colors === DEFAULT_GALLERY_OPTIONS.colors &&
		options.rounded === DEFAULT_GALLERY_OPTIONS.rounded &&
		options.vignette === DEFAULT_GALLERY_OPTIONS.vignette
	);
}

export function toGenerateOptions(options: GalleryOptions): GenerateOptions {
	return {
		colors: options.colors,
		vignette: options.vignette === 0 ? false : { strength: options.vignette },
	};
}

export const ROUNDED_CLASS: Record<RoundedOption, string> = {
	none: "rounded-none",
	sm: "rounded-lg",
	md: "rounded-2xl",
	xl: "rounded-[2.5rem]",
	full: "rounded-full",
};
