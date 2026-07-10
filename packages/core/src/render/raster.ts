import type { GradientSpec } from "../generate.ts";
import { type SvgOptions, toSvgDataUri } from "./svg.ts";

export interface RasterOptions extends SvgOptions {
	scale?: number;
}

export interface EncodeOptions {
	type?: string;
	quality?: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error("Failed to rasterize gradient SVG"));
		img.src = src;
	});
}

export async function drawToCanvas(
	spec: GradientSpec,
	canvas: HTMLCanvasElement | OffscreenCanvas,
	options: SvgOptions = {},
): Promise<void> {
	if (typeof Image === "undefined") {
		throw new Error("drawToCanvas requires a browser environment");
	}
	const { width = canvas.width, height = canvas.height } = options;
	const img = await loadImage(toSvgDataUri(spec, { width, height }));
	const ctx = canvas.getContext("2d") as
		| CanvasRenderingContext2D
		| OffscreenCanvasRenderingContext2D
		| null;
	if (!ctx) {
		throw new Error("Could not acquire a 2d canvas context");
	}
	ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
}

export async function toCanvas(
	spec: GradientSpec,
	options: RasterOptions = {},
): Promise<HTMLCanvasElement> {
	if (typeof document === "undefined") {
		throw new Error("toCanvas requires a browser environment");
	}
	const { width = 800, height = 1000, scale = 1 } = options;
	const canvas = document.createElement("canvas");
	canvas.width = Math.round(width * scale);
	canvas.height = Math.round(height * scale);
	await drawToCanvas(spec, canvas, { width, height });
	return canvas;
}

export async function toBlob(
	spec: GradientSpec,
	options: RasterOptions & EncodeOptions = {},
): Promise<Blob> {
	const canvas = await toCanvas(spec, options);
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (blob) {
					resolve(blob);
				} else {
					reject(new Error("Canvas encoding failed"));
				}
			},
			options.type ?? "image/png",
			options.quality,
		);
	});
}

export async function toDataUrl(
	spec: GradientSpec,
	options: RasterOptions & EncodeOptions = {},
): Promise<string> {
	const canvas = await toCanvas(spec, options);
	return canvas.toDataURL(options.type ?? "image/png", options.quality);
}
