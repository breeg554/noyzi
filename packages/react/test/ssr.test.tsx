import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import {
	NoyziAnimated,
	NoyziAnimatedGroup,
	NoyziGradient,
	seedHash,
} from "../src/index.ts";

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

describe("NoyziAnimated (SSR)", () => {
	test("renders the SVG fallback before WebGL initializes", () => {
		const html = renderToString(
			<NoyziAnimated
				seed="dawn"
				className="size-24 rounded-full"
				aria-label="dawn"
			/>,
		);

		expect(html).toContain("<div");
		expect(html).toContain("<canvas");
		expect(html).toContain('role="img"');
		expect(html).toContain('aria-label="dawn"');
		expect(html).toContain("data:image/svg+xml");
		expect(html).toContain("opacity:0");
	});

	test("uses the same initial SVG as NoyziGradient", () => {
		const still = renderToString(
			<NoyziGradient seed="dawn" artwork={{ width: 1600, height: 900 }} />,
		);
		const animated = renderToString(
			<NoyziAnimated seed="dawn" artwork={{ width: 1600, height: 900 }} />,
		);
		const stillUri = still.match(
			/background-image:url\(&quot;(.+?)&quot;\)/,
		)?.[1];
		const animatedUri = animated.match(
			/background-image:url\(&quot;(.+?)&quot;\)/,
		)?.[1];

		expect(animated).toContain(encodeURIComponent('viewBox="0 0 1600 900"'));
		expect(animatedUri).toBe(stillUri);
	});

	test("consumes speed and strength without forwarding them to the DOM", () => {
		const html = renderToString(
			<NoyziAnimated seed="dawn" speed={1.25} strength={1.75} />,
		);

		expect(html).not.toContain("speed=");
		expect(html).not.toContain("strength=");
	});

	test("throws for motion values outside the supported ranges", () => {
		expect(() =>
			renderToString(<NoyziAnimated seed="dawn" strength={15} />),
		).toThrow("strength must be a finite number between 0 and 3");
		expect(() =>
			renderToString(
				<NoyziAnimated seed="dawn" speed={Number.POSITIVE_INFINITY} />,
			),
		).toThrow("speed must be a finite number between 0 and 10");
	});

	test("renders its SVG fallback inside an animated group", () => {
		const html = renderToString(
			<NoyziAnimatedGroup frameRate={30} maxPixelRatio={1}>
				<NoyziAnimated seed="dawn" />
			</NoyziAnimatedGroup>,
		);

		expect(html).toContain("data:image/svg+xml");
		expect(html).toContain("<canvas");
		expect(html).toContain("opacity:0");
		expect(html).not.toContain("frameRate");
		expect(html).not.toContain("maxPixelRatio");
	});
});
