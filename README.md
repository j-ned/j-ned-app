# Portfolio — nedellec-julien.fr

Monorepo pnpm du portfolio : le site Angular et son API, avec l'historique Git des deux dépôts
d'origine (`ng-portfolio-app`, `nest-portfolio-app`).

| Dossier               | Paquet                  | Rôle                                                       | README                                                         |
| --------------------- | ----------------------- | ---------------------------------------------------------- | -------------------------------------------------------------- |
| `apps/web`            | `@portfolio/web`        | Angular 22 zoneless, SSR + prérendu, sortie Vercel         | [apps/web/README.md](apps/web/README.md)                       |
| `apps/api`            | `@portfolio/api`        | API Hono, Drizzle, Postgres                                | [apps/api/README.md](apps/api/README.md)                       |
| `packages/api-parity` | `@portfolio/api-parity` | Suite HTTP boîte noire de l'API : le contrat qu'elle tient | [packages/api-parity/README.md](packages/api-parity/README.md) |

## Démarrage

```bash
pnpm install          # un seul lockfile pour tout le workspace
pnpm dev:api          # Postgres (podman compose), puis l'API en watch sur :3000
pnpm dev:web          # ng serve, /api relayé vers :3000 (apps/web/proxy.conf.cjs)
```

Les commandes propres à une application se lancent depuis son dossier (`cd apps/web && pnpm test`)
ou depuis la racine avec un filtre (`pnpm --filter @portfolio/api test`).

## CI

Un workflow par application (`.github/workflows/web-ci.yml`, `api-ci.yml`, `web-a11y.yml`), déclenché
par les changements de son dossier et des fichiers communs (lockfile, `pnpm-workspace.yaml`). Aucun
conteneur : le site est jugé sur sa sortie Vercel rejouée en local (`apps/web/ci/vercel-local.mjs`,
smoke test et audit axe), l'API construite passe la suite de parité HTTP lancée par Node. La
production tourne sur Vercel, déployée depuis Git (ADR-0036, `vercel.json`).
