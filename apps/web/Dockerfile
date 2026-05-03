# syntax=docker/dockerfile:1.7

# ==============================================================================
# Stage 1 — Build : Angular SSR prerender
# ==============================================================================
FROM node:22-alpine AS build

RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build --configuration production \
 && test -f dist/angular-portfolio-app/browser/index.html

# ==============================================================================
# Stage 2 — Runtime : serve Angular SSR via @angular/ssr Node adapter
# The NestJS backend (nest-portfolio-app) runs separately on port 3000.
# Angular dev-server proxies /api → NestJS (proxy.conf.cjs).
# In production, a reverse proxy (Traefik/Nginx) handles routing.
# ==============================================================================
FROM node:22-alpine AS production

WORKDIR /app

COPY --from=build /app/dist /app/dist
COPY --from=build /app/node_modules /app/node_modules

ENV NODE_ENV=production \
    PORT=4000

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:4000/',r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/angular-portfolio-app/server/server.mjs"]
