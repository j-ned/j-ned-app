# ADR-0038 — Retour sur le serveur personnel, images publiées sur GHCR

- **Statut** : accepté, en cours d'application (Vercel et Neon restent en production jusqu'à la bascule)
- **Date** : 2026-11-13
- **Remplacera à la bascule** : ADR-0036 (hébergement Vercel), ADR-0037 (cache CDN purgé par tag)
- **Rétablit** : ADR-0024 (nginx et Node dans la même image), ADR-0034 §1 (relais nginx de `/api/`)
- **Préserve** : ADR-0034 (même origine, cookie `__Host-`), ADR-0035 (API Hono, contrat figé par
  `packages/api-parity`)

## Context

Le propriétaire quitte Vercel et Neon pour son serveur personnel. Ce serveur n'ouvre aucun port sur
Internet : le trafic arrive par un tunnel Cloudflare (cloudflared), qui le remet en HTTP au Traefik
géré par Dokploy ; le TLS est celui de Cloudflare. Le portfolio tournait déjà en conteneurs avant le
2026-11-01 ; le harnais retiré le 2026-11-02 est dans l'historique. Fichiers (Cloudflare R2), mail
(Resend) et Sentry sont externes et ne changent pas.

## Decision

1. **Trois images**, construites par la CI et publiées sur GHCR depuis `master` (tags `latest` et
   `sha-<commit>`) : le site (`j-ned-app-web`, nginx devant le rendu Node d'Angular), l'API Hono
   (`j-ned-app-api`) et la sauvegarde de la base (`j-ned-app-backup`).
2. **Dokploy, service de type Compose** (`deploy/compose.yaml`) : il tire les images et ne construit
   rien. Aucun port publié ; seul le site rejoint `dokploy-network`, où Traefik le joint. API, base,
   migrations, cron et sauvegarde restent sur le réseau privé de la pile, sous des noms préfixés
   (`portfolio-…`) qu'aucune autre pile du serveur ne peut usurper.
3. **Visiteur lu dans les en-têtes de Cloudflare** : nginx prend l'adresse dans `CF-Connecting-IP`
   (Traefik ne voit que cloudflared) et le pays dans `CF-IPCountry`, et les transmet à l'API et au
   rendu ; un en-tête de pays envoyé par le visiteur est ignoré.
4. **Cache** : micro-cache nginx d'une seconde devant le rendu, copie périmée servie si le rendu ou
   l'API échoue. Aucune purge à déclencher : une écriture est visible au rechargement suivant.
5. **Production déclarée par `APP_ENV=production`** hors Vercel (mail et stockage obligatoires au
   démarrage) ; `VISITOR_IP_HEADER` nomme l'en-tête où nginx écrit l'IP du visiteur pour le rendu.
6. **Migrations par l'image de l'API** (`node dist/database/scripts/migrate.js`, migrateur de
   drizzle-orm, même table de suivi que `drizzle-kit migrate`), dans un service du compose qui doit
   réussir avant que l'API ne soit remplacée.
7. **Cron quotidien** : un service du compose appelle `/api/cron/daily` avec `CRON_SECRET` à minuit
   UTC.
8. **Sauvegardes** : dump quotidien chiffré (gpg, AES-256) envoyé dans un bucket R2 dédié ; la CI
   rejoue sauvegarde et restauration à chaque changement de l'image.
9. **Déploiement déclenché par la CI** : une fois les images publiées, le workflow `Deploy` appelle
   l'API de Dokploy (`compose.deploy`). Retour à une version en fixant le tag `sha-<commit>`.
10. **Bascule sans coupure** : la CI juge les deux cibles (sortie Vercel et images) tant que Vercel
    sert la production ; données copiées par `pg_dump` / `pg_restore`, DNS basculé, Vercel et Neon
    supprimés après une période d'observation.

## Consequences

- Deux conteneurs applicatifs, nginx et Postgres à maintenir, sauvegardes comprises : Neon les
  fournissait. Un échec de sauvegarde n'alerte personne, il se lit dans les journaux.
- Plus de preview par PR ni de branche Neon `preview` après la bascule.
- Le site dépend de Cloudflare (tunnel, TLS, adresse et pays du visiteur) et de la disponibilité du
  serveur personnel et de sa connexion.
- Un accès par le réseau local, sans Cloudflare, retombe sur l'adresse écrite par Traefik : une
  machine du réseau local peut y présenter l'adresse de son choix.
- Quotas comptés en mémoire (un seul process) : la table `rate_limit` et `@vercel/functions` partent au
  nettoyage qui suit la bascule, avec `vercel.json` et la sortie Vercel.
