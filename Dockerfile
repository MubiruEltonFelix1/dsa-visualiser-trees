# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Build stage: produces the client bundle plus the Nitro Node server in
# `.output/`. Bun is used because `bun.lock` is the committed lockfile.
# ---------------------------------------------------------------------------
FROM oven/bun:1-slim AS build

WORKDIR /app

# Install dependencies first so source edits don't invalidate this layer.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# VITE_* values are baked into the browser bundle, so they must be present at
# build time. Pass them as build args: --build-arg VITE_PUBLIC_SITE_URL=https://your.domain
ARG VITE_PUBLIC_SITE_URL=""
ENV VITE_PUBLIC_SITE_URL=${VITE_PUBLIC_SITE_URL}

ENV NODE_ENV=production
RUN bun run build

# ---------------------------------------------------------------------------
# Runtime stage: only the built server and its static assets. No dev deps, no
# source, no lockfile.
# ---------------------------------------------------------------------------
FROM node:22-slim AS runtime

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

WORKDIR /app

# Run as the unprivileged user that ships with the Node image.
COPY --from=build --chown=node:node /app/.output ./.output

USER node

EXPOSE 3000

# Fails the container health check if the app stops answering on /api/health.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", ".output/server/index.mjs"]
