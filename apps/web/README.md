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
