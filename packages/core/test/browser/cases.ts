import type { GenerateOptions } from "../../src/index.ts";

export interface RasterCase {
	seed: string;
	width: number;
	height: number;
	options?: GenerateOptions;
}

export const RASTER_CASES: RasterCase[] = [
	{ seed: "noyzi", width: 1200, height: 630 },
	{ seed: "dawid/meshy", width: 1200, height: 630 },
	{ seed: "breeg554/noyzi", width: 1280, height: 320 },
	{ seed: "42", width: 1024, height: 1024, options: { colors: 6, vignette: false } },
	{
		seed: "brand",
		width: 1200,
		height: 630,
		options: { palette: ["#0b1020", "#ff5a5f", "#ffd166"], vignette: { strength: 0.2 } },
	},
	{ seed: "avatar", width: 256, height: 256 },
];

export function caseName(c: RasterCase): string {
	return `${c.seed} ${c.width}x${c.height}`;
}
