export const LOOK_SCALE = 8;

export interface Look {
	width: number;
	height: number;
	rgb: Uint8Array;
}

/** Averages RGBA pixels into LOOK_SCALE blocks: the overall colors and shapes, without grain. */
export function lookOf(data: ArrayLike<number>, width: number, height: number): Look {
	const cols = Math.floor(width / LOOK_SCALE);
	const rows = Math.floor(height / LOOK_SCALE);
	const rgb = new Uint8Array(cols * rows * 3);
	const area = LOOK_SCALE * LOOK_SCALE;
	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			for (let c = 0; c < 3; c++) {
				let sum = 0;
				for (let y = row * LOOK_SCALE; y < (row + 1) * LOOK_SCALE; y++) {
					for (let x = col * LOOK_SCALE; x < (col + 1) * LOOK_SCALE; x++) {
						sum += data[(y * width + x) * 4 + c] as number;
					}
				}
				rgb[(row * cols + col) * 3 + c] = Math.round(sum / area);
			}
		}
	}
	return { width: cols, height: rows, rgb };
}

/** Mean color difference between two looks, in 0-255 levels. */
export function lookDiff(a: Look, b: Look): number {
	if (a.width !== b.width || a.height !== b.height) throw new Error("look sizes differ");
	let sum = 0;
	for (let i = 0; i < a.rgb.length; i++) sum += Math.abs((a.rgb[i] as number) - (b.rgb[i] as number));
	return sum / a.rgb.length;
}

/** Grain strength: RMS of luminance minus its 5×5 local mean, over a centered crop. */
export function grainOf(data: ArrayLike<number>, width: number, height: number): number {
	const size = Math.min(256, width - 4, height - 4);
	const left = Math.floor((width - size) / 2);
	const top = Math.floor((height - size) / 2);
	const luma = (x: number, y: number) => {
		const o = (y * width + x) * 4;
		return 0.2126 * (data[o] as number) + 0.7152 * (data[o + 1] as number) + 0.0722 * (data[o + 2] as number);
	};
	let sum = 0;
	for (let y = top; y < top + size; y++) {
		for (let x = left; x < left + size; x++) {
			let mean = 0;
			for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) mean += luma(x + dx, y + dy);
			const high = luma(x, y) - mean / 25;
			sum += high * high;
		}
	}
	return Math.sqrt(sum / (size * size));
}
