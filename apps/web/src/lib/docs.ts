export type DocPackage = "@meshy/core" | "@meshy/react";

export interface DocEntry {
	/** Anchor id, e.g. "generate". */
	id: string;
	/** Display name, e.g. "generate()". */
	name: string;
	pkg: DocPackage;
	/** Full type signature shown in the signature block. */
	signature: string;
	/** Short prose description. */
	description: string;
	/** Optional extra notes rendered after the example. */
	note?: string;
	/** Usage example. */
	example?: string;
}

export const DOC_ENTRIES: DocEntry[] = [
	{
		id: "generate",
		name: "generate()",
		pkg: "@meshy/core",
		signature:
			"function generate(seed: Seed, options?: GenerateOptions): GradientSpec",
		description:
			"Seed in, GradientSpec out: palette, layout (linear | orbit | scatter), 1–7 blobs, optional noise warp. Plain serializable object — feed it to any renderer.",
		note: "colors clamps to 2–8 (default 6). warp: false disables the displacement filter.",
		example: `import { generate, seedHash } from "@meshy/core";

const spec = generate(seedHash("ada"));
const flat = generate("ada", { colors: 4, warp: false });`,
	},
	{
		id: "seedhash",
		name: "seedHash()",
		pkg: "@meshy/core",
		signature: "function seedHash(input: Seed): string",
		description:
			"Hashes any string or number into an 8-char lowercase base36 seed. Idempotent — already-hashed input passes through unchanged.",
		example: `seedHash("ada@example.com"); // "f12f1h6x"
seedHash("f12f1h6x"); // "f12f1h6x"`,
	},
	{
		id: "isseedhash",
		name: "isSeedHash()",
		pkg: "@meshy/core",
		signature: "function isSeedHash(value: Seed): boolean",
		description:
			"True if the value is already a seedHash result (matches /^[0-9a-z]{8}$/).",
		example: `isSeedHash("f12f1h6x"); // true
isSeedHash("ada@example.com"); // false`,
	},
	{
		id: "palettefromseed",
		name: "paletteFromSeed()",
		pkg: "@meshy/core",
		signature:
			"function paletteFromSeed(seed: Seed, count?: number): ColorStop[]",
		description:
			"The exact color stops a seed's gradient uses: [background, ...blobColors]. Use it to derive matching UI accents. Count clamps to 2–8 (default 6).",
		example: `const [background, ...accents] = paletteFromSeed("ada");
background.hex; // "#1b2a4a"
background.oklch; // { l, c, h }`,
	},
	{
		id: "oklchtohex",
		name: "oklchToHex()",
		pkg: "@meshy/core",
		signature: "function oklchToHex(color: Oklch): string",
		description:
			"OKLCH → #rrggbb, gamut-clamped to sRGB. All palette colors are OKLCH internally.",
		example: `oklchToHex({ l: 0.7, c: 0.15, h: 240 }); // "#5da2e8"`,
	},
	{
		id: "tocss",
		name: "toCss()",
		pkg: "@meshy/core",
		signature: "function toCss(spec: GradientSpec): CssOutput",
		description:
			"Spec → backgroundColor + stacked radial-gradient layers. Lightest output, no warp — good for placeholders and accents.",
		example: `const { backgroundColor, backgroundImage } = toCss(generate("ada"));

<div style={{ backgroundColor, backgroundImage }} />`,
	},
	{
		id: "tosvg",
		name: "toSvg()",
		pkg: "@meshy/core",
		signature:
			"function toSvg(spec: GradientSpec, options?: SvgOptions): string",
		description:
			"The reference renderer: SVG string with per-blob radial gradients plus the warp filter chain. Every other output is derived from it. Default 1000×1000.",
		example: `const svg = toSvg(generate("ada"), { width: 512, height: 512 });`,
	},
	{
		id: "tosvgdatauri",
		name: "toSvgDataUri()",
		pkg: "@meshy/core",
		signature:
			"function toSvgDataUri(spec: GradientSpec, options?: SvgOptions): string",
		description:
			"toSvg() wrapped in a data:image/svg+xml URI — drop into background-image or <img src>. This is what <MeshyGradient /> uses. SSR-safe.",
		example: `const uri = toSvgDataUri(generate("ada"));

<div style={{ backgroundImage: \`url("\${uri}")\` }} />`,
	},
	{
		id: "drawtocanvas",
		name: "drawToCanvas()",
		pkg: "@meshy/core",
		signature:
			"function drawToCanvas(\n  spec: GradientSpec,\n  canvas: HTMLCanvasElement | OffscreenCanvas,\n  options?: SvgOptions,\n): Promise<void>",
		description:
			"Paints the exact SVG output onto a canvas you own — for custom resizing, DPR scaling or animation loops. Browser-only.",
		example: `const canvas = document.querySelector("canvas");
await drawToCanvas(generate("ada"), canvas, { width: 400, height: 400 });`,
	},
	{
		id: "tocanvas",
		name: "toCanvas()",
		pkg: "@meshy/core",
		signature:
			"function toCanvas(\n  spec: GradientSpec,\n  options?: RasterOptions,\n): Promise<HTMLCanvasElement>",
		description:
			"Creates a <canvas> and paints the gradient, pixel-identical to the SVG. scale multiplies resolution for high-DPI. Browser-only.",
		example: `const canvas = await toCanvas(generate("ada"), { width: 500, scale: 2 });`,
	},
	{
		id: "toblob",
		name: "toBlob()",
		pkg: "@meshy/core",
		signature:
			"function toBlob(\n  spec: GradientSpec,\n  options?: RasterOptions & EncodeOptions,\n): Promise<Blob>",
		description:
			"Gradient → image Blob. WebP by default (~10x smaller than PNG for gradients); browsers without WebP encoding fall back to PNG — check blob.type. For clipboard, uploads, downloads. Browser-only.",
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
		pkg: "@meshy/core",
		signature:
			"function toDataUrl(\n  spec: GradientSpec,\n  options?: RasterOptions & EncodeOptions,\n): Promise<string>",
		description:
			"Gradient → raster data URL. WebP by default, PNG fallback where unsupported — check the data:image/... prefix. Browser-only.",
		example: `const url = await toDataUrl(generate("ada"));
const anchor = document.createElement("a");
anchor.href = url;
anchor.download = url.startsWith("data:image/webp")
  ? "meshy-ada.webp"
  : "meshy-ada.png";
anchor.click();`,
	},
	{
		id: "meshygradient",
		name: "<MeshyGradient />",
		pkg: "@meshy/react",
		signature: `interface MeshyGradientProps extends MeshyBaseProps {
  /** Intrinsic artwork size. Only the aspect ratio affects the
   *  result (the SVG is vector). Defaults to 1000×1000. */
  artwork?: { width?: number; height?: number };
}

interface MeshyBaseProps
  extends Omit<JSX.IntrinsicElements["div"], "children"> {
  seed: Seed;
  options?: GenerateOptions;
}`,
		description:
			'<div role="img"> with an SVG data-URI background. SSR-safe, zero client JS. Size and shape it with your own CSS — the artwork cover-fills the element. Use artwork to match the aspect ratio of non-square elements.',
		example: `<MeshyGradient seed="ada" className="size-10 rounded-full" />

<MeshyGradient
  seed="ada"
  artwork={{ width: 1600, height: 400 }}
  className="h-40 w-full rounded-lg"
/>`,
	},
];

export const DOC_PACKAGES: DocPackage[] = ["@meshy/core", "@meshy/react"];

export function entriesForPackage(pkg: DocPackage): DocEntry[] {
	return DOC_ENTRIES.filter((entry) => entry.pkg === pkg);
}
