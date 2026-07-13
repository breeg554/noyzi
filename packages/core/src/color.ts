export interface Oklch {
	l: number;
	c: number;
	h: number;
}

export type HexColor = `#${string}`;

function round(value: number, decimals = 4): number {
	const factor = 10 ** decimals;
	return Math.round(value * factor) / factor;
}

function parseHex(color: HexColor): [number, number, number] {
	const match = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(color);
	if (!match?.[1]) {
		throw new TypeError(
			`Invalid palette color "${color}". Use #rgb or #rrggbb hex colors.`,
		);
	}

	const hex =
		match[1].length === 3
			? [...match[1]].map((channel) => `${channel}${channel}`).join("")
			: match[1];
	return [
		Number.parseInt(hex.slice(0, 2), 16) / 255,
		Number.parseInt(hex.slice(2, 4), 16) / 255,
		Number.parseInt(hex.slice(4, 6), 16) / 255,
	];
}

function srgbToLinear(value: number): number {
	return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

/** Converts a `#rgb` or `#rrggbb` color to OKLCH. */
export function hexToOklch(color: HexColor): Oklch {
	const [srgbR, srgbG, srgbB] = parseHex(color);
	const r = srgbToLinear(srgbR);
	const g = srgbToLinear(srgbG);
	const b = srgbToLinear(srgbB);
	const lRoot = Math.cbrt(
		0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b,
	);
	const mRoot = Math.cbrt(
		0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b,
	);
	const sRoot = Math.cbrt(
		0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b,
	);
	const l = 0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot;
	const a = 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot;
	const channelB =
		0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot;
	const c = Math.sqrt(a ** 2 + channelB ** 2);
	const h = c < 0.0001 ? 0 : (Math.atan2(channelB, a) * 180) / Math.PI;

	return {
		l: round(l),
		c: round(c),
		h: round((h + 360) % 360),
	};
}

function linearToSrgb(x: number): number {
	const v = x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
	return Math.min(1, Math.max(0, v));
}

function channelToHex(x: number): string {
	return Math.round(x * 255)
		.toString(16)
		.padStart(2, "0");
}

/** Converts an OKLCH color to a `#rrggbb` hex string, clamped to sRGB. */
export function oklchToHex(color: Oklch): HexColor {
	const hRad = (color.h * Math.PI) / 180;
	const a = color.c * Math.cos(hRad);
	const b = color.c * Math.sin(hRad);
	const L = color.l;

	const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
	const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
	const s_ = L - 0.0894841775 * a - 1.291485548 * b;

	const l = l_ ** 3;
	const m = m_ ** 3;
	const s = s_ ** 3;

	const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
	const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
	const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

	return `#${channelToHex(linearToSrgb(r))}${channelToHex(linearToSrgb(g))}${channelToHex(linearToSrgb(bl))}`;
}
