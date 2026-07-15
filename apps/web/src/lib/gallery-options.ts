import type { GenerateOptions, HexColor } from "@noyzi/core";

export const MIN_COLORS = 2;
export const MAX_COLORS = 8;

export const ROUNDED = ["none", "sm", "md", "xl", "full"] as const;
export type RoundedOption = (typeof ROUNDED)[number];

export interface GalleryOptions {
	animated: boolean;
	colors: number;
	palette: readonly HexColor[] | null;
	rounded: RoundedOption;
	vignette: number;
}

export const DEFAULT_GALLERY_OPTIONS: GalleryOptions = {
	animated: false,
	colors: 4,
	palette: null,
	rounded: "md",
	vignette: 0.08,
};

export interface GallerySearch {
	animated?: boolean;
	colors?: number;
	palette?: string;
	rounded?: RoundedOption;
	vignette?: number;
}

function isRounded(value: unknown): value is RoundedOption {
	return ROUNDED.includes(value as RoundedOption);
}

function parsePalette(value: unknown): readonly HexColor[] | null {
	if (typeof value !== "string") return null;
	const colors = value.split(",");
	if (colors.length < MIN_COLORS || colors.length > MAX_COLORS) return null;
	if (!colors.every((color) => /^#[\da-f]{6}$/i.test(color))) return null;
	return colors.map((color) => color.toLowerCase() as HexColor);
}

export function parseGallerySearch(
	search: Record<string, unknown>,
): GallerySearch {
	const result: GallerySearch = {};
	if (
		search.animated === true ||
		search.animated === "true" ||
		search.animated === 1 ||
		search.animated === "1"
	) {
		result.animated = true;
	}
	const colors = Number(search.colors);
	if (
		Number.isInteger(colors) &&
		colors >= MIN_COLORS &&
		colors <= MAX_COLORS &&
		colors !== DEFAULT_GALLERY_OPTIONS.colors
	) {
		result.colors = colors;
	}
	const palette = parsePalette(search.palette);
	if (palette) result.palette = palette.join(",");
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
	return {
		...DEFAULT_GALLERY_OPTIONS,
		...search,
		palette: parsePalette(search.palette),
	};
}

export function toGallerySearch(options: GalleryOptions): GallerySearch {
	const search: GallerySearch = {};
	if (options.animated) search.animated = true;
	if (options.colors !== DEFAULT_GALLERY_OPTIONS.colors)
		search.colors = options.colors;
	if (options.palette) search.palette = options.palette.join(",");
	if (options.rounded !== DEFAULT_GALLERY_OPTIONS.rounded)
		search.rounded = options.rounded;
	if (options.vignette !== DEFAULT_GALLERY_OPTIONS.vignette)
		search.vignette = options.vignette;
	return search;
}

export function isDefaultGalleryOptions(options: GalleryOptions): boolean {
	return (
		options.animated === DEFAULT_GALLERY_OPTIONS.animated &&
		options.colors === DEFAULT_GALLERY_OPTIONS.colors &&
		options.palette === DEFAULT_GALLERY_OPTIONS.palette &&
		options.rounded === DEFAULT_GALLERY_OPTIONS.rounded &&
		options.vignette === DEFAULT_GALLERY_OPTIONS.vignette
	);
}

export function toGenerateOptions(options: GalleryOptions): GenerateOptions {
	return {
		...(options.palette
			? { palette: options.palette }
			: { colors: options.colors }),
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
