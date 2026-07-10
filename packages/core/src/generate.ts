import { type ColorStop, generatePalette } from "./palette.ts";
import { createRng, normalizeSeed, type Seed } from "./prng.ts";

export interface GradientBlob {
	x: number;
	y: number;
	radius: number;
	color: ColorStop;
}

export interface WarpSpec {
	seed: number;
	frequency: number;
	scale: number;
}

export interface GradientSpec {
	version: 1;
	seed: string;
	background: ColorStop;
	blobs: GradientBlob[];
	warp: WarpSpec | null;
}

export type Layout = "linear" | "orbit" | "scatter";

export interface GenerateOptions {
	colors?: number;
	layout?: Layout;
	warp?: false | Partial<Omit<WarpSpec, "seed">>;
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function round(value: number, decimals = 4): number {
	const f = 10 ** decimals;
	return Math.round(value * f) / f;
}

/** Generates a deterministic gradient spec from a seed. Same seed, same gradient — forever. */
export function generate(
	seed: Seed,
	options: GenerateOptions = {},
): GradientSpec {
	const rng = createRng(seed);
	const colorCount = clamp(Math.floor(options.colors ?? 6), 2, 8);
	const palette = generatePalette(rng, colorCount);

	const layouts: Layout[] = ["linear", "orbit", "scatter"];
	const layout = options.layout ?? rng.pick(layouts);

	const blobs: GradientBlob[] = [];

	if (layout === "linear") {
		const angle = rng.range(0, Math.PI * 2);
		const dirX = Math.cos(angle);
		const dirY = Math.sin(angle);
		const perpX = -dirY;
		const perpY = dirX;

		for (let i = 1; i < colorCount; i++) {
			const t = i / (colorCount - 1);
			const dist = 0.25 + t * 0.75;
			const jitter = rng.range(-0.18, 0.18);
			const x = clamp(0.5 + dirX * dist + perpX * jitter, -0.25, 1.25);
			const y = clamp(0.5 + dirY * dist + perpY * jitter, -0.25, 1.25);
			const radius = rng.range(0.5, 0.8) * (1 + t * 0.3);
			const color = palette[i] as ColorStop;
			blobs.push({ x: round(x), y: round(y), radius: round(radius), color });
		}
	} else if (layout === "orbit") {
		const cx = rng.range(0.3, 0.7);
		const cy = rng.range(0.3, 0.7);
		const ringR = rng.range(0.3, 0.5);
		const startAngle = rng.range(0, Math.PI * 2);
		const step = (Math.PI * 2) / (colorCount - 1);

		for (let i = 1; i < colorCount; i++) {
			const a = startAngle + (i - 1) * step + rng.range(-0.3, 0.3);
			const r = ringR * rng.range(0.75, 1.25);
			const x = clamp(cx + Math.cos(a) * r, -0.25, 1.25);
			const y = clamp(cy + Math.sin(a) * r, -0.25, 1.25);
			const radius = rng.range(0.3, 0.55);
			const color = palette[i] as ColorStop;
			blobs.push({ x: round(x), y: round(y), radius: round(radius), color });
		}
	} else {
		for (let i = 1; i < colorCount; i++) {
			const x = rng.range(-0.1, 1.1);
			const y = rng.range(-0.1, 1.1);
			const radius = rng.range(0.25, 0.65);
			const color = palette[i] as ColorStop;
			blobs.push({ x: round(x), y: round(y), radius: round(radius), color });
		}
	}

	const warpSeed = rng.int(1, 65535);
	const warpScale = rng.range(0.1, 0.18);
	const warp: WarpSpec | null =
		options.warp === false
			? null
			: {
					seed: warpSeed,
					frequency: round(options.warp?.frequency ?? 0.004),
					scale: round(options.warp?.scale ?? warpScale),
				};

	return {
		version: 1,
		seed: normalizeSeed(seed),
		background: palette[0] as ColorStop,
		blobs,
		warp,
	};
}
