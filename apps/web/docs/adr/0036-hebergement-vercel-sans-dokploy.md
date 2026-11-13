# ADR-0036 — Hébergement sur Vercel (Services), Dokploy retiré

- **Statut** : remplacé par ADR-0038 (2026-11-13 : retour sur le serveur personnel)
- **Date** : 2026-11-01
- **Amende** : ADR-0024 (nginx et Node dans la même image), ADR-0034 §1 (relais nginx de `/api/`)
- **Préserve** : ADR-0034 (même origine, cookie `__Host-`, contrôle d'origine), ADR-0035 (API Hono,
  contrat figé par `packages/api-parity`)
- **Modèle** : candidash-app, déjà sur Vercel (Services, Hono, Neon, R2)

## Context

Le propriétaire retire Dokploy et son serveur. Le portfolio y tournait en deux conteneurs (site :
nginx devant le rendu Node d'Angular ; API Hono) plus Postgres. Les fichiers sont déjà sur Cloudflare
R2, le SMTP et Sentry sont externes.

Faits vérifiés dans la documentation Vercel (2026-11-01) :

- **Services** : plusieurs services dans un projet, routés par les `rewrites` du `vercel.json` racine ;
  un service non routé reste privé. Un service en appelle un autre par un **binding** (URL injectée,
  appel interne qui contourne pare-feu et CDN, sans authentification propre).
- Fonctions : **corps de requête et de réponse limités à 4,5 Mo** (413 `FUNCTION_PAYLOAD_TOO_LARGE`),
  250 Mo décompressés, 300 s par défaut, géolocalisation par `x-vercel-ip-country`, réponses de fonction
  mises en cache par le CDN selon `Cache-Control`.
- **Angular n'est pas un framework pris en charge nativement** (SSR) ; la *Build Output API* permet à
  un build de fournir lui-même ses fichiers statiques, ses fonctions et ses routes, y compris par
  service (`.vercel/output/services/<nom>`).
- Runtime **conteneur** en bêta, mêmes limites que les fonctions.

## Decision

1. **Un projet Vercel en mode Services**, branché sur `j-ned-app` : service `api` (Hono, fonction Node,
   région `fra1`) et service `web` ; `/api/*` → `api`, le reste → `web`. Même origine conservée.
2. **Site** : le build Angular est traduit en *Build Output API* : fichiers et pages prérendues en
   statique sur le CDN, une fonction Node autour du `reqHandler` pour les pages rendues à la requête,
   `sitemap.xml` et `rss.xml`. Le micro-cache nginx devient le cache CDN (`s-maxage` court +
   `stale-while-revalidate`) ; en-têtes de sécurité, 410 et routes fermées passent dans la config de
   routes. Repli si besoin : runtime conteneur.
3. **Rendu → API par binding** : le service `web` déclare un binding vers `api` (variable
   `API_UPSTREAM`), plus un secret partagé (`SSR_FORWARD_SECRET`) que l'API exige avant de croire
   l'IP du visiteur transmise par le rendu (quotas par visiteur).
4. **Base** : Neon (Postgres, Frankfurt), données copiées par `pg_dump` / `pg_restore` ; pool réduit
   par instance.
5. **Quotas comptés en base** (fenêtre fixe, purgée par le cron) : plusieurs instances, aucune mémoire
   partagée.
6. **Cron** : Vercel Cron appelle une route de l'API protégée par `CRON_SECRET` (rollup analytics,
   purge des quotas), à la place de `croner`.
7. **Pays du visiteur** : `x-vercel-ip-country` remplace `geoip-lite` (111 Mo de données en moins).
8. **Envois de fichiers** : l'admin envoie le fichier directement à R2 par une URL présignée (PUT),
   puis l'API le relit, le valide (taille, type par les octets) et le traite comme avant.
9. **Bascule sans coupure** : Vercel et Neon montés en parallèle, vérifiés sur l'URL de preview (suite
   de parité comprise), dernière copie de la base, DNS de `nedellec-julien.fr` et `api.` vers Vercel,
   vérification en production ; Dokploy n'est supprimé qu'ensuite.

## Consequences

- Plus de serveur, de conteneur, de nginx ni de Postgres à maintenir ; facturation à l'usage.
- La CI ne publie plus d'images GHCR et n'appelle plus Dokploy ; Vercel déploie depuis Git (preview par
  PR, production sur `master`). Les Dockerfiles, gardés le temps de la bascule, sont retirés le
  2026-11-02 avec tout le harnais Docker : la CI juge la sortie Vercel rejouée en local
  (`apps/web/ci/vercel-local.mjs`) et l'API construite lancée par Node.
- Le cache CDN remplace la copie périmée servie par nginx quand l'API tombe
  (`stale-while-revalidate` et `stale-if-error`).
- Les quotas en base ajoutent une écriture par requête limitée ; acceptable au trafic d'un portfolio.
- Le contrat HTTP reste vérifié par `packages/api-parity`, rejouée en CI contre l'API construite
  (`dist/main.js`), devant le Postgres du job.
