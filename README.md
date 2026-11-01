# Portfolio — nedellec-julien.fr

Monorepo pnpm du portfolio : le site Angular et son API, avec l'historique Git des deux dépôts
d'origine (`ng-portfolio-app`, `nest-portfolio-app`).

| Dossier    | Paquet           | Rôle                                                       | README                                   |
| ---------- | ---------------- | ---------------------------------------------------------- | ---------------------------------------- |
| `apps/web` | `@portfolio/web` | Angular 22 zoneless, SSR + prérendu, nginx devant Node     | [apps/web/README.md](apps/web/README.md) |
| `apps/api` | `@portfolio/api` | API NestJS (migration vers Hono prévue), Drizzle, Postgres | [apps/api/README.md](apps/api/README.md) |

## Démarrage

```bash
pnpm install          # un seul lockfile pour tout le workspace
pnpm dev:api          # Postgres + Mailpit (podman compose), puis l'API en watch sur :3000
pnpm dev:web          # ng serve, /api relayé vers :3000 (apps/web/proxy.conf.cjs)
```

Les commandes propres à une application se lancent depuis son dossier (`cd apps/web && pnpm test`)
ou depuis la racine avec un filtre (`pnpm --filter @portfolio/api test`).

## Images Docker

Le contexte de build est **la racine du dépôt** (lockfile commun). Chaque Dockerfile a son
`Dockerfile.dockerignore`, qui ne laisse entrer que les manifestes du workspace et son application.

```bash
docker buildx bake web-ci       # site : étage de tests + image de production (ng-portfolio-app:ci)
docker buildx bake api --load   # API (nest-portfolio-app:ci)
```

La CI publie sous les noms d'images d'avant le monorepo (`ghcr.io/j-ned/ng-portfolio-app`,
`ghcr.io/j-ned/nest-portfolio-app`) : Dokploy n'a rien à changer.

## CI

Un workflow par application (`.github/workflows/web-ci.yml`, `api-ci.yml`, `web-a11y.yml`), déclenché
par les changements de son dossier et des fichiers communs (lockfile, `pnpm-workspace.yaml`).
