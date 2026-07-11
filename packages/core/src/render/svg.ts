import type { GradientSpec } from "../generate.ts";
import { hashString } from "../prng.ts";

export interface SvgOptions {
	width?: number;
	height?: number;
}

function fmt(value: number, decimals = 2): string {
	const f = 10 ** decimals;
	return String(Math.round(value * f) / f);
}

/** Renders a gradient spec to an SVG string. The reference renderer — includes warp. */
export function toSvg(spec: GradientSpec, options: SvgOptions = {}): string {
	const { width = 1000, height = 1000 } = options;
	const uid = `m${hashString(spec.seed).toString(36)}`;
	const maxDim = Math.max(width, height);

	const defs: string[] = [];
	const blobRects: string[] = [];

	spec.blobs.forEach((blob, i) => {
		const id = `${uid}-b${i}`;
		defs.push(
			`<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${fmt(blob.x * width)}" cy="${fmt(blob.y * height)}" r="${fmt(blob.radius * maxDim)}">` +
				`<stop offset="0" stop-color="${blob.color.hex}"/>` +
				`<stop offset="0.45" stop-color="${blob.color.hex}" stop-opacity="0.8"/>` +
				`<stop offset="1" stop-color="${blob.color.hex}" stop-opacity="0"/>` +
				`</radialGradient>`,
		);
		blobRects.push(
			`<rect x="-25%" y="-25%" width="150%" height="150%" fill="url(#${id})"/>`,
		);
	});

	let blobLayer = blobRects.join("");
	if (spec.warp) {
		const id = `${uid}-w`;
		defs.push(
			`<filter id="${id}" x="-25%" y="-25%" width="150%" height="150%">` +
				`<feTurbulence type="fractalNoise" baseFrequency="${fmt(spec.warp.frequency, 4)}" numOctaves="2" seed="${spec.warp.seed}" result="w"/>` +
				`<feDisplacementMap in="SourceGraphic" in2="w" scale="${fmt(spec.warp.scale * maxDim)}" xChannelSelector="R" yChannelSelector="G"/>` +
				`<feGaussianBlur stdDeviation="${fmt(0.025 * maxDim)}"/>` +
				`</filter>`,
		);
		blobLayer = `<g filter="url(#${id})">${blobLayer}</g>`;
	}

	let vignetteLayer = "";
	if (spec.vignette) {
		const id = `${uid}-v`;
		defs.push(
			`<radialGradient id="${id}" cx="0.5" cy="0.5" r="0.7">` +
				`<stop offset="0.6" stop-color="#000" stop-opacity="0"/>` +
				`<stop offset="1" stop-color="#000" stop-opacity="${fmt(spec.vignette.strength, 4)}"/>` +
				`</radialGradient>`,
		);
		vignetteLayer = `<rect width="${width}" height="${height}" fill="url(#${id})"/>`;
	}

	const content = `<rect width="${width}" height="${height}" fill="${spec.background.hex}"/>${blobLayer}${vignetteLayer}`;

	return (
		`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
		`<defs>${defs.join("")}</defs>` +
		content +
		`</svg>`
	);
}

/** Renders a gradient spec to a `data:image/svg+xml` URI, ready for `background-image` or `<img src>`. */
export function toSvgDataUri(
	spec: GradientSpec,
	options: SvgOptions = {},
): string {
	return `data:image/svg+xml,${encodeURIComponent(toSvg(spec, options))}`;
}
