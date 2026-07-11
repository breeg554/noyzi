<p align="center">
  <a href="https://noyzi.dev">
    <img src="https://noyzi.dev/logo.webp" alt="Noyzi" width="88" height="88" />
  </a>
</p>

<h1 align="center">@noyzi/react</h1>

<p align="center">
  Beautiful, deterministic mesh gradients for React—SSR-safe with zero client JavaScript. 🌈
</p>

<p align="center">
  <a href="https://noyzi.dev">Website</a> ·
  <a href="https://noyzi.dev/docs">Docs</a> ·
  <a href="https://noyzi.dev/examples">Examples</a> ·
  <a href="https://www.npmjs.com/package/@noyzi/react">npm</a> ·
  <a href="https://github.com/breeg554/noyzi">GitHub</a>
</p>

## Highlights ✨

- One seed becomes one memorable gradient—every time
- SSR and hydration safe in Next.js, TanStack Start, Remix, and more
- Renders a regular `<div>` with an SVG background
- Works naturally with Tailwind CSS classes and standard React props

## Install

```bash
npm install @noyzi/react
```

Requires React 18+ and Tailwind CSS 4+.

## Quick start 🚀

```tsx
import { NoyziGradient } from "@noyzi/react";

export function Avatar({ email }: { email: string }) {
  return (
    <NoyziGradient
      seed={email}
      aria-label={`${email}'s gradient`}
      className="size-12 rounded-full"
    />
  );
}
```

Different seed, different artwork. The same seed always renders identically—even on the server.

## Make it yours 🎛️

```tsx
<NoyziGradient
  seed="summer-mixtape"
  options={{ colors: 7, layout: "scatter" }}
  artwork={{ width: 1600, height: 400 }}
  className="h-40 w-full rounded-2xl shadow-none"
/>
```

Use `className` or `style` for size and shape. For wide or tall elements, match `artwork` to the element’s aspect ratio so the gradient composition fills it beautifully.

Need a stable, shareable seed without exposing user data?

```tsx
import { NoyziGradient, seedHash } from "@noyzi/react";

const seed = seedHash("ada@example.com");

<NoyziGradient seed={seed} className="size-16 rounded-xl" />;
```

See all props and generation options in the [React API docs](https://noyzi.dev/docs#noyzigradient). 📖

## License

[MIT](https://opensource.org/license/mit) © Noyzi
