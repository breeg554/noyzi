import { describe, expect, test } from "bun:test";
import { isSeedHash, seedHash } from "../src/index.ts";

describe("seedHash", () => {
	test("is deterministic", () => {
		expect(seedHash("dawid@example.com")).toBe(seedHash("dawid@example.com"));
	});

	test("output is 8 lowercase base36 chars for non-integer input", () => {
		for (const input of ["", "a", "hello world", "user-123", "1.5"]) {
			expect(seedHash(input)).toMatch(/^[0-9a-z]{8}$/);
		}
	});

	test("integer-like seeds pass through as their string form", () => {
		expect(seedHash(42)).toBe("42");
		expect(seedHash("42")).toBe("42");
		expect(seedHash(-7)).toBe("-7");
		expect(seedHash(99999999)).toBe("99999999");
	});

	test("is idempotent for already-hashed input", () => {
		const hashed = seedHash("dawid@example.com");
		expect(seedHash(hashed)).toBe(hashed);
	});

	test("is idempotent for integer-like input", () => {
		expect(seedHash(seedHash(42))).toBe(seedHash(42));
	});

	test("isSeedHash detects hashed values", () => {
		expect(isSeedHash(seedHash("anything"))).toBe(true);
		expect(isSeedHash("dawid@example.com")).toBe(false);
		expect(isSeedHash("UPPERCASE")).toBe(false);
		expect(isSeedHash("short")).toBe(false);
		expect(isSeedHash(12345678)).toBe(false);
	});

	test("different inputs produce different hashes", () => {
		const inputs = ["a", "b", "ab", "ba", "user-1", "user-2", "", " "];
		const hashes = new Set(inputs.map(seedHash));
		expect(hashes.size).toBe(inputs.length);
	});

	test("numeric and string forms are equivalent", () => {
		expect(seedHash(42)).toBe(seedHash("42"));
	});

	test("is stable across releases (frozen)", () => {
		expect(seedHash("meshy")).toMatchSnapshot();
	});
});
