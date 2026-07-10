export interface Oklch {
	l: number;
	c: number;
	h: number;
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

export function oklchToHex(color: Oklch): string {
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
