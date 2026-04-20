# syntax=docker/dockerfile:1.7

# ==============================================================================
# Stage 1 — Build : Angular SSR prerender + Hono bundle + SQL migrations
# ==============================================================================
FROM node:22-alpine AS build

RUN apk add --no-cache python3 make g++
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts \
 && pnpm rebuild argon2 esbuild

COPY . .
RUN pnpm run build --configuration production \
 && pnpm run build:api \
 && pnpm run db:generate \
 && test -f dist/angular-portfolio-app/browser/index.html \
 && test -f dist/server/index.mjs

# ==============================================================================
# Stage 2 — Prod deps : node_modules minimal avec natifs rebuild (argon2 + sharp)
# ==============================================================================
FROM node:22-alpine AS prod-deps

RUN apk add --no-cache python3 make g++
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod --ignore-scripts \
 && pnpm rebuild argon2 sharp

# ==============================================================================
# Stage 3 — Runtime : Node alpine + bundle Hono + static Angular + migrations
# Un seul process : Hono sert l'API, le static Angular et le fallback SPA.
# Traefik (Dokploy) gère HTTPS/HSTS/compression edge en amont.
# ==============================================================================
FROM node:22-alpine AS production

WORKDIR /app

COPY --from=build /app/dist /app/dist
COPY --from=build /app/server/db/migrations /app/server/db/migrations
COPY --from=prod-deps /app/node_modules /app/node_modules

ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000

# Healthcheck avec Node natif (pas de wget/curl nécessaire dans l'image)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/api/sitemap.xml',r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/server/index.mjs"]
