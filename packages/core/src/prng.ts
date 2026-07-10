export type Seed = string | number;

export function hashString(str: string): number {
	let h = 1779033703 ^ str.length;
	for (let i = 0; i < str.length; i++) {
		h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
		h = (h << 13) | (h >>> 19);
	}
	h = Math.imul(h ^ (h >>> 16), 2246822507);
	h = Math.imul(h ^ (h >>> 13), 3266489909);
	h = h ^ (h >>> 16);
	return h >>> 0;
}

export function normalizeSeed(seed: Seed): string {
	return String(seed);
}

export interface Rng {
	next(): number;
	range(min: number, max: number): number;
	int(min: number, max: number): number;
	pick<T>(items: readonly T[]): T;
}

export function createRng(seed: Seed): Rng {
	let state = hashString(normalizeSeed(seed));

	const next = (): number => {
		state = (state + 0x9e3779b9) | 0;
		let z = state;
		z = Math.imul(z ^ (z >>> 16), 0x21f0aaad);
		z = Math.imul(z ^ (z >>> 15), 0x735a2d97);
		z = z ^ (z >>> 15);
		return (z >>> 0) / 4294967296;
	};

	return {
		next,
		range: (min, max) => min + next() * (max - min),
		int: (min, max) => min + Math.floor(next() * (max - min + 1)),
		pick: (items) => {
			if (items.length === 0) {
				throw new Error("Cannot pick from an empty array");
			}
			return items[Math.floor(next() * items.length)] as (typeof items)[number];
		},
	};
}
