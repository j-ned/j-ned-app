# ADR-0024 — Pages de contenu rendues à la requête, nginx et Node dans la même image, plus aucun rebuild sur écriture

- **Statut** : accepté (2026-10-10), appliqué par la spec 022 ; arbitrages du propriétaire listés en fin de spec
- **Date** : 2026-10-10
- **Contexte spec** : `specs/022-contenu-instantane.md`
- **Amende** : ADR-0023 §5 (publication par `SiteRebuild`) et §6 (build intransigeant)
- **Préserve** : ADR-0001 (hydratation incrémentale), ADR-0014 (`@defer (on immediate; hydrate never)`),
  ADR-0018 (images même origine), ADR-0021 (relais de mesure)

## Context

Le propriétaire exige qu'une écriture depuis l'admin (formulaire, envoi d'image, ordre, suppression)
soit visible au rechargement suivant, sans rebuild ; un push de code garde le déploiement Dokploy.
Or toutes les pages publiques sont prérendues au build (`app.routes.server.ts`), le conteneur ne sert
que `browser/` par nginx, et la seule publication existante est un webhook Dokploy appelé par le blog
(build de plusieurs minutes, refusé par le propriétaire). Une écriture de projet n'est aujourd'hui
jamais publiée avant un push.

Faits vérifiés : `outputMode: "server"` et `src/server.ts` existent déjà ; `@angular/ssr` 22.2.1
fournit `AngularNodeAppEngine`, `createNodeRequestHandler`, `writeResponseToNodeResponse`,
`isMainModule`, la validation `allowedHosts` (400 sinon) et `REQUEST_CONTEXT`/`RESPONSE_INIT` ;
`@angular/common/http` fournit `HTTP_TRANSFER_CACHE_ORIGIN_MAP`. `autoCsp` est incompatible avec le
SSR (doc angular.dev, *Security*) ; la CSP du repo est déjà un post-traitement maison
(`scripts/apply-csp-hashes.mjs`). Le bundle serveur importe `jsdom` à l'exécution
(`externalDependencies`). L'API limite les lectures publiques à 120/min par IP.

## Decision

1. **Matrice de rendu** : `''`, `about`, `projects`, `projects/:slug`, `blog`, `blog/:slug` en
   `RenderMode.Server` ; offres, mentions, confidentialité en `Prerender` ; admin, auth, `**` en
   `Client`. `getPrerenderParams` et `fetchPrerenderSlugs` disparaissent : le build ne lit plus l'API.
2. **Topologie** : une seule image ; nginx (port 3000) sert statiques, prérendu, coquille CSR, relais,
   en-têtes, et relaie une **liste fermée** de routes à `node server.mjs` (loopback `127.0.0.1:4000`,
   sans Express) ; un script de démarrage surveille les deux processus et sort si l'un meurt ;
   `HEALTHCHECK` sur `/healthz` (Node vivant, sans appel API).
3. **Fraîcheur et résilience** : micro-cache nginx de 1 s sur le HTML rendu, servi périmé
   (`proxy_cache_use_stale`) si Node échoue ou répond 5xx ; le rendu répond **503** dès qu'une lecture
   d'API échoue (statut 0, 429, 5xx) pour ne jamais mettre en cache une page dégradée comme bonne ;
   cache non persistant (vidé à chaque déploiement, sinon HTML citant des chunks disparus).
4. **Sécurité SSR** : `Host` forcé par nginx, `security.allowedHosts` dans `angular.json`, en-têtes
   `X-Forwarded-*` retirés avant Node, URL d'API interne fixée par variable d'environnement
   (`API_UPSTREAM`) et jamais dérivée de la requête ; l'adresse du visiteur est transmise à l'API en
   `X-Forwarded-For` pour conserver un quota par visiteur.
5. **CSP** : une fonction pure `hardenCsp` partagée entre le `postbuild` et le serveur ; à la requête,
   seuls les scripts inline constants connus du build et le bootstrap jsaction de forme exacte sont
   hachés ; tout autre script inline reste bloqué.
6. **Dérivés** : `sitemap.xml` et `rss.xml` rendus à la requête par le serveur Node du front ; scripts
   de build et fichiers `public/*.xml` supprimés.
7. **Publication** : aucun webhook ni rebuild sur écriture. `SiteRebuild` (A1) et le rebuild des projets
   (A4) sont retirés de la spec 021 ; le webhook blog est retiré par une PR API après la bascule.

## Consequences

- Une écriture est visible au plus 1 s après l'enregistrement ; plus de rafales de builds ; la fenêtre
  « site en ligne qui cite une clé de portrait supprimée » d'ADR-0023 §7 se réduit aux pages déjà
  ouvertes et aux copies périmées servies en panne.
- Le build ne dépend plus de l'API : la CI front ne casse plus quand l'API est en panne ou pas encore
  déployée. L'ordre API puis front reste requis, car le front lit l'API à l'exécution.
- Un processus Node permanent sur le homeserver (mémoire et CPU à mesurer, `max-old-space-size`), une
  image plus lourde (`node_modules` de production pour `jsdom`), une nouvelle dépendance de dev
  (`@types/node`).
- Chaque route de contenu ajoutée doit l'être dans `app.routes.server.ts` **et** dans la location nginx.
- À froid (juste après un déploiement) avec l'API en panne, le visiteur reçoit la page d'erreur (503),
  le client réessaie à l'hydratation.

## Alternatives considered

- **Garder le prérendu + webhook de rebuild** (A1/A4) : minutes de délai, builds en rafale, refusé par
  le propriétaire.
- **Prérendu + revalidation incrémentale (ISR)** : non fourni par `@angular/ssr` ; à construire à la
  main (cache, invalidation depuis l'API, purge nginx) pour un gain de TTFB que le rendu direct rend
  marginal sur ce trafic.
- **Rendu client des pages de contenu** : contenu absent du HTML servi, SEO et LCP dégradés.
- **Deux services Dokploy** (nginx, Node) : fenêtre de déploiement où le HTML et les chunks ne viennent
  pas du même build.
- **Node seul** (Express servant aussi les statiques) : perte du cache disque des images (ADR-0018) et
  de la copie périmée en panne ; dépendance ajoutée.
- **CSP par nonce** : Angular ne pose le nonce que sur ses propres styles et le script d'event replay ;
  le contrat jsaction, la pré-peinture du thème et le script de beasties exigeraient de toute façon un
  post-traitement ; un nonce posé après coup sur tout script inline autoriserait aussi un script
  injecté.
- **Aucun cache HTML** : instantané strict, mais une API en panne publie une erreur à tous les
  visiteurs (alternative présentée à l'arbitrage du propriétaire).
- **Sitemap et RSS servis par l'API** : identité, offres et rendu Markdown assaini dupliqués côté API.
