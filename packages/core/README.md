<p align="center">
  <a href="https://noyzi.dev">
    <img src="https://noyzi.dev/logo.webp" alt="Noyzi" width="88" height="88" />
  </a>
</p>

<h1 align="center">@noyzi/core</h1>

<p align="center">
  Deterministic mesh gradients from any string or number. Same seed, same artwork—forever. ✨
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
  colors: 6,
  layout: "orbit",
});

const image = toSvgDataUri(gradient, { width: 800, height: 800 });

document.body.style.backgroundImage = `url("${image}")`;
```

The same input and options always produce the same result—across sessions, devices, and servers.

## Pick your renderer

```ts
import { generate, toBlob, toCss, toSvg } from "@noyzi/core";

const gradient = generate("team-rocket");

const css = toCss(gradient);                 // lightweight CSS layers
const svg = toSvg(gradient, { width: 512 }); // full warped mesh
const webp = await toBlob(gradient);         // browser-only raster image
```

| Output | API | Best for |
| --- | --- | --- |
| CSS | `toCss()` | Placeholders and subtle accents |
| SVG | `toSvg()`, `toSvgDataUri()` | Sharp, scalable artwork |
| Canvas | `drawToCanvas()`, `toCanvas()` | Interactive browser rendering |
| Raster | `toBlob()`, `toDataUrl()` | Downloads, uploads, and sharing |

Explore every option in the [API docs](https://noyzi.dev/docs). 📖

## License

[MIT](https://opensource.org/license/mit) © Noyzi
