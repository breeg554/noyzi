import type { Pixels } from "@noyzi/core";
import sharp from "sharp";

export const JPEG_QUALITY = 92;
export const MAX_ACTIVE_RENDERS = 2;
export const MAX_WAITING_RENDERS = 16;

export class RasterBusyError extends Error {}

let active = 0;
const waiting: (() => void)[] = [];

async function acquire(): Promise<void> {
	if (active < MAX_ACTIVE_RENDERS) {
		active++;
		return;
	}
	if (waiting.length >= MAX_WAITING_RENDERS) throw new RasterBusyError();
	await new Promise<void>((resolve) => waiting.push(resolve));
}

function release(): void {
	const next = waiting.shift();
	if (next) next();
	else active--;
}

export async function encodePixels(
	pixels: Pixels,
	format: "png" | "jpg",
): Promise<Uint8Array<ArrayBuffer>> {
	const image = sharp(pixels.data, {
		raw: { width: pixels.width, height: pixels.height, channels: 4 },
	}).removeAlpha();
	const encoded =
		format === "png"
			? image.png()
			: image.jpeg({ quality: JPEG_QUALITY, chromaSubsampling: "4:4:4" });
	return new Uint8Array(await encoded.toBuffer());
}

export async function encodeRaster(
	render: () => Pixels,
	format: "png" | "jpg",
): Promise<Uint8Array<ArrayBuffer>> {
	await acquire();
	try {
		await new Promise((resolve) => setTimeout(resolve, 0));
		return await encodePixels(render(), format);
	} finally {
		release();
	}
}
