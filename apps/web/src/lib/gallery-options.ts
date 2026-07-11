import type { GenerateOptions } from "@noyzi/core";

export const MIN_COLORS = 2;
export const MAX_COLORS = 8;

export const LAYOUTS = ["auto", "linear", "orbit", "scatter"] as const;
export type LayoutOption = (typeof LAYOUTS)[number];

export const ROUNDED = ["none", "sm", "md", "xl", "full"] as const;
export type RoundedOption = (typeof ROUNDED)[number];

export interface GalleryOptions {
	colors: number;
	layout: LayoutOption;
	rounded: RoundedOption;
	warp: boolean;
}

export const DEFAULT_GALLERY_OPTIONS: GalleryOptions = {
	colors: 6,
	layout: "auto",
	rounded: "md",
	warp: true,
};

/** Search params mirror `GalleryOptions`, with defaults omitted from the URL. */
export type GallerySearch = Partial<GalleryOptions>;

function isLayout(value: unknown): value is LayoutOption {
	return LAYOUTS.includes(value as LayoutOption);
}

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
	if (isLayout(search.layout) && search.layout !== "auto") {
		result.layout = search.layout;
	}
	if (isRounded(search.rounded) && search.rounded !== "md") {
		result.rounded = search.rounded;
	}
	if (search.warp === false || search.warp === "false") {
		result.warp = false;
	}

	return result;
}

export function resolveGalleryOptions(search: GallerySearch): GalleryOptions {
	return { ...DEFAULT_GALLERY_OPTIONS, ...search };
}

/** Strips defaults so the URL stays clean. */
export function toGallerySearch(options: GalleryOptions): GallerySearch {
	const search: GallerySearch = {};
	if (options.colors !== DEFAULT_GALLERY_OPTIONS.colors) {
		search.colors = options.colors;
	}
	if (options.layout !== DEFAULT_GALLERY_OPTIONS.layout) {
		search.layout = options.layout;
	}
	if (options.rounded !== DEFAULT_GALLERY_OPTIONS.rounded) {
		search.rounded = options.rounded;
	}
	if (options.warp !== DEFAULT_GALLERY_OPTIONS.warp) {
		search.warp = options.warp;
	}
	return search;
}

export function isDefaultGalleryOptions(options: GalleryOptions): boolean {
	return (
		options.colors === DEFAULT_GALLERY_OPTIONS.colors &&
		options.layout === DEFAULT_GALLERY_OPTIONS.layout &&
		options.rounded === DEFAULT_GALLERY_OPTIONS.rounded &&
		options.warp === DEFAULT_GALLERY_OPTIONS.warp
	);
}

export function toGenerateOptions(options: GalleryOptions): GenerateOptions {
	return {
		colors: options.colors,
		layout: options.layout === "auto" ? undefined : options.layout,
		warp: options.warp ? undefined : false,
	};
}

export const ROUNDED_CLASS: Record<RoundedOption, string> = {
	none: "rounded-none",
	sm: "rounded-lg",
	md: "rounded-2xl",
	xl: "rounded-[2.5rem]",
	full: "rounded-full",
};
