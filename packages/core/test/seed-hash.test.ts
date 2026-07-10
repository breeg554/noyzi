import { describe, expect, test } from "bun:test";
import { isSeedHash, seedHash } from "../src/index.ts";

describe("seedHash", () => {
	test("is deterministic", () => {
		expect(seedHash("dawid@example.com")).toBe(seedHash("dawid@example.com"));
	});

	test("output is 8 lowercase base36 chars", () => {
		for (const input of ["", "a", "hello world", "user-123", 42, 99999999]) {
			expect(seedHash(input)).toMatch(/^[0-9a-z]{8}$/);
		}
	});

	test("is idempotent for already-hashed input", () => {
		const hashed = seedHash("dawid@example.com");
		expect(seedHash(hashed)).toBe(hashed);
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
