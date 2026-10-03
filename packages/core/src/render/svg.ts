import type { HexColor, Oklch } from "../color.ts";
import { oklchToHex } from "../color.ts";
import type { GradientField, GradientSpec } from "../generate.ts";
import type { ColorStop } from "../palette.ts";
import { createRng, hashString, type Rng } from "../prng.ts";

export interface SvgOptions {
	width?: number;
	height?: number;
}

export interface SvgRenderSettings {
	grain: boolean;
}

function fmt(value: number, decimals = 2): string {
	const factor = 10 ** decimals;
	return String(Math.round(value * factor) / factor);
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

function flowStops(spec: GradientSpec, hash: number): string {
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

	const stops: string[] = [];
	anchors.forEach((anchor, index) => {
		const next = anchors[index + 1];
		stops.push(
			`<stop offset="${fmt(anchor.offset, 4)}" stop-color="${anchor.hex}"/>`,
		);
		if (next && next.hex !== anchor.hex) {
			for (const t of [1 / 3, 2 / 3]) {
				const mixed = oklchToHex(mixOklch(anchor.color, next.color, t));
				const offset = anchor.offset + (next.offset - anchor.offset) * t;
				stops.push(
					`<stop offset="${fmt(offset, 4)}" stop-color="${mixed}"/>`,
				);
			}
		}
	});
	return stops.join("");
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

function pool(
	id: string,
	color: HexColor,
	opacity: number,
	cx: number,
	cy: number,
	rx: number,
	ry: number,
	angle: number,
): { def: string; layer: string } {
	const falloff = [
		[0, 1],
		[0.28, 0.86],
		[0.55, 0.5],
		[0.78, 0.17],
		[1, 0],
	] as const;
	const stops = falloff
		.map(
			([offset, alpha]) =>
				`<stop offset="${offset}" stop-color="${color}" stop-opacity="${fmt(alpha * opacity, 3)}"/>`,
		)
		.join("");
	return {
		def: `<radialGradient id="${id}">${stops}</radialGradient>`,
		layer: `<ellipse cx="${fmt(cx)}" cy="${fmt(cy)}" rx="${fmt(rx)}" ry="${fmt(ry)}" transform="rotate(${fmt(angle)} ${fmt(cx)} ${fmt(cy)})" fill="url(#${id})"/>`,
	};
}

function poolLayers(
	spec: GradientSpec,
	uid: string,
	width: number,
	height: number,
	rng: Rng,
): { defs: string[]; layers: string[] } {
	const defs: string[] = [];
	const layers: string[] = [];
	const size = Math.min(width, height);

	spec.fields.forEach((field, index) => {
		const [ex, ey] = fieldExtent(field);
		const first = field.points[0];
		const angle = first ? (Math.atan2(first.y, first.x) * 180) / Math.PI : 0;
		const item = pool(
			`${uid}-p${index}`,
			adjust(field.color.oklch, -0.015, 1.18),
			field.opacity * 0.82,
			field.x * width,
			field.y * height,
			ex * size * 0.92,
			ey * size * 0.92,
			angle,
		);
		defs.push(item.def);
		layers.push(item.layer);
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
	const shade = pool(
		`${uid}-d`,
		adjust({ ...deepest.oklch, h: deepHue }, -0.08, 1.4),
		rng.range(0.42, 0.56),
		(0.5 + Math.cos(shadeAngle) * shadeDistance) * width,
		(0.5 + Math.sin(shadeAngle) * shadeDistance) * height,
		size * rng.range(0.24, 0.34),
		size * rng.range(0.18, 0.28),
		rng.range(0, 180),
	);

	const glowAngle = shadeAngle + Math.PI + rng.range(-0.7, 0.7);
	const glowDistance = rng.range(0.12, 0.3);
	const glow = pool(
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
	);

	defs.push(shade.def, glow.def);
	layers.push(shade.layer, glow.layer);
	return { defs, layers };
}

/** Internal SVG renderer with optional film grain. */
export function renderSvg(
	spec: GradientSpec,
	options: SvgOptions,
	settings: SvgRenderSettings,
): string {
	const { width = 1000, height = 1000 } = options;
	const hash = hashString(spec.seed);
	const rng = createRng(`${spec.seed}:surface`);
	const uid = `m${hash.toString(36)}`;
	const maximum = Math.max(width, height);
	const angle = flowAngle(spec, hash);
	const directionX = Math.cos(angle);
	const directionY = Math.sin(angle);
	const x1 = (0.5 - directionX * 0.62) * width;
	const y1 = (0.5 - directionY * 0.62) * height;
	const x2 = (0.5 + directionX * 0.62) * width;
	const y2 = (0.5 + directionY * 0.62) * height;
	const frequencyX = (0.0012 + (hash % 9) / 10000) * (1000 / maximum);
	const frequencyY = (0.0012 + ((hash >>> 5) % 9) / 10000) * (1000 / maximum);
	const noiseBlur = maximum * (0.003 + ((hash >>> 10) % 3) / 1000);
	const displacement = maximum * (0.42 + ((hash >>> 14) % 23) / 100);
	const diffusion = maximum * (0.036 + ((hash >>> 19) % 16) / 1000);
	const gradientId = `${uid}-g`;
	const filterId = `${uid}-f`;
	const pools = poolLayers(spec, uid, width, height, rng);
	const defs = [
		`<linearGradient id="${gradientId}" gradientUnits="userSpaceOnUse" x1="${fmt(x1)}" y1="${fmt(y1)}" x2="${fmt(x2)}" y2="${fmt(y2)}">${flowStops(spec, hash)}</linearGradient>`,
		`<filter id="${filterId}" filterUnits="userSpaceOnUse" x="${fmt(-width * 0.6)}" y="${fmt(-height * 0.6)}" width="${fmt(width * 2.2)}" height="${fmt(height * 2.2)}" color-interpolation-filters="sRGB"><feTurbulence type="turbulence" baseFrequency="${fmt(frequencyX, 6)} ${fmt(frequencyY, 6)}" numOctaves="1" seed="${(hash % 9999) + 1}" result="noise"/><feGaussianBlur in="noise" stdDeviation="${fmt(noiseBlur)}" result="softNoise"/><feDisplacementMap in="SourceGraphic" in2="softNoise" scale="${fmt(displacement)}" xChannelSelector="R" yChannelSelector="B" result="warped"/><feGaussianBlur in="warped" stdDeviation="${fmt(diffusion)}"/></filter>`,
		...pools.defs,
	];

	let vignetteLayer = "";
	if (spec.vignette) {
		const vignetteId = `${uid}-v`;
		defs.push(
			`<radialGradient id="${vignetteId}" cx="0.5" cy="0.5" r="0.72"><stop offset="0.62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${fmt(spec.vignette.strength, 4)}"/></radialGradient>`,
		);
		vignetteLayer = `<rect width="${width}" height="${height}" fill="url(#${vignetteId})"/>`;
	}

	let grainLayer = "";
	if (settings.grain) {
		const grainId = `${uid}-n`;
		const grainFrequency = 0.82;
		const grainSeed = ((hash >>> 7) % 9999) + 1;
		defs.push(
			`<filter id="${grainId}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="${fmt(grainFrequency, 3)}" numOctaves="2" seed="${grainSeed}" stitchTiles="stitch" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -1.6 0 0 0 1.05" result="dark"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 1.6 0 0 0 -0.55" result="light"/><feMerge><feMergeNode in="dark"/><feMergeNode in="light"/></feMerge></filter>`,
		);
		grainLayer = `<rect width="${width}" height="${height}" opacity="0.06" filter="url(#${grainId})"/>`;
	}

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${defs.join("")}</defs><rect width="${width}" height="${height}" fill="${spec.background.hex}"/><g filter="url(#${filterId})"><rect x="${fmt(-width * 0.5)}" y="${fmt(-height * 0.5)}" width="${width * 2}" height="${height * 2}" fill="url(#${gradientId})"/>${pools.layers.join("")}</g>${vignetteLayer}${grainLayer}</svg>`;
}

/** Renders a gradient spec to an SVG string. */
export function toSvg(spec: GradientSpec, options: SvgOptions = {}): string {
	return renderSvg(spec, options, { grain: true });
}

/** Renders a gradient spec to a `data:image/svg+xml` URI, ready for `background-image` or `<img src>`. */
export function toSvgDataUri(
	spec: GradientSpec,
	options: SvgOptions = {},
): string {
	return `data:image/svg+xml,${encodeURIComponent(toSvg(spec, options))}`;
}
