import type { HexColor } from "./color.ts";
import {
	type ColorStop,
	generatePalette,
	paletteFromHex,
	sequentialBaseHue,
} from "./palette.ts";
import { createRng, normalizeSeed, type Rng, type Seed } from "./prng.ts";

export interface GradientPoint {
	x: number;
	y: number;
}

export interface GradientField {
	x: number;
	y: number;
	points: GradientPoint[];
	feather: number;
	opacity: number;
	color: ColorStop;
}

export interface VignetteSpec {
	strength: number;
}

export interface GradientSpec {
	seed: string;
	background: ColorStop;
	palette: ColorStop[];
	fields: GradientField[];
	vignette: VignetteSpec | null;
}

export interface GenerateOptions {
	colors?: number;
	palette?: readonly HexColor[];
	vignette?: false | Partial<VignetteSpec>;
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function round(value: number, decimals = 4): number {
	const factor = 10 ** decimals;
	return Math.round(value * factor) / factor;
}

function organicPoints(
	rng: Rng,
	scaleX: number,
	scaleY: number,
	rotation: number,
): GradientPoint[] {
	const count = rng.int(10, 14);
	const phase = rng.range(0, Math.PI * 2);
	const harmonics = [
		{ frequency: 2, amplitude: rng.range(0.045, 0.11) },
		{ frequency: 3, amplitude: rng.range(0.02, 0.055) },
	];
	const cosRotation = Math.cos(rotation);
	const sinRotation = Math.sin(rotation);

	return Array.from({ length: count }, (_, index) => {
		const angle = phase + (index / count) * Math.PI * 2;
		let radius = rng.range(0.97, 1.03);
		for (const harmonic of harmonics) {
			radius +=
				Math.sin(angle * harmonic.frequency + phase) * harmonic.amplitude;
		}
		const localX = Math.cos(angle) * scaleX * radius;
		const localY = Math.sin(angle) * scaleY * radius;
		return {
			x: round(localX * cosRotation - localY * sinRotation),
			y: round(localX * sinRotation + localY * cosRotation),
		};
	});
}

function createField(
	rng: Rng,
	x: number,
	y: number,
	color: ColorStop,
	scale = 1,
): GradientField {
	const scaleX = rng.range(0.36, 0.58) * scale;
	const scaleY = rng.range(0.34, 0.56) * scale;
	return {
		x: round(clamp(x, -0.3, 1.3)),
		y: round(clamp(y, -0.3, 1.3)),
		points: organicPoints(rng, scaleX, scaleY, rng.range(0, Math.PI)),
		feather: round(rng.range(0.055, 0.095)),
		opacity: round(rng.range(0.88, 0.98)),
		color,
	};
}

function paletteIndex(
	fieldIndex: number,
	fieldCount: number,
	colorCount: number,
): number {
	if (fieldCount === 1) {
		return colorCount - 1;
	}
	return 1 + Math.round((fieldIndex / (fieldCount - 1)) * (colorCount - 2));
}

/** Generates a deterministic gradient spec from a seed. Same seed, same gradient — forever. */
export function generate(
	seed: Seed,
	options: GenerateOptions = {},
): GradientSpec {
	const rng = createRng(seed);
	const colorCount = options.palette
		? options.palette.length
		: clamp(Math.floor(options.colors ?? 4), 2, 8);
	const maximumFieldCount = Math.min(
		4,
		colorCount - 1,
		Math.max(1, Math.ceil((colorCount - 1) * 0.6)),
	);
	const generatedPalette = generatePalette(
		rng,
		colorCount,
		sequentialBaseHue(seed),
	);
	const palette = options.palette
		? paletteFromHex(options.palette)
		: generatedPalette;
	const fieldCount =
		maximumFieldCount <= 2
			? maximumFieldCount
			: rng.int(maximumFieldCount - 1, maximumFieldCount);
	const distribution = rng.pick(["sweep", "orbit", "tide"] as const);
	const fields: GradientField[] = [];

	if (distribution === "sweep") {
		const angle = rng.range(0, Math.PI * 2);
		const directionX = Math.cos(angle);
		const directionY = Math.sin(angle);
		const perpendicularX = -directionY;
		const perpendicularY = directionX;
		for (let index = 0; index < fieldCount; index++) {
			const progress = (index + 1) / (fieldCount + 1);
			const distance = (progress - 0.5) * 1.25;
			const offset = rng.range(-0.18, 0.18);
			fields.push(
				createField(
					rng,
					0.5 + directionX * distance + perpendicularX * offset,
					0.5 + directionY * distance + perpendicularY * offset,
					palette[paletteIndex(index, fieldCount, colorCount)] as ColorStop,
					rng.range(0.92, 1.1),
				),
			);
		}
	} else if (distribution === "orbit") {
		const centerX = rng.range(0.35, 0.65);
		const centerY = rng.range(0.35, 0.65);
		const start = rng.range(0, Math.PI * 2);
		for (let index = 0; index < fieldCount; index++) {
			const angle = start + (index / fieldCount) * Math.PI * 2;
			const radius = rng.range(0.25, 0.44);
			fields.push(
				createField(
					rng,
					centerX + Math.cos(angle) * radius,
					centerY + Math.sin(angle) * radius,
					palette[paletteIndex(index, fieldCount, colorCount)] as ColorStop,
					rng.range(0.88, 1.05),
				),
			);
		}
	} else {
		const vertical = rng.next() < 0.5;
		const direction = rng.next() < 0.5 ? -1 : 1;
		for (let index = 0; index < fieldCount; index++) {
			const progress = (index + 1) / (fieldCount + 1);
			const primary = direction > 0 ? progress : 1 - progress;
			const secondary = 0.5 + Math.sin(progress * Math.PI * 2) * 0.25;
			fields.push(
				createField(
					rng,
					vertical ? secondary : primary,
					vertical ? primary : secondary,
					palette[paletteIndex(index, fieldCount, colorCount)] as ColorStop,
					rng.range(0.92, 1.1),
				),
			);
		}
	}

	const vignette: VignetteSpec | null =
		options.vignette === false
			? null
			: { strength: round(options.vignette?.strength ?? 0.08) };

	return {
		seed: normalizeSeed(seed),
		background: palette[0] as ColorStop,
		palette,
		fields,
		vignette,
	};
}
