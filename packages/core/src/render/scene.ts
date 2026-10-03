import type { HexColor, Oklch } from "../color.ts";
import { oklchToHex } from "../color.ts";
import type { GradientField, GradientSpec } from "../generate.ts";
import type { ColorStop } from "../palette.ts";
import { createRng, hashString, type Rng } from "../prng.ts";

export interface SceneStop {
	offset: number;
	color: HexColor;
	opacity: number;
}

export interface ScenePool {
	id: string;
	cx: number;
	cy: number;
	rx: number;
	ry: number;
	angle: number;
	stops: SceneStop[];
}

export interface Scene {
	width: number;
	height: number;
	uid: string;
	background: HexColor;
	flow: {
		id: string;
		x1: number;
		y1: number;
		x2: number;
		y2: number;
		stops: SceneStop[];
	};
	flowRect: { x: number; y: number; width: number; height: number };
	warp: {
		id: string;
		region: { x: number; y: number; width: number; height: number };
		frequencyX: number;
		frequencyY: number;
		seed: number;
		noiseBlur: number;
		displacement: number;
		diffusion: number;
	};
	pools: ScenePool[];
	vignette: { id: string; strength: number } | null;
	grain: { id: string; frequency: number; seed: number; opacity: number } | null;
}

export function round(value: number, decimals = 2): number {
	const factor = 10 ** decimals;
	return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function mixOklch(a: Oklch, b: Oklch, t: number): Oklch {
	const aRad = (a.h * Math.PI) / 180;
	const bRad = (b.h * Math.PI) / 180;
	const x = a.c * Math.cos(aRad) * (1 - t) + b.c * Math.cos(bRad) * t;
	const y = a.c * Math.sin(aRad) * (1 - t) + b.c * Math.sin(bRad) * t;
	const labChroma = Math.hypot(x, y);
	const linearChroma = a.c * (1 - t) + b.c * t;
	const hue =
		labChroma < 0.0001
			? a.h
			: (((Math.atan2(y, x) * 180) / Math.PI) % 360 + 360) % 360;
	return {
		l: a.l * (1 - t) + b.l * t,
		c: Math.max(labChroma, linearChroma * 0.82),
		h: hue,
	};
}

function adjust(color: Oklch, lightness: number, chroma: number): HexColor {
	return oklchToHex({
		l: clamp(color.l + lightness, 0, 1),
		c: clamp(color.c * chroma, 0, 0.32),
		h: color.h,
	});
}

function flowColors(spec: GradientSpec, hash: number): ColorStop[] {
	const accents = spec.palette.slice(1);
	if (hash % 2 !== 0) {
		accents.reverse();
	}
	const neutralIndex = Math.floor((accents.length + 1) / 2);
	const colors = [...accents];
	colors.splice(neutralIndex, 0, spec.background);
	return colors;
}

function flowStops(spec: GradientSpec, hash: number): SceneStop[] {
	const colors = flowColors(spec, hash);
	const weights = colors.map((color) =>
		color === spec.background ? 1.15 : 1,
	);
	const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
	const anchors: { offset: number; color: Oklch; hex: HexColor }[] = [];
	let cursor = 0;

	colors.forEach((color, index) => {
		const weight = weights[index] ?? 1;
		const start = cursor / totalWeight;
		const end = (cursor + weight) / totalWeight;
		if (color === spec.background) {
			const inset = Math.min(0.035, (end - start) * 0.18);
			anchors.push(
				{ offset: start + inset, color: color.oklch, hex: color.hex },
				{ offset: end - inset, color: color.oklch, hex: color.hex },
			);
		} else {
			const offset =
				index === 0 ? 0 : index === colors.length - 1 ? 1 : (start + end) / 2;
			anchors.push({ offset, color: color.oklch, hex: color.hex });
		}
		cursor += weight;
	});

	const stops: SceneStop[] = [];
	anchors.forEach((anchor, index) => {
		const next = anchors[index + 1];
		stops.push({ offset: round(anchor.offset, 4), color: anchor.hex, opacity: 1 });
		if (next && next.hex !== anchor.hex) {
			for (const t of [1 / 3, 2 / 3]) {
				stops.push({
					offset: round(anchor.offset + (next.offset - anchor.offset) * t, 4),
					color: oklchToHex(mixOklch(anchor.color, next.color, t)),
					opacity: 1,
				});
			}
		}
	});
	return stops;
}

function flowAngle(spec: GradientSpec, hash: number): number {
	const first = spec.fields[0];
	const last = spec.fields[spec.fields.length - 1];
	if (first && last && first !== last) {
		return Math.atan2(last.y - first.y, last.x - first.x);
	}
	return ((hash % 360) * Math.PI) / 180;
}

function fieldExtent(field: GradientField): [number, number] {
	let x = 0.2;
	let y = 0.2;
	for (const point of field.points) {
		x = Math.max(x, Math.abs(point.x));
		y = Math.max(y, Math.abs(point.y));
	}
	return [x, y];
}

const FALLOFF = [
	[0, 1],
	[0.28, 0.86],
	[0.55, 0.5],
	[0.78, 0.17],
	[1, 0],
] as const;

function pool(
	id: string,
	color: HexColor,
	opacity: number,
	cx: number,
	cy: number,
	rx: number,
	ry: number,
	angle: number,
): ScenePool {
	return {
		id,
		cx: round(cx),
		cy: round(cy),
		rx: round(rx),
		ry: round(ry),
		angle: round(angle),
		stops: FALLOFF.map(([offset, alpha]) => ({
			offset,
			color,
			opacity: round(alpha * opacity, 3),
		})),
	};
}

function pools(
	spec: GradientSpec,
	uid: string,
	width: number,
	height: number,
	rng: Rng,
): ScenePool[] {
	const size = Math.min(width, height);
	const result = spec.fields.map((field, index) => {
		const [ex, ey] = fieldExtent(field);
		const first = field.points[0];
		const angle = first ? (Math.atan2(first.y, first.x) * 180) / Math.PI : 0;
		return pool(
			`${uid}-p${index}`,
			adjust(field.color.oklch, -0.015, 1.18),
			field.opacity * 0.82,
			field.x * width,
			field.y * height,
			ex * size * 0.92,
			ey * size * 0.92,
			angle,
		);
	});

	const accents = spec.palette.slice(1);
	const brightest = accents.reduce(
		(best, color) => (color.oklch.l > best.oklch.l ? color : best),
		spec.background,
	);
	const deepest = accents.reduce(
		(best, color) => (color.oklch.l < best.oklch.l ? color : best),
		accents[0] ?? spec.background,
	);

	const shadeAngle = rng.range(0, Math.PI * 2);
	const shadeDistance = rng.range(0.24, 0.42);
	const deepHue =
		deepest.oklch.h > 65 && deepest.oklch.h < 125
			? deepest.oklch.h - 28
			: deepest.oklch.h;
	result.push(
		pool(
			`${uid}-d`,
			adjust({ ...deepest.oklch, h: deepHue }, -0.08, 1.4),
			rng.range(0.42, 0.56),
			(0.5 + Math.cos(shadeAngle) * shadeDistance) * width,
			(0.5 + Math.sin(shadeAngle) * shadeDistance) * height,
			size * rng.range(0.24, 0.34),
			size * rng.range(0.18, 0.28),
			rng.range(0, 180),
		),
	);

	const glowAngle = shadeAngle + Math.PI + rng.range(-0.7, 0.7);
	const glowDistance = rng.range(0.12, 0.3);
	result.push(
		pool(
			`${uid}-h`,
			oklchToHex({
				l: Math.max(0.965, brightest.oklch.l + 0.03),
				c: brightest.oklch.c * 0.45,
				h: brightest.oklch.h,
			}),
			rng.range(0.5, 0.66),
			(0.5 + Math.cos(glowAngle) * glowDistance) * width,
			(0.5 + Math.sin(glowAngle) * glowDistance) * height,
			size * rng.range(0.26, 0.36),
			size * rng.range(0.18, 0.26),
			rng.range(0, 180),
		),
	);
	return result;
}

/** Resolves a spec into the exact shapes and filter values both renderers draw. */
export function buildScene(
	spec: GradientSpec,
	width: number,
	height: number,
	grain: boolean,
): Scene {
	const hash = hashString(spec.seed);
	const rng = createRng(`${spec.seed}:surface`);
	const uid = `m${hash.toString(36)}`;
	const maximum = Math.max(width, height);
	const angle = flowAngle(spec, hash);
	const directionX = Math.cos(angle);
	const directionY = Math.sin(angle);
	const flowId = `${uid}-g`;
	const warpId = `${uid}-f`;
	const surface = pools(spec, uid, width, height, rng);

	return {
		width,
		height,
		uid,
		background: spec.background.hex,
		flow: {
			id: flowId,
			x1: round((0.5 - directionX * 0.62) * width),
			y1: round((0.5 - directionY * 0.62) * height),
			x2: round((0.5 + directionX * 0.62) * width),
			y2: round((0.5 + directionY * 0.62) * height),
			stops: flowStops(spec, hash),
		},
		flowRect: {
			x: round(-width * 0.5),
			y: round(-height * 0.5),
			width: width * 2,
			height: height * 2,
		},
		warp: {
			id: warpId,
			region: {
				x: round(-width * 0.6),
				y: round(-height * 0.6),
				width: round(width * 2.2),
				height: round(height * 2.2),
			},
			frequencyX: round((0.0012 + (hash % 9) / 10000) * (1000 / maximum), 6),
			frequencyY: round(
				(0.0012 + ((hash >>> 5) % 9) / 10000) * (1000 / maximum),
				6,
			),
			seed: (hash % 9999) + 1,
			noiseBlur: round(maximum * (0.003 + ((hash >>> 10) % 3) / 1000)),
			displacement: round(maximum * (0.42 + ((hash >>> 14) % 23) / 100)),
			diffusion: round(maximum * (0.036 + ((hash >>> 19) % 16) / 1000)),
		},
		pools: surface,
		vignette: spec.vignette
			? { id: `${uid}-v`, strength: round(spec.vignette.strength, 4) }
			: null,
		grain: grain
			? {
					id: `${uid}-n`,
					frequency: round(0.82, 3),
					seed: ((hash >>> 7) % 9999) + 1,
					opacity: 0.06,
				}
			: null,
	};
}
