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

/** Checks whether a value is already a `seedHash` result (8 lowercase base36 chars). */
export function isSeedHash(value: Seed): boolean {
	return typeof value === "string" && /^[0-9a-z]{8}$/.test(value);
}

/**
 * Whether a seed is integer-like (`42` or `"42"`). Such seeds are kept as-is
 * by `seedHash` so sequential ids get golden-angle-spread hues.
 */
export function isSequentialSeed(seed: Seed): boolean {
	const str = normalizeSeed(seed);
	return /^-?\d{1,15}$/.test(str) && Number.isSafeInteger(Number(str));
}

/**
 * Normalizes any string or number into a seed. Integer-like seeds (`42` or
 * `"42"`) pass through as their string form so sequential ids keep their
 * golden-angle hue spread; everything else is hashed into a short seed like
 * `"f12f1h6x"`. Idempotent.
 */
export function seedHash(input: Seed): string {
	if (isSequentialSeed(input)) {
		return normalizeSeed(input);
	}
	if (isSeedHash(input)) {
		return input as string;
	}
	const str = normalizeSeed(input);
	const h1 = hashString(str);
	const h2 = hashString(`${h1.toString(36)}:${str}`);
	return (h1.toString(36) + h2.toString(36)).padStart(8, "0").slice(0, 8);
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
