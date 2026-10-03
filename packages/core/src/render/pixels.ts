import type { GradientSpec } from "../generate.ts";
import { buildScene, type Scene, type SceneStop } from "./scene.ts";
import type { SvgOptions } from "./svg.ts";
import { createTurbulence } from "./turbulence.ts";

export interface Pixels {
	width: number;
	height: number;
	/** RGBA, 4 bytes per pixel, row by row. */
	data: Uint8ClampedArray;
}

interface Stop {
	offset: number;
	r: number;
	g: number;
	b: number;
	a: number;
}

const SMOOTH_SIGMA = 8;

function stopsOf(list: SceneStop[]): Stop[] {
	return list.map((stop) => {
		const hex = Number.parseInt(stop.color.slice(1), 16);
		return {
			offset: stop.offset,
			r: (hex >> 16) & 255,
			g: (hex >> 8) & 255,
			b: hex & 255,
			a: stop.opacity,
		};
	});
}

const sample = { r: 0, g: 0, b: 0, a: 0 };

function sampleStops(stops: Stop[], t: number): void {
	let a = stops[0] as Stop;
	let b = a;
	if (t >= (stops[stops.length - 1] as Stop).offset) {
		a = stops[stops.length - 1] as Stop;
		b = a;
	} else if (t > a.offset) {
		for (let i = 1; i < stops.length; i++) {
			b = stops[i] as Stop;
			if (t <= b.offset) break;
			a = b;
		}
	}
	const span = b.offset - a.offset;
	const k = span > 0 ? (t - a.offset) / span : 0;
	sample.r = a.r + (b.r - a.r) * k;
	sample.g = a.g + (b.g - a.g) * k;
	sample.b = a.b + (b.b - a.b) * k;
	sample.a = a.a + (b.a - a.a) * k;
}

interface Pool {
	cx: number;
	cy: number;
	rx: number;
	ry: number;
	cos: number;
	sin: number;
	stops: Stop[];
}

function source(scene: Scene, flowStops: Stop[], pools: Pool[]) {
	const { flow, flowRect } = scene;
	const dx = flow.x2 - flow.x1;
	const dy = flow.y2 - flow.y1;
	const length = dx * dx + dy * dy || 1;
	const right = flowRect.x + flowRect.width;
	const bottom = flowRect.y + flowRect.height;
	return (x: number, y: number, out: Float32Array, o: number): void => {
		let r = 0;
		let g = 0;
		let b = 0;
		let a = 0;
		if (x >= flowRect.x && y >= flowRect.y && x <= right && y <= bottom) {
			const t = ((x - flow.x1) * dx + (y - flow.y1) * dy) / length;
			sampleStops(flowStops, t < 0 ? 0 : t > 1 ? 1 : t);
			r = sample.r;
			g = sample.g;
			b = sample.b;
			a = 1;
		}
		for (const pool of pools) {
			const px = x - pool.cx;
			const py = y - pool.cy;
			const lx = (px * pool.cos + py * pool.sin) / pool.rx;
			const ly = (py * pool.cos - px * pool.sin) / pool.ry;
			const d = Math.sqrt(lx * lx + ly * ly);
			if (d >= 1) continue;
			sampleStops(pool.stops, d);
			const pa = sample.a;
			r = sample.r * pa + r * (1 - pa);
			g = sample.g * pa + g * (1 - pa);
			b = sample.b * pa + b * (1 - pa);
			a = pa + a * (1 - pa);
		}
		out[o] = r;
		out[o + 1] = g;
		out[o + 2] = b;
		out[o + 3] = a;
	};
}

function boxPass(
	src: Float32Array,
	dst: Float32Array,
	width: number,
	height: number,
	size: number,
	shift: number,
	horizontal: boolean,
): void {
	const n = horizontal ? width : height;
	const lines = horizontal ? height : width;
	const step = horizontal ? 4 : width * 4;
	const left = Math.floor(size / 2) + shift;
	const right = size - 1 - left;
	const inverse = 1 / size;
	for (let line = 0; line < lines; line++) {
		const base = horizontal ? line * width * 4 : line * 4;
		for (let c = 0; c < 4; c++) {
			let sum = 0;
			for (let i = 0; i <= right && i < n; i++) sum += src[base + i * step + c] as number;
			for (let i = 0; i < n; i++) {
				dst[base + i * step + c] = sum * inverse;
				const add = i + right + 1;
				const remove = i - left;
				if (add < n) sum += src[base + add * step + c] as number;
				if (remove >= 0) sum -= src[base + remove * step + c] as number;
			}
		}
	}
}

function blur(
	data: Float32Array,
	width: number,
	height: number,
	sigma: number,
): Float32Array {
	const d = Math.floor((sigma * 3 * Math.sqrt(2 * Math.PI)) / 4 + 0.5);
	if (d < 2) return data;
	const passes: [number, number][] =
		d % 2 === 1
			? [
					[d, 0],
					[d, 0],
					[d, 0],
				]
			: [
					[d, 0],
					[d, -1],
					[d + 1, 0],
				];
	let a: Float32Array = data;
	let b: Float32Array = new Float32Array(data.length);
	for (const horizontal of [true, false]) {
		for (const [size, shift] of passes) {
			boxPass(a, b, width, height, size, shift, horizontal);
			[a, b] = [b, a];
		}
	}
	return a;
}

function smoothLayer(scene: Scene, cols: number, rows: number): Float32Array {
	const { warp } = scene;
	const unitX = scene.width / cols;
	const unitY = scene.height / rows;
	const sigma = warp.diffusion / unitX;
	const pad = Math.ceil(sigma * 3) + 1;
	const pw = cols + pad * 2;
	const ph = rows + pad * 2;
	const noise = createTurbulence({
		seed: warp.seed,
		frequencyX: warp.frequencyX,
		frequencyY: warp.frequencyY,
		octaves: 1,
		fractal: false,
	});

	const field = new Float32Array(pw * ph * 4);
	for (let y = 0; y < ph; y++) {
		const uy = (y - pad + 0.5) * unitY;
		for (let x = 0; x < pw; x++) {
			const ux = (x - pad + 0.5) * unitX;
			const o = (y * pw + x) * 4;
			const alpha = noise(3, ux, uy);
			field[o] = noise(0, ux, uy) * alpha;
			field[o + 2] = noise(2, ux, uy) * alpha;
			field[o + 3] = alpha;
		}
	}
	const soft = blur(field, pw, ph, warp.noiseBlur / unitX);

	const draw = source(
		scene,
		stopsOf(scene.flow.stops),
		scene.pools.map((pool) => {
			const angle = (pool.angle * Math.PI) / 180;
			return {
				cx: pool.cx,
				cy: pool.cy,
				rx: pool.rx,
				ry: pool.ry,
				cos: Math.cos(angle),
				sin: Math.sin(angle),
				stops: stopsOf(pool.stops),
			};
		}),
	);
	const warped = new Float32Array(pw * ph * 4);
	for (let y = 0; y < ph; y++) {
		for (let x = 0; x < pw; x++) {
			const o = (y * pw + x) * 4;
			const alpha = soft[o + 3] as number;
			const nr = alpha > 0 ? (soft[o] as number) / alpha : 0;
			const nb = alpha > 0 ? (soft[o + 2] as number) / alpha : 0;
			draw(
				(x - pad + 0.5) * unitX + warp.displacement * (nr - 0.5),
				(y - pad + 0.5) * unitY + warp.displacement * (nb - 0.5),
				warped,
				o,
			);
		}
	}
	const diffused = blur(warped, pw, ph, sigma);

	const hex = Number.parseInt(scene.background.slice(1), 16);
	const background = [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
	const out = new Float32Array(cols * rows * 3);
	for (let y = 0; y < rows; y++) {
		for (let x = 0; x < cols; x++) {
			const o = ((y + pad) * pw + x + pad) * 4;
			const rest = 1 - (diffused[o + 3] as number);
			const i = (y * cols + x) * 3;
			for (let c = 0; c < 3; c++) {
				out[i + c] = (diffused[o + c] as number) + (background[c] as number) * rest;
			}
		}
	}
	return out;
}

/** Draws a gradient spec straight to RGBA pixels, matching the SVG output without a browser. */
export function toPixels(spec: GradientSpec, options: SvgOptions = {}): Pixels {
	const { width = 1000, height = 1000 } = options;
	const scene = buildScene(spec, width, height, true);
	const scale = Math.max(1, scene.warp.diffusion / SMOOTH_SIGMA);
	const cols = Math.max(1, Math.round(width / scale));
	const rows = Math.max(1, Math.round(height / scale));
	const smooth = smoothLayer(scene, cols, rows);

	const vignette = scene.vignette?.strength ?? 0;
	const grain = scene.grain;
	const noise = grain
		? createTurbulence({
				seed: grain.seed,
				frequencyX: grain.frequency,
				frequencyY: grain.frequency,
				octaves: 2,
				fractal: true,
				tile: { width, height },
			})
		: null;
	const opacity = grain?.opacity ?? 0;

	const data = new Uint8ClampedArray(width * height * 4);
	for (let y = 0; y < height; y++) {
		const sy = Math.min(rows - 1, Math.max(0, ((y + 0.5) / height) * rows - 0.5));
		const y0 = Math.floor(sy);
		const y1 = Math.min(rows - 1, y0 + 1);
		const ty = sy - y0;
		const vy = (y + 0.5) / height - 0.5;
		for (let x = 0; x < width; x++) {
			const sx = Math.min(cols - 1, Math.max(0, ((x + 0.5) / width) * cols - 0.5));
			const x0 = Math.floor(sx);
			const x1 = Math.min(cols - 1, x0 + 1);
			const tx = sx - x0;
			const a = (y0 * cols + x0) * 3;
			const b = (y0 * cols + x1) * 3;
			const c = (y1 * cols + x0) * 3;
			const d = (y1 * cols + x1) * 3;

			let shade = 1;
			if (vignette > 0) {
				const vx = (x + 0.5) / width - 0.5;
				const t = Math.sqrt(vx * vx + vy * vy) / 0.72;
				shade = 1 - vignette * Math.min(1, Math.max(0, (t - 0.62) / 0.38));
			}

			let keep = 1;
			let light = 0;
			if (noise) {
				const n = noise(0, x + 0.5, y + 0.5);
				const darkAlpha = Math.min(1, Math.max(0, 1.05 - 1.6 * n));
				const lightAlpha = Math.min(1, Math.max(0, 1.6 * n - 0.55));
				const alpha = lightAlpha + darkAlpha * (1 - lightAlpha);
				keep = 1 - alpha * opacity;
				light = 255 * lightAlpha * opacity;
			}

			const o = (y * width + x) * 4;
			for (let k = 0; k < 3; k++) {
				const top = (smooth[a + k] as number) + ((smooth[b + k] as number) - (smooth[a + k] as number)) * tx;
				const bottom = (smooth[c + k] as number) + ((smooth[d + k] as number) - (smooth[c + k] as number)) * tx;
				data[o + k] = (top + (bottom - top) * ty) * shade * keep + light;
			}
			data[o + 3] = 255;
		}
	}
	return { width, height, data };
}
