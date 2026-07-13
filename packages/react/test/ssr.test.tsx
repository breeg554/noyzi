import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { NoyziGradient, seedHash } from "../src/index.ts";

describe("NoyziGradient (SSR)", () => {
	test("renders to a string on the server without DOM access", () => {
		const html = renderToString(<NoyziGradient seed="dawn" />);
		expect(html).toContain("<div");
		expect(html).toContain('role="img"');
		expect(html).toContain("data:image/svg+xml");
	});

	test("output is deterministic across renders (hydration-safe)", () => {
		const a = renderToString(<NoyziGradient seed="dawn" />);
		const b = renderToString(<NoyziGradient seed="dawn" />);
		expect(a).toBe(b);
	});

	test("different seeds produce different markup", () => {
		const a = renderToString(<NoyziGradient seed="dawn" />);
		const b = renderToString(<NoyziGradient seed="dusk" />);
		expect(a).not.toBe(b);
	});

	test("forwards props and merges style", () => {
		const html = renderToString(
			<NoyziGradient
				seed="dawn"
				className="avatar"
				aria-label="dawn"
				style={{ borderRadius: "9999px" }}
			/>,
		);
		expect(html).toContain("avatar");
		expect(html).toContain("shadow-");
		expect(html).toContain('aria-label="dawn"');
		expect(html).toContain("border-radius:9999px");
		expect(html).toContain("background-image:");
	});

	test("sizing and rounding come from className", () => {
		const html = renderToString(
			<NoyziGradient seed="dawn" className="size-10 rounded-full" />,
		);
		expect(html).toContain("size-10");
		expect(html).toContain("rounded-full");
		expect(html).not.toContain("width:");
		expect(html).not.toContain("border-radius:");
	});

	test("className can override the default shadow", () => {
		const html = renderToString(
			<NoyziGradient seed="dawn" className="shadow-none" />,
		);
		expect(html).toContain("shadow-none");
		expect(html).not.toContain("shadow-[");
	});

	test("options change the output", () => {
		const a = renderToString(<NoyziGradient seed="dawn" />);
		const b = renderToString(
			<NoyziGradient seed="dawn" options={{ colors: 2, vignette: false }} />,
		);
		expect(a).not.toBe(b);
	});

	test("renders a custom palette", () => {
		const html = renderToString(
			<NoyziGradient
				seed="dawn"
				options={{ palette: ["#112233", "#abcdef", "#ff5500"] }}
			/>,
		);

		expect(html).toContain("%23112233");
		expect(html).toContain("%23abcdef");
		expect(html).toContain("%23ff5500");
	});

	test("raw input and its hash render identically", () => {
		const raw = renderToString(<NoyziGradient seed="dawid@example.com" />);
		const hashed = renderToString(
			<NoyziGradient seed={seedHash("dawid@example.com")} />,
		);
		expect(raw).toBe(hashed);
	});

	test("works with seedHash-generated seeds", () => {
		const seed = seedHash("dawid@example.com");
		expect(seed).toMatch(/^[0-9a-z]{8}$/);
		const html = renderToString(<NoyziGradient seed={seed} />);
		expect(html).toContain("data:image/svg+xml");
	});

	test("artwork defaults to a 1000×1000 square", () => {
		const html = renderToString(<NoyziGradient seed="dawn" />);
		expect(html).toContain(encodeURIComponent('viewBox="0 0 1000 1000"'));
	});

	test("artwork sets the intrinsic SVG dimensions", () => {
		const html = renderToString(
			<NoyziGradient seed="dawn" artwork={{ width: 1600, height: 400 }} />,
		);
		expect(html).toContain(encodeURIComponent('viewBox="0 0 1600 400"'));
	});
});
