# syntax=docker/dockerfile:1.7

# =============================================================================
# Stage 1 - builder : install full deps + compile the API (tsc)
# =============================================================================
FROM node:24-alpine AS builder
RUN corepack enable \
 && corepack prepare pnpm@10.33.2 --activate \
 && apk add --no-cache python3 make g++ libc6-compat
# Contexte de build : la racine du monorepo (lockfile commun).
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter @portfolio/api

WORKDIR /repo/apps/api
COPY apps/api/tsconfig.json apps/api/tsconfig.build.json ./
COPY apps/api/src ./src
RUN pnpm build

# =============================================================================
# Stage 2 - prod-deps : dépendances de production autonomes (`pnpm deploy`), dont drizzle-kit,
# dotenv (runtime de `pnpm db:migrate`) et tsx (`pnpm db:change-password` et autres scripts admin)
# =============================================================================
FROM node:24-alpine AS prod-deps
RUN corepack enable \
 && corepack prepare pnpm@10.33.2 --activate \
 && apk add --no-cache python3 make g++ libc6-compat
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json apps/api/
RUN pnpm --filter @portfolio/api deploy --prod --frozen-lockfile /app
# `packageManager` vit à la racine du monorepo : reporté dans le package.json déployé, sinon
# corepack téléchargerait la dernière version de pnpm au premier `pnpm db:migrate` du conteneur.
RUN node -e "const fs=require('fs');const p='/app/package.json';const j=JSON.parse(fs.readFileSync(p));j.packageManager=require('/repo/package.json').packageManager;fs.writeFileSync(p,JSON.stringify(j,null,2))"

# =============================================================================
# Stage 3 - runner : image minimale, non-root, tini PID 1
# =============================================================================
FROM node:24-alpine AS runner
RUN corepack enable \
 && corepack prepare pnpm@10.33.2 --activate \
 && apk add --no-cache libc6-compat tini wget
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=prod-deps /app/package.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /repo/apps/api/dist ./dist
COPY apps/api/drizzle ./drizzle
COPY apps/api/drizzle.config.ts ./
COPY apps/api/src/database/schema ./src/database/schema
COPY apps/api/tsconfig.json ./

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q -O /dev/null http://localhost:3000/api/health || exit 1

EXPOSE 3000
USER node

# tini en PID 1 pour gérer SIGTERM proprement (arrêt propre de l'API)
ENTRYPOINT ["/sbin/tini", "--"]
# Migrations Drizzle idempotentes, puis démarrage de l'API
CMD ["sh", "-c", "pnpm db:migrate && node dist/main.js"]
