import type { GenerateOptions, HexColor } from "@noyzi/core";
import { MAX_COLORS, MIN_COLORS } from "../gallery-options.ts";
import { IMAGE_PREFIX, publicImagePath } from "./host.ts";
import {
	IMAGE_VERSIONS,
	type ImageVersion,
	LATEST_IMAGE_VERSION,
} from "./versions.ts";

export const DEFAULT_IMAGE_SIZE = 1000;
export const MAX_IMAGE_SIZE = 4096;
export const MAX_SEED_LENGTH = 256;

export interface ImageRequest {
	seed: string;
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
	if (!path.endsWith(".svg")) throw new ImageError(404, "Not found");

	let seed = "";
	try {
		seed = decodeURIComponent(path.slice(0, -".svg".length));
	} catch {
		invalid("seed is not valid URL encoding");
	}
	if (seed.length === 0) invalid("seed is missing");
	if (seed.length > MAX_SEED_LENGTH) {
		invalid(`seed is longer than ${MAX_SEED_LENGTH} characters`);
	}

	const request: ImageRequest = {
		seed,
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
	return request;
}

export function renderImage(
	version: ImageVersion,
	request: ImageRequest,
): string {
	const renderer = IMAGE_VERSIONS[version];
	const spec = renderer.generate(
		renderer.seedHash(request.seed),
		request.options,
	);
	return renderer.toSvg(spec, {
		width: request.width,
		height: request.height,
	});
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

export function imageResponse(
	request: Request,
	version: ImageVersion,
): Response {
	const url = new URL(request.url);
	const prefix = `${IMAGE_PREFIX}/${version}/`;
	try {
		if (!url.pathname.startsWith(prefix)) throw new ImageError(404, "Not found");
		const image = parseImageRequest(
			url.pathname.slice(prefix.length),
			url.search,
		);
		return new Response(renderImage(version, image), {
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Cache-Control": "public, max-age=31536000, immutable",
				"Content-Security-Policy":
					"default-src 'none'; style-src 'unsafe-inline'",
				"Content-Type": "image/svg+xml; charset=utf-8",
				"X-Content-Type-Options": "nosniff",
				"X-Noyzi-Version": version,
			},
		});
	} catch (error) {
		if (error instanceof ImageError) {
			return errorResponse(error.status, error.message);
		}
		throw error;
	}
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
