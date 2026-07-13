import { type HexColor, hexToOklch, type Oklch, oklchToHex } from "./color.ts";
import {
	createRng,
	isSequentialSeed,
	normalizeSeed,
	type Rng,
	type Seed,
} from "./prng.ts";

export interface ColorStop {
	hex: HexColor;
	oklch: Oklch;
}

function normalizeHex(color: HexColor): HexColor {
	const hex = color.toLowerCase();
	if (hex.length === 4) {
		return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
	}
	return hex as HexColor;
}

/** Creates color stops from 2–8 hex colors. */
export function paletteFromHex(colors: readonly HexColor[]): ColorStop[] {
	if (colors.length < 2 || colors.length > 8) {
		throw new RangeError("palette must contain between 2 and 8 colors");
	}

	return colors.map((color) => ({
		hex: normalizeHex(color),
		oklch: hexToOklch(color),
	}));
}

interface PaletteFamily {
	colors: Oklch[];
	name: "dune" | "coastal" | "earthy" | "lavender" | "sunset-mist";
}

const PALETTE_FAMILIES: readonly PaletteFamily[] = [
	{
		name: "dune",
		colors: [
			{ l: 0.945, c: 0.025, h: 78 },
			{ l: 0.79, c: 0.1, h: 35 },
			{ l: 0.84, c: 0.075, h: 68 },
			{ l: 0.76, c: 0.105, h: 25 },
			{ l: 0.87, c: 0.055, h: 52 },
			{ l: 0.81, c: 0.08, h: 82 },
			{ l: 0.75, c: 0.09, h: 18 },
			{ l: 0.9, c: 0.04, h: 63 },
		],
	},
	{
		name: "coastal",
		colors: [
			{ l: 0.94, c: 0.018, h: 83 },
			{ l: 0.79, c: 0.045, h: 170 },
			{ l: 0.73, c: 0.065, h: 225 },
			{ l: 0.84, c: 0.04, h: 195 },
			{ l: 0.68, c: 0.085, h: 245 },
			{ l: 0.86, c: 0.035, h: 105 },
			{ l: 0.76, c: 0.05, h: 205 },
			{ l: 0.88, c: 0.035, h: 75 },
		],
	},
	{
		name: "earthy",
		colors: [
			{ l: 0.92, c: 0.032, h: 78 },
			{ l: 0.68, c: 0.055, h: 112 },
			{ l: 0.77, c: 0.095, h: 55 },
			{ l: 0.72, c: 0.065, h: 88 },
			{ l: 0.83, c: 0.055, h: 72 },
			{ l: 0.64, c: 0.06, h: 125 },
			{ l: 0.74, c: 0.09, h: 42 },
			{ l: 0.86, c: 0.045, h: 92 },
		],
	},
	{
		name: "lavender",
		colors: [
			{ l: 0.935, c: 0.022, h: 54 },
			{ l: 0.75, c: 0.065, h: 305 },
			{ l: 0.78, c: 0.055, h: 270 },
			{ l: 0.84, c: 0.07, h: 28 },
			{ l: 0.81, c: 0.05, h: 325 },
			{ l: 0.72, c: 0.06, h: 285 },
			{ l: 0.86, c: 0.055, h: 15 },
			{ l: 0.82, c: 0.04, h: 255 },
		],
	},
	{
		name: "sunset-mist",
		colors: [
			{ l: 0.91, c: 0.05, h: 42 },
			{ l: 0.74, c: 0.13, h: 28 },
			{ l: 0.66, c: 0.075, h: 330 },
			{ l: 0.79, c: 0.105, h: 45 },
			{ l: 0.7, c: 0.085, h: 350 },
			{ l: 0.76, c: 0.115, h: 20 },
			{ l: 0.63, c: 0.07, h: 315 },
			{ l: 0.81, c: 0.09, h: 55 },
		],
	},
];

const GOLDEN_ANGLE = 137.50776405003785;

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function wrapHue(hue: number): number {
	return ((hue % 360) + 360) % 360;
}

function round(value: number, decimals = 4): number {
	const factor = 10 ** decimals;
	return Math.round(value * factor) / factor;
}

/** Returns a golden-angle hue for integer-like seeds and `undefined` for other seeds. */
export function sequentialBaseHue(seed: Seed): number | undefined {
	if (!isSequentialSeed(seed)) {
		return undefined;
	}
	return round(wrapHue(Number(normalizeSeed(seed)) * GOLDEN_ANGLE));
}

export function generatePalette(
	rng: Rng,
	count: number,
	baseHue?: number,
): ColorStop[] {
	const randomFamily = rng.int(0, PALETTE_FAMILIES.length - 1);
	const familyIndex =
		baseHue === undefined
			? randomFamily
			: Math.floor(baseHue / (360 / PALETTE_FAMILIES.length)) %
				PALETTE_FAMILIES.length;
	const family = PALETTE_FAMILIES[familyIndex] as PaletteFamily;
	const accentOffset = rng.int(0, family.colors.length - 2);

	return Array.from({ length: count }, (_, index) => {
		const colorIndex =
			index === 0
				? 0
				: 1 + ((index - 1 + accentOffset) % (family.colors.length - 1));
		const source = family.colors[colorIndex] as Oklch;
		const lightnessJitter = rng.range(-0.018, 0.018);
		const chromaJitter = rng.range(-0.008, 0.008);
		const hueJitter = rng.range(-4, 4);
		const oklch: Oklch = {
			l: round(clamp(source.l + lightnessJitter, 0.62, 0.95)),
			c: round(clamp(source.c + chromaJitter, 0.02, 0.14)),
			h: round(wrapHue(source.h + hueJitter)),
		};
		return { hex: oklchToHex(oklch), oklch };
	});
}

/** Returns a seed's deterministic palette family. Count is clamped to 2..8. */
export function paletteFromSeed(seed: Seed, count = 4): ColorStop[] {
	const clamped = Math.min(8, Math.max(2, Math.floor(count)));
	return generatePalette(createRng(seed), clamped, sequentialBaseHue(seed));
}
