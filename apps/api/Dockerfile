# syntax=docker/dockerfile:1.7

# =============================================================================
# Stage 1 - builder : dépendances complètes, compilation de l'API (tsc)
# =============================================================================
FROM node:26-alpine AS builder
RUN npm install --global pnpm@10.33.2 \
 && apk add --no-cache python3 make g++ libc6-compat
# Contexte de build : la racine du monorepo (lockfile commun).
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json apps/api/
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter @portfolio/api

WORKDIR /repo/apps/api
COPY apps/api/tsconfig.json apps/api/tsconfig.build.json ./
COPY apps/api/src ./src
RUN pnpm build

# =============================================================================
# Stage 2 - prod-deps : dépendances de production autonomes (`pnpm deploy`), modules natifs compris
# (argon2, sharp). `--legacy` : sans lui, pnpm exige `injectWorkspacePackages` pour tout le workspace.
# =============================================================================
FROM node:26-alpine AS prod-deps
RUN npm install --global pnpm@10.33.2 \
 && apk add --no-cache python3 make g++ libc6-compat
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json apps/api/
# Le `prepare` de la racine (husky, dépendance de développement) n'a pas sa place dans un déploiement
# de production et l'arrêterait : retiré de la copie.
RUN npm pkg delete scripts.prepare
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm --filter @portfolio/api deploy --prod --legacy --frozen-lockfile /app

# =============================================================================
# Stage 3 - runner : image minimale, non-root, tini PID 1
# =============================================================================
FROM node:26-alpine AS runner
RUN apk add --no-cache libc6-compat tini wget
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=prod-deps /app/package.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /repo/apps/api/dist ./dist
# Lu par `dist/database/scripts/migrate.js`.
COPY apps/api/drizzle ./drizzle

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q -O /dev/null http://localhost:3000/api/health || exit 1

EXPOSE 3000
USER node

# tini en PID 1 : SIGTERM arrive à Node, qui termine les requêtes en cours (`main.ts`).
ENTRYPOINT ["/sbin/tini", "--"]
# Les migrations ne partent pas au démarrage : le déploiement lance d'abord
# `node dist/database/scripts/migrate.js` avec cette même image, puis remplace le conteneur.
CMD ["node", "dist/main.js"]
