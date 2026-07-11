# syntax=docker/dockerfile:1.7

ARG BUN_VERSION=1.3.10

FROM oven/bun:${BUN_VERSION}-alpine AS base
WORKDIR /app
ENV BUN_INSTALL_CACHE_DIR=/tmp/bun-cache

# Keep dependency installation independent from application source changes.
FROM base AS dependencies
COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/react/package.json packages/react/package.json
RUN --mount=type=cache,target=/tmp/bun-cache \
	bun install --frozen-lockfile

FROM dependencies AS build
COPY . .
RUN bun run build

FROM base AS runtime
ENV NODE_ENV=production \
	PORT=3000

COPY --from=dependencies --chown=bun:bun /app/node_modules ./node_modules
COPY --from=build --chown=bun:bun /app/apps/web ./apps/web
COPY --from=build --chown=bun:bun /app/packages ./packages

USER bun
EXPOSE 3000

CMD ["bun", "run", "--cwd", "apps/web", "start"]
