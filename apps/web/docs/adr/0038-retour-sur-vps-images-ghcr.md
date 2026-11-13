# ADR-0038 — Retour sur un VPS personnel, images publiées sur GHCR

- **Statut** : accepté, en cours d'application (Vercel et Neon restent en production jusqu'à la bascule)
- **Date** : 2026-11-13
- **Remplacera à la bascule** : ADR-0036 (hébergement Vercel), ADR-0037 (cache CDN purgé par tag)
- **Rétablit** : ADR-0024 (nginx et Node dans la même image), ADR-0034 §1 (relais nginx de `/api/`)
- **Préserve** : ADR-0034 (même origine, cookie `__Host-`), ADR-0035 (API Hono, contrat figé par
  `packages/api-parity`)

## Context

Le propriétaire quitte Vercel et Neon pour un VPS personnel. Le portfolio y tournait déjà en
conteneurs avant le 2026-11-01 ; le harnais retiré le 2026-11-02 est dans l'historique. Fichiers
(Cloudflare R2), mail (Resend) et Sentry sont externes et ne changent pas.

## Decision

1. **Deux images**, construites par la CI depuis la racine du monorepo et publiées sur GHCR depuis
   `master` (`j-ned-app-web`, `j-ned-app-api`, tags `latest` et `sha-<commit>`) : le site (nginx devant
   le rendu Node d'Angular) et l'API Hono. Postgres 17 tourne en conteneur sur le VPS.
2. **Pas de Dokploy** : `docker compose` sur le VPS, derrière un proxy de bordure qui termine le TLS.
   Le conteneur du site ne s'expose jamais sans lui : nginx et l'API croient la dernière entrée de
   `X-Forwarded-For`, celle que ce proxy écrit.
3. **Cache** : micro-cache nginx d'une seconde devant le rendu, copie périmée servie si le rendu ou
   l'API échoue. Aucune purge à déclencher : une écriture est visible au rechargement suivant.
4. **Production déclarée par `APP_ENV=production`** hors Vercel (mail et stockage obligatoires au
   démarrage) ; `VISITOR_IP_HEADER` nomme l'en-tête où nginx écrit l'IP du visiteur pour le rendu.
5. **Migrations par l'image de l'API** (`node dist/database/scripts/migrate.js`, migrateur de
   drizzle-orm, même table de suivi que `drizzle-kit migrate`), lancées par le déploiement avant le
   remplacement du conteneur, jamais au démarrage.
6. **Cron quotidien** : un minuteur du VPS appelle `/api/cron/daily` avec `CRON_SECRET`.
7. **Bascule sans coupure** : la CI juge les deux cibles (sortie Vercel et images) tant que Vercel sert
   la production ; données copiées par `pg_dump` / `pg_restore`, DNS basculé, Vercel et Neon supprimés
   après une période d'observation.

## Consequences

- Un serveur, deux conteneurs, nginx et Postgres à maintenir, sauvegardes de la base comprises
  (`pg_dump` quotidien hors du serveur, restauration testée) : Neon les fournissait.
- Plus de preview par PR ni de branche Neon `preview` après la bascule.
- **Pays du visiteur perdu** dans la mesure d'audience : nginx efface `x-vercel-ip-country`, qu'un
  visiteur pourrait sinon choisir. Le rétablir demande une base GeoIP ou un CDN, non décidé.
- Quotas comptés en mémoire (un seul process) : la table `rate_limit` et `@vercel/functions` partent au
  nettoyage qui suit la bascule, avec `vercel.json` et la sortie Vercel.
- Tout le trafic sort du VPS : plus de CDN devant les fichiers statiques.
