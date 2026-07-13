export type DocPackage = "@noyzi/core" | "@noyzi/react";

export type DocPreviewKind = "generate" | "gradient" | "palette";

export interface DocEntry {
	id: string;
	name: string;
	pkg: DocPackage;
	signature: string;
	description: string;
	note?: string;
	example?: string;
	preview?: DocPreviewKind;
}

export const DOC_ENTRIES: DocEntry[] = [
	{
		id: "generate",
		name: "generate()",
		pkg: "@noyzi/core",
		signature:
			"function generate(seed: Seed, options?: GenerateOptions): GradientSpec",
		description:
			"Seed in, GradientSpec out: the complete requested palette, 1–4 organic structure fields, and an optional vignette. The SVG uses every palette color while the fields preserve deterministic geometry across output formats.",
		note: "palette accepts 2–8 hex colors, with the background first, and overrides colors. Without it, colors clamps to 2–8 (default 4). vignette darkens the edges — strength defaults to 0.08, or disable it with false.",
		example: `import { generate, seedHash } from "@noyzi/core";

// GradientSpec: { seed, background, palette, fields, vignette }
const spec = generate(seedHash("ada"));
spec.background.hex; // "#1b2a4a"
spec.fields[0].points; // deterministic organic contour

// clean look: no vignette
const flat = generate("ada", {
  palette: ["#f5eee0", "#8fb9be", "#ebdac3"],
  vignette: false,
});

// or a heavier vignette
const moody = generate("ada", { vignette: { strength: 0.3 } });`,
		preview: "generate",
	},
	{
		id: "hextooklch",
		name: "hexToOklch()",
		pkg: "@noyzi/core",
		signature: `type HexColor = \`#\${string}\`
function hexToOklch(color: HexColor): Oklch`,
		description:
			"Hex → OKLCH for #rgb and #rrggbb colors. Custom palette colors are converted this way inside generate().",
		example: `hexToOklch("#5da2e8"); // { l, c, h }`,
	},
	{
		id: "seedhash",
		name: "seedHash()",
		pkg: "@noyzi/core",
		signature: "function seedHash(input: Seed): string",
		description:
			"Hashes any string or number into an 8-char lowercase base36 seed. Idempotent — already-hashed input passes through unchanged.",
		example: `seedHash("ada@example.com"); // "f12f1h6x"
seedHash("f12f1h6x"); // "f12f1h6x"`,
	},
	{
		id: "isseedhash",
		name: "isSeedHash()",
		pkg: "@noyzi/core",
		signature: "function isSeedHash(value: Seed): boolean",
		description:
			"True if the value is already a seedHash result (matches /^[0-9a-z]{8}$/).",
		example: `isSeedHash("f12f1h6x"); // true
isSeedHash("ada@example.com"); // false`,
	},
	{
		id: "palettefromseed",
		name: "paletteFromSeed()",
		pkg: "@noyzi/core",
		signature:
			"function paletteFromSeed(seed: Seed, count?: number): ColorStop[]",
		description:
			"The deterministic palette family available to a seed. The generator selects a restrained subset for its visible fields. Use it to derive matching UI accents. Count clamps to 2–8 (default 4).",
		example: `const [background, ...accents] = paletteFromSeed("ada");
background.hex; // "#1b2a4a"
background.oklch; // { l, c, h }`,
		preview: "palette",
	},
	{
		id: "oklchtohex",
		name: "oklchToHex()",
		pkg: "@noyzi/core",
		signature: "function oklchToHex(color: Oklch): string",
		description:
			"OKLCH → #rrggbb, gamut-clamped to sRGB. All palette colors are OKLCH internally.",
		example: `oklchToHex({ l: 0.7, c: 0.15, h: 240 }); // "#5da2e8"`,
	},
	{
		id: "tocss",
		name: "toCss()",
		pkg: "@noyzi/core",
		signature:
			"function toCss(spec: GradientSpec, options?: SvgOptions): CssOutput",
		description:
			"Spec → complete CSS background properties containing the exact organic SVG. Pass the artwork dimensions when matching another renderer.",
		example: `const background = toCss(generate("ada"), { width: 480, height: 320 });

<div style={background} />`,
	},
	{
		id: "tosvg",
		name: "toSvg()",
		pkg: "@noyzi/core",
		signature:
			"function toSvg(spec: GradientSpec, options?: SvgOptions): string",
		description:
			"The reference renderer: an SVG string with one continuous palette surface, warped by deterministic low-frequency noise and softly diffused. Every other static output is derived from it. Default 1000×1000.",
		example: `const svg = toSvg(generate("ada"), { width: 512, height: 512 });`,
	},
	{
		id: "tosvgdatauri",
		name: "toSvgDataUri()",
		pkg: "@noyzi/core",
		signature:
			"function toSvgDataUri(spec: GradientSpec, options?: SvgOptions): string",
		description:
			"toSvg() wrapped in a data:image/svg+xml URI — drop into background-image or <img src>. This is what <NoyziGradient /> uses. SSR-safe.",
		example: `const uri = toSvgDataUri(generate("ada"));

<div style={{ backgroundImage: \`url("\${uri}")\` }} />`,
	},
	{
		id: "drawtocanvas",
		name: "drawToCanvas()",
		pkg: "@noyzi/core",
		signature:
			"function drawToCanvas(\n  spec: GradientSpec,\n  canvas: HTMLCanvasElement | OffscreenCanvas,\n  options?: SvgOptions,\n): Promise<void>",
		description:
			"Paints the exact SVG output onto a canvas you own — for custom resizing and DPR scaling. Browser-only.",
		example: `const canvas = document.querySelector("canvas");
await drawToCanvas(generate("ada"), canvas, { width: 400, height: 400 });`,
	},
	{
		id: "tocanvas",
		name: "toCanvas()",
		pkg: "@noyzi/core",
		signature:
			"function toCanvas(\n  spec: GradientSpec,\n  options?: RasterOptions,\n): Promise<HTMLCanvasElement>",
		description:
			"Creates a <canvas> and paints the gradient, pixel-identical to the SVG. scale multiplies resolution for high-DPI. Browser-only.",
		example: `const canvas = await toCanvas(generate("ada"), { width: 500, scale: 2 });`,
	},
	{
		id: "toblob",
		name: "toBlob()",
		pkg: "@noyzi/core",
		signature:
			"function toBlob(\n  spec: GradientSpec,\n  options?: RasterOptions & EncodeOptions,\n): Promise<Blob>",
		description:
			"Gradient → image Blob. WebP by default at quality 0.9 (~10x smaller than PNG for gradients); browsers without WebP encoding fall back to PNG — check blob.type. For clipboard, uploads, downloads. Browser-only.",
		example: `const blob = await toBlob(generate("ada"), { width: 1000 });

// ClipboardItem requires PNG — opt out of WebP:
const png = await toBlob(generate("ada"), { type: "image/png" });
await navigator.clipboard.write([
  new ClipboardItem({ "image/png": png }),
]);`,
	},
	{
		id: "todataurl",
		name: "toDataUrl()",
		pkg: "@noyzi/core",
		signature:
			"function toDataUrl(\n  spec: GradientSpec,\n  options?: RasterOptions & EncodeOptions,\n): Promise<string>",
		description:
			"Gradient → raster data URL. WebP by default at quality 0.9, PNG fallback where unsupported — check the data:image/... prefix. Browser-only.",
		example: `const url = await toDataUrl(generate("ada"));
const anchor = document.createElement("a");
anchor.href = url;
anchor.download = url.startsWith("data:image/webp")
  ? "noyzi-ada.webp"
  : "noyzi-ada.png";
anchor.click();`,
	},
	{
		id: "noyzigradient",
		name: "<NoyziGradient />",
		pkg: "@noyzi/react",
		signature: `interface NoyziGradientProps extends NoyziBaseProps {
  /** Intrinsic artwork size. Only the aspect ratio affects the
   *  result (the SVG is vector). Defaults to 1000×1000. */
  artwork?: { width?: number; height?: number };
}

interface NoyziBaseProps
  extends Omit<JSX.IntrinsicElements["div"], "children"> {
  seed: Seed;
  options?: GenerateOptions;
}`,
		description:
			'<div role="img"> with an SVG data-URI background. SSR-safe, zero client JS. Size and shape it with your own CSS — the artwork cover-fills the element. Use artwork to match the aspect ratio of non-square elements.',
		example: `<NoyziGradient seed="ada" className="size-10 rounded-full" />

<NoyziGradient
  seed="ada"
  artwork={{ width: 1600, height: 400 }}
  className="h-40 w-full rounded-lg"
/>`,
		preview: "gradient",
	},
];

export const DOC_PACKAGES: DocPackage[] = ["@noyzi/core", "@noyzi/react"];

export function entriesForPackage(pkg: DocPackage): DocEntry[] {
	return DOC_ENTRIES.filter((entry) => entry.pkg === pkg);
}
