import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { MeshyCanvas, MeshyGradient, seedHash } from "../src/index.ts";

describe("MeshyGradient (SSR)", () => {
	test("renders to a string on the server without DOM access", () => {
		const html = renderToString(<MeshyGradient seed="dawn" />);
		expect(html).toContain("<div");
		expect(html).toContain('role="img"');
		expect(html).toContain("data:image/svg+xml");
	});

	test("output is deterministic across renders (hydration-safe)", () => {
		const a = renderToString(<MeshyGradient seed="dawn" />);
		const b = renderToString(<MeshyGradient seed="dawn" />);
		expect(a).toBe(b);
	});

	test("different seeds produce different markup", () => {
		const a = renderToString(<MeshyGradient seed="dawn" />);
		const b = renderToString(<MeshyGradient seed="dusk" />);
		expect(a).not.toBe(b);
	});

	test("forwards props and merges style", () => {
		const html = renderToString(
			<MeshyGradient
				seed="dawn"
				className="avatar"
				aria-label="dawn"
				style={{ borderRadius: "9999px" }}
			/>,
		);
		expect(html).toContain('class="avatar"');
		expect(html).toContain('aria-label="dawn"');
		expect(html).toContain("border-radius:9999px");
		expect(html).toContain("background-image:");
	});

	test("options change the output", () => {
		const a = renderToString(<MeshyGradient seed="dawn" />);
		const b = renderToString(
			<MeshyGradient seed="dawn" options={{ colors: 2, grain: false }} />,
		);
		expect(a).not.toBe(b);
	});

	test("raw input and its hash render identically", () => {
		const raw = renderToString(<MeshyGradient seed="dawid@example.com" />);
		const hashed = renderToString(
			<MeshyGradient seed={seedHash("dawid@example.com")} />,
		);
		expect(raw).toBe(hashed);
	});

	test("works with seedHash-generated seeds", () => {
		const seed = seedHash("dawid@example.com");
		expect(seed).toMatch(/^[0-9a-z]{8}$/);
		const html = renderToString(<MeshyGradient seed={seed} />);
		expect(html).toContain("data:image/svg+xml");
	});

	test("size renders a fixed square generated at size * density", () => {
		const html = renderToString(<MeshyGradient seed="dawn" size={48} />);
		expect(html).toContain("width:48px");
		expect(html).toContain("height:48px");
		expect(html).toContain(encodeURIComponent('width="96"'));
		expect(html).toContain(encodeURIComponent('height="96"'));
	});

	test("density overrides the multiplier", () => {
		const html = renderToString(
			<MeshyGradient seed="dawn" size={48} density={1} />,
		);
		expect(html).toContain(encodeURIComponent('width="48"'));
		expect(html).toContain(encodeURIComponent('height="48"'));
	});

	test("rounded applies border radius", () => {
		const circle = renderToString(
			<MeshyGradient seed="dawn" size={32} rounded="full" />,
		);
		expect(circle).toContain("border-radius:9999px");
		const px = renderToString(<MeshyGradient seed="dawn" rounded={6} />);
		expect(px).toContain("border-radius:6px");
	});
});

describe("MeshyCanvas (SSR)", () => {
	test("renders a canvas placeholder on the server", () => {
		const html = renderToString(<MeshyCanvas seed="dawn" />);
		expect(html).toContain("<canvas");
		expect(html).toContain('role="img"');
		expect(html).toContain("background-color:");
		expect(html).toContain("blur(12px)");
	});

	test("server output is deterministic (hydration-safe)", () => {
		const a = renderToString(<MeshyCanvas seed="dawn" />);
		const b = renderToString(<MeshyCanvas seed="dawn" />);
		expect(a).toBe(b);
	});

	test("fallback overrides the placeholder color", () => {
		const html = renderToString(<MeshyCanvas seed="dawn" fallback="#123456" />);
		expect(html).toContain("background-color:#123456");
	});

	test("size and rounded apply to the wrapper", () => {
		const html = renderToString(
			<MeshyCanvas seed="dawn" size={48} rounded="full" />,
		);
		expect(html).toContain("width:48px");
		expect(html).toContain("height:48px");
		expect(html).toContain("border-radius:9999px");
	});
});
