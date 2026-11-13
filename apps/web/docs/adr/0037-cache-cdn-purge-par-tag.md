# ADR-0037 — Cache CDN long, vidé par tag à chaque écriture de contenu

- **Statut** : remplacé par ADR-0038 (2026-11-13 : micro-cache nginx, sans purge)
- **Date** : 2026-11-03
- **Amende** : ADR-0036 §2 (cache CDN « `s-maxage` court + `stale-while-revalidate` »), ADR-0024 §3
  (fraîcheur d'une seconde)
- **Préserve** : ADR-0024 (une écriture admin est visible au rechargement suivant, sans rebuild)

## Context

Le HTML rendu à la requête portait `CDN-Cache-Control: max-age=1, stale-while-revalidate=59`, repris
du micro-cache nginx. Sur un portfolio peu visité, la copie a presque toujours plus d'une minute :
mesuré en production le 2026-11-03, la plupart des visites tombent sur un `MISS` (0,36 à 0,41 s,
3,4 s au démarrage à froid de la fonction de rendu et de l'API) au lieu d'un `HIT` (0,04 à 0,06 s).
Les lectures publiques de l'API (`/api/projects`, `/api/blog/posts`…) n'étaient jamais mises en
cache.

Faits vérifiés dans la documentation Vercel (2026-11-03) :

- Une réponse de fonction peut porter des tags (`Vercel-Cache-Tag`, liste séparée par des virgules),
  quel que soit le framework ; ils sont propres au projet et à l'environnement (production, preview).
- `@vercel/functions` purge par tag depuis une fonction : `invalidateByTag` (la copie périmée sert
  encore une fois, rafraîchie en arrière-plan) ou `dangerouslyDeleteByTag` (la requête suivante attend
  la nouvelle version). Hors de Vercel, ces appels ne font rien.
- La clé de cache contient l'URL de déploiement : chaque déploiement repart d'un cache vide.
- Le binding de service (rendu → API) contourne le CDN : le rendu lit toujours l'API à jour.

## Decision

1. **Un seul tag, `content`**, sur le HTML rendu à la requête, `sitemap.xml`, `rss.xml` et les lectures
   publiques de l'API (articles, projets, profil, guide de l'atelier, CV, configuration). Un tag par
   article ou projet ne gagnerait rien : les écritures sont rares et une liste dépend de chaque élément.
2. **Un jour de fraîcheur** (`max-age=86400`), puis `stale-while-revalidate` et `stale-if-error` d'une
   semaine. La durée ne borne que ce qu'aucune écriture ne change.
3. **L'API vide le tag** après toute écriture réussie (hors GET/HEAD, statut < 400) sous `/api/blog`,
   `/api/projects`, `/api/profile`, `/api/workshop-guide` et `/api/cv`, avant de répondre. Le like
   fait exception (amendement du 2026-11-11) : seule écriture ouverte à tout visiteur, il laissait un
   anonyme vider le cache à volonté. Le compteur affiché suit donc la durée du cache. Suppression (`dangerouslyDeleteByTag`) et non
   invalidation : le rechargement de l'admin doit montrer la nouvelle version, pas une dernière fois
   l'ancienne. Le trafic d'un portfolio rend la ruée vers l'origine négligeable.
4. Un échec de purge est journalisé sans faire échouer l'écriture, déjà faite.
5. Les routes admin, les messages de contact et la mesure d'audience ne sont ni mis en cache ni
   purgeants.

## Consequences

- Visites servies depuis le CDN dans l'immense majorité des cas ; la fonction de rendu et l'API ne
  tournent plus qu'après une écriture ou un déploiement.
- Le contrat « visible au rechargement suivant » repose désormais sur la purge : toute nouvelle route
  d'écriture qui change une page publique doit vivre sous un des préfixes purgeants (liste dans
  `apps/api/src/create-app.ts`).
- Les réponses CORS de l'API mises en cache portent l'origine de la première requête : sans effet en
  même origine (ADR-0034), à surveiller si une origine tierce revient.
- Tag et durée sont dupliqués entre `apps/web/src/server.ts` et `apps/api/src/common/cdn-cache.ts`
  (deux services sans paquet partagé) ; `ci/smoke.sh` vérifie le tag des pages et des flux.
