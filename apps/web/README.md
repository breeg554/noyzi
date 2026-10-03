# Noyzi website

The Noyzi website contains the gradient gallery, examples, and API documentation.

## Development

From the repository root:

```bash
bun install
bun run dev
```

## Validation

```bash
bun run typecheck
bun run test
bun run check
bun run build
```

## Production

Build and start the production server:

```bash
bun run build
bun run --filter web start
```

## MCP endpoint

`https://noyzi.dev/mcp` exposes `generate_gradient` over stateless MCP Streamable HTTP, without authentication. During development, use `http://localhost:3000/mcp`.

Any MCP client supporting Streamable HTTP can connect. The public endpoint allows browser requests from any origin and does not require a ChatGPT-specific client or plugin.

The tool accepts a required `seed`, an optional `palette` of 2–8 `#rrggbb` colors (background first), and optional `width`, `height`, and `format`. Defaults are 1000×1000 PNG. PNG, WebP, and JPG allow up to 2400 pixels per side; SVG allows 4096.

Results include a versioned public image URL, seed, resolved palette, dimensions, format, and renderer version. Images are rendered by the existing image service when their URLs are fetched. Seeds appear in public URLs; use non-sensitive labels. Reusing a seed and palette size preserves composition.

For example, call `generate_gradient` with:

```json
{
  "seed": "summer-launch",
  "palette": ["#fff4df", "#ff9166", "#eaa0c5"],
  "width": 1920,
  "height": 1080,
  "format": "png"
}
```

POST handles MCP requests; OPTIONS handles CORS preflight. GET and DELETE return 405 because the endpoint does not maintain sessions or server event streams.
