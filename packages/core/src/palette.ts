import { type Oklch, oklchToHex } from "./color.ts";
import { createRng, type Rng, type Seed } from "./prng.ts";

export interface ColorStop {
	hex: string;
	oklch: Oklch;
}

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

function wrapHue(h: number): number {
	return ((h % 360) + 360) % 360;
}

function round(value: number, decimals = 4): number {
	const f = 10 ** decimals;
	return Math.round(value * f) / f;
}

export function generatePalette(rng: Rng, count: number): ColorStop[] {
	const baseHue = rng.range(0, 360);
	const drift = rng.range(100, 240) * (rng.next() < 0.5 ? -1 : 1);
	const lightStart = rng.range(0.82, 0.9);
	const lightEnd = rng.range(0.35, 0.5);
	const chromaBase = rng.range(0.04, 0.075);
	const chromaPeak = chromaBase + rng.range(0.03, 0.07);

	const stops: ColorStop[] = [];
	for (let i = 0; i < count; i++) {
		const t = count === 1 ? 0 : i / (count - 1);
		const l = lerp(lightStart, lightEnd, t ** 1.15);
		const c = lerp(chromaBase, chromaPeak, Math.sin(t * Math.PI));
		const h = wrapHue(baseHue + drift * t + rng.range(-16, 16));
		const oklch: Oklch = { l: round(l), c: round(c), h: round(h) };
		stops.push({ hex: oklchToHex(oklch), oklch });
	}
	return stops;
}

/** Returns the exact color stops a seed's gradient uses: `[background, ...blobColors]`. Count is clamped to 2..8. */
export function paletteFromSeed(seed: Seed, count = 6): ColorStop[] {
	const clamped = Math.min(8, Math.max(2, Math.floor(count)));
	return generatePalette(createRng(seed), clamped);
}
