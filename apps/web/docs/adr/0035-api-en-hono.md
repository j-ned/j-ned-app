# ADR-0035 — API portée de NestJS à Hono, comportement HTTP inchangé

- **Statut** : accepté (2026-11-01)
- **Date** : 2026-11-01
- **Contexte** : phase 3 du passage à Hono dans le monorepo ; s'appuie sur ADR-0034 (même origine,
  cookie `__Host-`, contrôle d'origine) et sur la suite de parité HTTP (`packages/api-parity`)

## Context

L'API (`apps/api`) tournait sous NestJS 12 avec Express : injection de dépendances par décorateurs,
`ValidationPipe`, passport-jwt, `@nestjs/throttler`, multer, helmet, nestjs-pino, `@sentry/nestjs`,
`@nestjs/schedule`. Le propriétaire veut une API Hono dans le monorepo Angular, sans régression de
sécurité. Une suite boîte noire de 206 tests (phase 2) fige le contrat HTTP de l'image Docker.

## Decision

1. **Portage sur place**, dans `apps/api` : même paquet, même image (`nest-portfolio-app` sur GHCR, nom
   conservé pour Dokploy). Le retour arrière est le redéploiement de l'image précédente.
2. **Changer le framework, pas le comportement** : la validation reste class-validator, appliquée par
   `validateDto()` avec les options du `ValidationPipe` (liste blanche stricte, conversion implicite,
   mêmes messages). Le passage à Zod se fera DTO par DTO, la suite de parité en garde-fou.
3. **Plus d'injection par conteneur** : services en classes simples, assemblés par
   `createServices()` ; une fabrique de routes Hono par module (`xxxRoutes(services…, requireAuth)`).
4. **Équivalences** : passport-jwt → `requireAuth` + `jsonwebtoken` (même bibliothèque que
   `@nestjs/jwt` : les sessions survivent à la bascule) ; throttler → `throttle()` (fenêtre fixe en
   mémoire, par route et par IP) ; multer + `ParseFilePipe` → `uploadedFile()` (413, puis 422 sur le
   type lu dans les octets via `file-type`) ; helmet → `secureHeaders` ; nestjs-pino → pino ;
   `@sentry/nestjs` → `@sentry/node` ; `@Cron` → `croner` ; `PartialType` → `common/partial-type.ts`.
5. **Écarts normalisés** (laissés libres par la suite de parité) : le champ `error` vaut toujours
   l'intitulé HTTP du statut ; le 429 ne nomme plus la bibliothèque.

## Consequences

- Plus de dépendance `@nestjs/*`, Express, passport, multer ni helmet dans l'image.
- La suite de parité passe à l'identique contre l'image Hono (206/206), et les tests unitaires passent
  de 1 289 à 1 351.
- Plus de Swagger en développement : à régénérer depuis des schémas Zod le jour où les DTO y passent.
- Les quotas restent en mémoire : une seconde instance de l'API aurait ses propres compteurs.
- En développement, `pnpm dev` compile par `tsc --watch` : esbuild/tsx n'émettent pas les métadonnées
  de décorateurs dont dépend la conversion implicite de class-validator.
