<p align="center">
  <a href="https://noyzi.dev">
    <img src="https://noyzi.dev/logo.webp" alt="Noyzi" width="88" height="88" />
  </a>
</p>

<h1 align="center">@noyzi/core</h1>

<p align="center">
  Deterministic structured gradients from any string or number. Same seed, same artwork—forever. ✨
</p>

<p align="center">
  <a href="https://noyzi.dev">Website</a> ·
  <a href="https://noyzi.dev/docs">Docs</a> ·
  <a href="https://noyzi.dev/examples">Examples</a> ·
  <a href="https://www.npmjs.com/package/@noyzi/core">npm</a> ·
  <a href="https://github.com/breeg554/noyzi">GitHub</a>
</p>

## Why Noyzi? 🎨

- **Deterministic** — perfect for users, teams, playlists, or anything with an ID
- **Portable** — render to CSS, SVG, canvas, WebP, or PNG
- **Tiny & flexible** — framework-free, typed, and tree-shakeable
- **Private by design** — use `seedHash()` before exposing emails or usernames

## Install

```bash
npm install @noyzi/core
```

## Quick start 🚀

```ts
import { generate, seedHash, toSvgDataUri } from "@noyzi/core";

const seed = seedHash("ada@example.com");
const gradient = generate(seed, {
  palette: ["#f5eee0", "#8fb9be", "#ebdac3"],
});

const image = toSvgDataUri(gradient, { width: 800, height: 800 });

document.body.style.backgroundImage = `url("${image}")`;
```

The same input and options always produce the same result—across sessions, devices, and servers. Pass 2–8 hex colors with `palette`; the first becomes the background and the rest become accents. Without a palette, Noyzi derives one from the seed as before.

## API

| Function | Returns | Description |
| --- | --- | --- |
| `generate(seed, options?)` | `GradientSpec` | Creates a deterministic gradient specification. Configure its palette, generated color count, and vignette. |
| `seedHash(input)` | `string` | Converts a string or number into a short, reusable seed. Sequential numeric IDs remain sequential. |
| `isSeedHash(value)` | `boolean` | Checks whether a value already has the eight-character `seedHash` format. |
| `isSequentialSeed(seed)` | `boolean` | Checks whether a seed is a safe integer or an integer-like string. |
| `paletteFromSeed(seed, count?)` | `ColorStop[]` | Returns the exact deterministic color palette for a seed. The count is clamped from 2 to 8. |
| `oklchToHex(color)` | `string` | Converts an OKLCH color to a clamped sRGB `#rrggbb` value. |
| `hexToOklch(color)` | `Oklch` | Converts a `#rgb` or `#rrggbb` color to OKLCH. |
| `toCss(spec, options?)` | `CssOutput` | Produces complete CSS background properties for the rendered SVG. |
| `toSvg(spec, options?)` | `string` | Renders the full gradient as an SVG string. |
| `toSvgDataUri(spec, options?)` | `string` | Renders an SVG data URI ready for an image source or CSS background. |
| `drawToCanvas(spec, canvas, options?)` | `Promise<void>` | Draws the SVG renderer's output onto an existing browser canvas. |
| `toCanvas(spec, options?)` | `Promise<HTMLCanvasElement>` | Creates and renders a new browser canvas, with optional dimensions and scale. |
| `toBlob(spec, options?)` | `Promise<Blob>` | Encodes a browser raster image as WebP by default, with PNG or another supported MIME type available. |
| `toDataUrl(spec, options?)` | `Promise<string>` | Encodes a browser raster image as a data URL. |

See the [full API documentation](https://noyzi.dev/docs) for options, types, and examples.

## Pick your renderer

```ts
import { generate, toBlob, toCss, toSvg } from "@noyzi/core";

const gradient = generate("team-rocket");

const css = toCss(gradient, { width: 480, height: 320 });
const svg = toSvg(gradient, { width: 512 });
const webp = await toBlob(gradient);
```

| Output | API | Best for |
| --- | --- | --- |
| CSS | `toCss()` | Inline styles and framework-free rendering |
| SVG | `toSvg()`, `toSvgDataUri()` | Sharp, scalable artwork |
| Canvas | `drawToCanvas()`, `toCanvas()` | Interactive browser rendering |
| Raster | `toBlob()`, `toDataUrl()` | Downloads, uploads, and sharing |

Explore every option in the [API docs](https://noyzi.dev/docs). 📖

## License

[MIT](https://opensource.org/license/mit) © Noyzi
