import type { GradientSpec } from "../generate.ts";
import { hashString } from "../prng.ts";

export interface SvgOptions {
	width?: number;
	height?: number;
}

function fmt(value: number, decimals = 2): string {
	const factor = 10 ** decimals;
	return String(Math.round(value * factor) / factor);
}

function flowStops(spec: GradientSpec, hash: number): string {
	const accents = spec.palette.slice(1);
	if (hash % 2 !== 0) {
		accents.reverse();
	}
	const neutralIndex = Math.floor((accents.length + 1) / 2);
	const colors = [...accents];
	colors.splice(neutralIndex, 0, spec.background);
	const totalWeight = colors.length + 0.65;
	let cursor = 0;
	const stops: string[] = [];

	colors.forEach((color, index) => {
		const weight = color === spec.background ? 1.65 : 1;
		const start = cursor / totalWeight;
		const end = (cursor + weight) / totalWeight;

		if (color === spec.background) {
			const inset = Math.min(0.05, (end - start) * 0.22);
			stops.push(
				`<stop offset="${fmt(start + inset, 4)}" stop-color="${color.hex}"/>`,
				`<stop offset="${fmt(end - inset, 4)}" stop-color="${color.hex}"/>`,
			);
		} else {
			const offset =
				index === 0 ? 0 : index === colors.length - 1 ? 1 : (start + end) / 2;
			stops.push(
				`<stop offset="${fmt(offset, 4)}" stop-color="${color.hex}"/>`,
			);
		}

		cursor += weight;
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

/** Renders a gradient spec to an SVG string. */
export function toSvg(spec: GradientSpec, options: SvgOptions = {}): string {
	const { width = 1000, height = 1000 } = options;
	const hash = hashString(spec.seed);
	const uid = `m${hash.toString(36)}`;
	const maximum = Math.max(width, height);
	const angle = flowAngle(spec, hash);
	const directionX = Math.cos(angle);
	const directionY = Math.sin(angle);
	const x1 = (0.5 - directionX * 0.72) * width;
	const y1 = (0.5 - directionY * 0.72) * height;
	const x2 = (0.5 + directionX * 0.72) * width;
	const y2 = (0.5 + directionY * 0.72) * height;
	const frequencyX = 0.0012 + (hash % 9) / 10000;
	const frequencyY = 0.0012 + ((hash >>> 5) % 9) / 10000;
	const noiseBlur = maximum * (0.003 + ((hash >>> 10) % 3) / 1000);
	const displacement = maximum * (0.46 + ((hash >>> 14) % 23) / 100);
	const diffusion = maximum * (0.04 + ((hash >>> 19) % 16) / 1000);
	const gradientId = `${uid}-g`;
	const filterId = `${uid}-f`;
	const defs = [
		`<linearGradient id="${gradientId}" gradientUnits="userSpaceOnUse" x1="${fmt(x1)}" y1="${fmt(y1)}" x2="${fmt(x2)}" y2="${fmt(y2)}">${flowStops(spec, hash)}</linearGradient>`,
		`<filter id="${filterId}" x="-55%" y="-55%" width="210%" height="210%" color-interpolation-filters="sRGB"><feTurbulence type="turbulence" baseFrequency="${fmt(frequencyX, 5)} ${fmt(frequencyY, 5)}" numOctaves="1" seed="${(hash % 9999) + 1}" result="noise"/><feGaussianBlur in="noise" stdDeviation="${fmt(noiseBlur)}" result="softNoise"/><feDisplacementMap in="SourceGraphic" in2="softNoise" scale="${fmt(displacement)}" xChannelSelector="R" yChannelSelector="B" result="warped"/><feGaussianBlur in="warped" stdDeviation="${fmt(diffusion)}"/></filter>`,
	];

	let vignetteLayer = "";
	if (spec.vignette) {
		const vignetteId = `${uid}-v`;
		defs.push(
			`<radialGradient id="${vignetteId}" cx="0.5" cy="0.5" r="0.72"><stop offset="0.62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${fmt(spec.vignette.strength, 4)}"/></radialGradient>`,
		);
		vignetteLayer = `<rect width="${width}" height="${height}" fill="url(#${vignetteId})"/>`;
	}

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${defs.join("")}</defs><rect width="${width}" height="${height}" fill="${spec.background.hex}"/><rect x="-${width * 0.2}" y="-${height * 0.2}" width="${width * 1.4}" height="${height * 1.4}" fill="url(#${gradientId})" filter="url(#${filterId})"/>${vignetteLayer}</svg>`;
}

/** Renders a gradient spec to a `data:image/svg+xml` URI, ready for `background-image` or `<img src>`. */
export function toSvgDataUri(
	spec: GradientSpec,
	options: SvgOptions = {},
): string {
	return `data:image/svg+xml,${encodeURIComponent(toSvg(spec, options))}`;
}
