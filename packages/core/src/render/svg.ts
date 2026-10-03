import type { GradientSpec } from "../generate.ts";
import { buildScene, type SceneStop } from "./scene.ts";

export interface SvgOptions {
	width?: number;
	height?: number;
}

export interface SvgRenderSettings {
	grain: boolean;
}

function stops(list: SceneStop[], opacity: boolean): string {
	return list
		.map(
			(stop) =>
				`<stop offset="${stop.offset}" stop-color="${stop.color}"${opacity ? ` stop-opacity="${stop.opacity}"` : ""}/>`,
		)
		.join("");
}

/** Internal SVG renderer with optional film grain. */
export function renderSvg(
	spec: GradientSpec,
	options: SvgOptions,
	settings: SvgRenderSettings,
): string {
	const { width = 1000, height = 1000 } = options;
	const scene = buildScene(spec, width, height, settings.grain);
	const { flow, flowRect, warp, vignette, grain } = scene;
	const region = warp.region;
	const defs = [
		`<linearGradient id="${flow.id}" gradientUnits="userSpaceOnUse" x1="${flow.x1}" y1="${flow.y1}" x2="${flow.x2}" y2="${flow.y2}">${stops(flow.stops, false)}</linearGradient>`,
		`<filter id="${warp.id}" filterUnits="userSpaceOnUse" x="${region.x}" y="${region.y}" width="${region.width}" height="${region.height}" color-interpolation-filters="sRGB"><feTurbulence type="turbulence" baseFrequency="${warp.frequencyX} ${warp.frequencyY}" numOctaves="1" seed="${warp.seed}" result="noise"/><feGaussianBlur in="noise" stdDeviation="${warp.noiseBlur}" result="softNoise"/><feDisplacementMap in="SourceGraphic" in2="softNoise" scale="${warp.displacement}" xChannelSelector="R" yChannelSelector="B" result="warped"/><feGaussianBlur in="warped" stdDeviation="${warp.diffusion}"/></filter>`,
		...scene.pools.map(
			(pool) => `<radialGradient id="${pool.id}">${stops(pool.stops, true)}</radialGradient>`,
		),
	];

	let vignetteLayer = "";
	if (vignette) {
		defs.push(
			`<radialGradient id="${vignette.id}" cx="0.5" cy="0.5" r="0.72"><stop offset="0.62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${vignette.strength}"/></radialGradient>`,
		);
		vignetteLayer = `<rect width="${width}" height="${height}" fill="url(#${vignette.id})"/>`;
	}

	let grainLayer = "";
	if (grain) {
		defs.push(
			`<filter id="${grain.id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="${grain.frequency}" numOctaves="2" seed="${grain.seed}" stitchTiles="stitch" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -1.6 0 0 0 1.05" result="dark"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 1.6 0 0 0 -0.55" result="light"/><feMerge><feMergeNode in="dark"/><feMergeNode in="light"/></feMerge></filter>`,
		);
		grainLayer = `<rect width="${width}" height="${height}" opacity="${grain.opacity}" filter="url(#${grain.id})"/>`;
	}

	const layers = scene.pools
		.map(
			(pool) =>
				`<ellipse cx="${pool.cx}" cy="${pool.cy}" rx="${pool.rx}" ry="${pool.ry}" transform="rotate(${pool.angle} ${pool.cx} ${pool.cy})" fill="url(#${pool.id})"/>`,
		)
		.join("");

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${defs.join("")}</defs><rect width="${width}" height="${height}" fill="${scene.background}"/><g filter="url(#${warp.id})"><rect x="${flowRect.x}" y="${flowRect.y}" width="${flowRect.width}" height="${flowRect.height}" fill="url(#${flow.id})"/>${layers}</g>${vignetteLayer}${grainLayer}</svg>`;
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
