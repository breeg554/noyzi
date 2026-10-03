import type { GenerateOptions, HexColor } from "@noyzi/core";
import { MAX_COLORS, MIN_COLORS } from "../gallery-options.ts";
import { IMAGE_PREFIX, publicImagePath } from "./host.ts";
import { encodeRaster, RasterBusyError } from "./raster.ts";
import {
	IMAGE_VERSIONS,
	type ImageVersion,
	LATEST_IMAGE_VERSION,
} from "./versions.ts";

export const DEFAULT_IMAGE_SIZE = 1000;
export const MAX_IMAGE_SIZE = 4096;
export const MAX_RASTER_SIZE = 2400;
export const MAX_SEED_LENGTH = 256;

export const IMAGE_FORMATS = {
	svg: "image/svg+xml; charset=utf-8",
	png: "image/png",
	jpg: "image/jpeg",
} as const;

export type ImageFormat = keyof typeof IMAGE_FORMATS;

export interface ImageRequest {
	seed: string;
	format: ImageFormat;
	width: number;
	height: number;
	options: GenerateOptions;
}

export class ImageError extends Error {
	readonly status: 400 | 404;

	constructor(status: 400 | 404, message: string) {
		super(message);
		this.status = status;
	}
}

function invalid(message: string): never {
	throw new ImageError(400, message);
}

function parseSize(value: string, name: string): number {
	const size = Number(value);
	if (!/^\d+$/.test(value) || size < 1 || size > MAX_IMAGE_SIZE) {
		invalid(`${name} must be a whole number from 1 to ${MAX_IMAGE_SIZE}`);
	}
	return size;
}

function parseColors(value: string): number {
	const colors = Number(value);
	if (!/^\d$/.test(value) || colors < MIN_COLORS || colors > MAX_COLORS) {
		invalid(`colors must be a whole number from ${MIN_COLORS} to ${MAX_COLORS}`);
	}
	return colors;
}

function parsePalette(value: string): HexColor[] {
	const colors = value.split(",").map((color) => color.replace(/^#/, ""));
	if (colors.length < MIN_COLORS || colors.length > MAX_COLORS) {
		invalid(`palette needs ${MIN_COLORS} to ${MAX_COLORS} colors`);
	}
	for (const color of colors) {
		if (!/^[\da-f]{6}$/i.test(color)) {
			invalid(`palette color "${color}" is not a 6-digit hex color`);
		}
	}
	return colors.map((color) => `#${color.toLowerCase()}` as HexColor);
}

function parseVignette(value: string): GenerateOptions["vignette"] {
	if (value === "false" || value === "none") return false;
	if (!/^(0(\.\d{1,4})?|1(\.0{1,4})?)$/.test(value)) {
		invalid("vignette must be a number from 0 to 1, or false");
	}
	const strength = Number(value);
	return strength === 0 ? false : { strength };
}

const PARAMS: Record<string, (value: string, request: ImageRequest) => void> =
	{
		w: (value, request) => {
			request.width = parseSize(value, "w");
		},
		h: (value, request) => {
			request.height = parseSize(value, "h");
		},
		colors: (value, request) => {
			request.options.colors = parseColors(value);
		},
		palette: (value, request) => {
			request.options.palette = parsePalette(value);
		},
		vignette: (value, request) => {
			request.options.vignette = parseVignette(value);
		},
	};

export function parseImageRequest(path: string, search: string): ImageRequest {
	const extension = path.match(/\.(svg|png|jpg)$/)?.[1] as ImageFormat | undefined;
	if (!extension) throw new ImageError(404, "Not found");

	let seed = "";
	try {
		seed = decodeURIComponent(path.slice(0, -(extension.length + 1)));
	} catch {
		invalid("seed is not valid URL encoding");
	}
	if (seed.length === 0) invalid("seed is missing");
	if (seed.length > MAX_SEED_LENGTH) {
		invalid(`seed is longer than ${MAX_SEED_LENGTH} characters`);
	}

	const request: ImageRequest = {
		seed,
		format: extension,
		width: DEFAULT_IMAGE_SIZE,
		height: DEFAULT_IMAGE_SIZE,
		options: {},
	};
	const seen = new Set<string>();
	for (const [key, value] of new URLSearchParams(search)) {
		const apply = Object.hasOwn(PARAMS, key) ? PARAMS[key] : undefined;
		if (!apply) {
			invalid(
				`unknown parameter "${key}" (allowed: ${Object.keys(PARAMS).join(", ")})`,
			);
		}
		if (seen.has(key)) invalid(`parameter "${key}" is repeated`);
		seen.add(key);
		apply(value, request);
	}
	if (seen.has("colors") && seen.has("palette")) {
		invalid("use either colors or palette, not both");
	}
	if (
		extension !== "svg" &&
		Math.max(request.width, request.height) > MAX_RASTER_SIZE
	) {
		invalid(`${extension} images are limited to ${MAX_RASTER_SIZE} pixels per side`);
	}
	return request;
}

function specOf(version: ImageVersion, request: ImageRequest) {
	const renderer = IMAGE_VERSIONS[version];
	return renderer.generate(renderer.seedHash(request.seed), request.options);
}

export function renderImage(
	version: ImageVersion,
	request: ImageRequest,
): string {
	return IMAGE_VERSIONS[version].toSvg(specOf(version, request), {
		width: request.width,
		height: request.height,
	});
}

export function renderPixels(version: ImageVersion, request: ImageRequest) {
	return IMAGE_VERSIONS[version].toPixels(specOf(version, request), {
		width: request.width,
		height: request.height,
	});
}

function fileName(request: ImageRequest): string {
	const slug = request.seed
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 64);
	return `noyzi-${slug || "image"}.${request.format}`;
}

async function renderBody(
	version: ImageVersion,
	request: ImageRequest,
): Promise<string | Uint8Array<ArrayBuffer>> {
	if (request.format === "svg") return renderImage(version, request);
	return encodeRaster(() => renderPixels(version, request), request.format);
}

function errorResponse(status: number, message: string): Response {
	return new Response(`${message}\n`, {
		status,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Cache-Control": "public, max-age=300",
			"Content-Type": "text/plain; charset=utf-8",
		},
	});
}

async function respond(
	url: URL,
	version: ImageVersion,
): Promise<Response> {
	const prefix = `${IMAGE_PREFIX}/${version}/`;
	try {
		if (!url.pathname.startsWith(prefix)) throw new ImageError(404, "Not found");
		const image = parseImageRequest(
			url.pathname.slice(prefix.length),
			url.search,
		);
		return new Response(await renderBody(version, image), {
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Cache-Control": "public, max-age=31536000, immutable",
				"Content-Disposition": `inline; filename="${fileName(image)}"`,
				"Content-Security-Policy":
					"default-src 'none'; style-src 'unsafe-inline'",
				"Content-Type": IMAGE_FORMATS[image.format],
				"X-Content-Type-Options": "nosniff",
				"X-Noyzi-Version": version,
			},
		});
	} catch (error) {
		if (error instanceof ImageError) {
			return errorResponse(error.status, error.message);
		}
		if (error instanceof RasterBusyError) {
			return new Response("Busy rendering images, try again in a moment\n", {
				status: 503,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Cache-Control": "no-store",
					"Content-Type": "text/plain; charset=utf-8",
					"Retry-After": "5",
				},
			});
		}
		throw error;
	}
}

export async function imageResponse(
	request: Request,
	version: ImageVersion,
): Promise<Response> {
	const url = new URL(request.url);
	const start = performance.now();
	const response = await respond(url, version);
	if (process.env.NODE_ENV !== "test") {
		const path = url.pathname.slice(IMAGE_PREFIX.length);
		const ms = Math.round(performance.now() - start);
		console.log(`image ${response.status} ${path}${url.search} ${ms}ms`);
	}
	return response;
}

export function latestImageRedirect(request: Request): Response {
	const url = new URL(request.url);
	const prefix = `${IMAGE_PREFIX}/latest/`;
	if (!url.pathname.startsWith(prefix)) return errorResponse(404, "Not found");
	const rest = url.pathname.slice(prefix.length);
	const path = publicImagePath(url, `/${LATEST_IMAGE_VERSION}/${rest}`);
	return new Response(null, {
		status: 302,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Cache-Control": "public, max-age=3600",
			Location: `${path}${url.search}`,
		},
	});
}
