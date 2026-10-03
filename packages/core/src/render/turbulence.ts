const B = 0x100;
const BM = 0xff;
const PERLIN_N = 0x1000;
const RAND_M = 2147483647;
const RAND_A = 16807;
const RAND_Q = 127773;
const RAND_R = 2836;

function random(seed: number): number {
	const result = RAND_A * (seed % RAND_Q) - RAND_R * Math.trunc(seed / RAND_Q);
	return result <= 0 ? result + RAND_M : result;
}

function smooth(t: number): number {
	return t * t * (3 - 2 * t);
}

function stitchFrequency(frequency: number, size: number): number {
	if (frequency === 0) return 0;
	const low = Math.floor(size * frequency) / size;
	const high = Math.ceil(size * frequency) / size;
	return low !== 0 && frequency / low < high / frequency ? low : high;
}

export interface TurbulenceOptions {
	seed: number;
	frequencyX: number;
	frequencyY: number;
	octaves: number;
	fractal: boolean;
	tile?: { width: number; height: number };
}

export type Turbulence = (channel: number, x: number, y: number) => number;

/** The SVG spec's feTurbulence reference algorithm, sampled at user-space points. */
export function createTurbulence(options: TurbulenceOptions): Turbulence {
	let seed = Math.round(options.seed);
	if (seed <= 0) seed = -(seed % (RAND_M - 1)) + 1;
	if (seed > RAND_M - 1) seed = RAND_M - 1;

	const lattice = new Int32Array(B + B + 2);
	const gradients = Array.from(
		{ length: 4 },
		() => new Float64Array((B + B + 2) * 2),
	);
	let i = 0;
	for (const g of gradients) {
		for (i = 0; i < B; i++) {
			lattice[i] = i;
			for (let j = 0; j < 2; j++) {
				seed = random(seed);
				g[i * 2 + j] = ((seed % (B + B)) - B) / B;
			}
			const length = Math.hypot(g[i * 2] as number, g[i * 2 + 1] as number) || 1;
			g[i * 2] = (g[i * 2] as number) / length;
			g[i * 2 + 1] = (g[i * 2 + 1] as number) / length;
		}
	}
	while (--i) {
		const k = lattice[i] as number;
		seed = random(seed);
		const j = seed % B;
		lattice[i] = lattice[j] as number;
		lattice[j] = k;
	}
	for (i = 0; i < B + 2; i++) {
		lattice[B + i] = lattice[i] as number;
		for (const g of gradients) {
			g[(B + i) * 2] = g[i * 2] as number;
			g[(B + i) * 2 + 1] = g[i * 2 + 1] as number;
		}
	}

	const { octaves, fractal, tile } = options;
	const fx = tile ? stitchFrequency(options.frequencyX, tile.width) : options.frequencyX;
	const fy = tile ? stitchFrequency(options.frequencyY, tile.height) : options.frequencyY;
	const tileWidth = tile ? Math.trunc(tile.width * fx + 0.5) : 0;
	const tileHeight = tile ? Math.trunc(tile.height * fy + 0.5) : 0;

	return (channel, x, y) => {
		const g = gradients[channel] as Float64Array;
		let width = tileWidth;
		let height = tileHeight;
		let wrapX = PERLIN_N + width;
		let wrapY = PERLIN_N + height;
		let vx = x * fx;
		let vy = y * fy;
		let sum = 0;
		let ratio = 1;
		for (let octave = 0; octave < octaves; octave++) {
			const tx = vx + PERLIN_N;
			const ty = vy + PERLIN_N;
			let bx0 = Math.trunc(tx);
			let bx1 = bx0 + 1;
			let by0 = Math.trunc(ty);
			let by1 = by0 + 1;
			const rx0 = tx - bx0;
			const ry0 = ty - by0;
			if (tile) {
				if (bx0 >= wrapX) bx0 -= width;
				if (bx1 >= wrapX) bx1 -= width;
				if (by0 >= wrapY) by0 -= height;
				if (by1 >= wrapY) by1 -= height;
			}
			const li = lattice[bx0 & BM] as number;
			const lj = lattice[bx1 & BM] as number;
			const b00 = (lattice[li + (by0 & BM)] as number) * 2;
			const b10 = (lattice[lj + (by0 & BM)] as number) * 2;
			const b01 = (lattice[li + (by1 & BM)] as number) * 2;
			const b11 = (lattice[lj + (by1 & BM)] as number) * 2;
			const rx1 = rx0 - 1;
			const ry1 = ry0 - 1;
			const sx = smooth(rx0);
			const sy = smooth(ry0);
			let u = rx0 * (g[b00] as number) + ry0 * (g[b00 + 1] as number);
			let v = rx1 * (g[b10] as number) + ry0 * (g[b10 + 1] as number);
			const a = u + sx * (v - u);
			u = rx0 * (g[b01] as number) + ry1 * (g[b01 + 1] as number);
			v = rx1 * (g[b11] as number) + ry1 * (g[b11 + 1] as number);
			const n = a + sy * (u + sx * (v - u) - a);
			sum += (fractal ? n : Math.abs(n)) / ratio;
			vx *= 2;
			vy *= 2;
			ratio *= 2;
			width *= 2;
			height *= 2;
			wrapX = 2 * wrapX - PERLIN_N;
			wrapY = 2 * wrapY - PERLIN_N;
		}
		const value = fractal ? (sum + 1) / 2 : sum;
		return value < 0 ? 0 : value > 1 ? 1 : value;
	};
}
