# ADR-0005 — Catalogue d'offres : contenu scindé, routes statiques générées, URL héritée redirigée par nginx

- **Statut** : accepté
- **Date** : 2026-10-04
- **Contexte spec** : `specs/009-plateforme-acquisition.md`
- **Prolonge** : ADR-0004 (contenu statique de feature = constante de domaine), ADR-0001
  (`@defer` des routes publiques avec trigger `hydrate`)

## Context

La page d'offre unique de la spec 007 (`/offre-site-industrie`, constante `SITE_OFFER`) devient
un catalogue de cinq offres partageant un gabarit, avec une page catalogue, une page par offre,
des données SEO par offre (title, description, JSON-LD `Service`/`Offer`, `BreadcrumbList`) et
une entrée sitemap par offre. Contraintes vérifiées :

- **Production = fichiers statiques.** Le `Dockerfile` sert le dossier `browser` prérendu avec
  nginx ; `src/server.ts` n'est pas exécuté en production. Un statut HTTP (301, 404) ne peut pas
  venir d'Angular à la requête.
- **Le shell et la home sont eager.** Le footer (et bientôt le header) liste les offres, la home
  les présente : ce qu'ils importent entre dans le bundle initial.
- **L'ancienne URL figure dans de la prospection déjà envoyée** et doit continuer de répondre,
  sans contenu dupliqué indexable.
- Le contenu est figé, sans source distante envisagée (critère de l'ADR-0004).

## Decision

1. **Deux constantes de domaine, pas une.** `OFFERS` (résumés ordonnés : slug, famille, nom,
   public, promesse, prix d'appel, données SEO) est importable partout, y compris par le shell,
   la home et les scripts Node. `OFFER_PAGES` (contenu complet, indexé par slug, annoté
   `: OfferPages`, soit `{ readonly [S in OfferSlug]: OfferPageContent }`, ce qui refuse une page
   manquante comme une clé en trop ; pas de `as const`, qui figerait les lignes de prix en types
   littéraux) n'est importé que par le chunk
   lazy des routes d'offre. Les montants vivent dans `OFFER_PRICES`, source unique des cartes,
   des pages et du JSON-LD.
2. **Routes statiques générées depuis `OFFERS`**, sous une route `offres` en `loadChildren` :
   une route par offre (`offres/<slug>`), dont `data` porte le résumé, le contenu et les
   `SeoData` calculées par une fonction pure. Les server routes `Prerender` et le sitemap sont
   générés depuis la même constante. Un slug inconnu ne correspond à aucune route : nginx ne
   trouve pas de fichier et renvoie la 404 réelle déjà configurée.
3. **L'URL héritée est redirigée par nginx** (`return 301`, `absolute_redirect off`, query
   conservée). La route Angular `redirectTo` ne couvre que la navigation client et n'est pas
   prérendue.

## Consequences

- Ajouter une offre = un slug dans l'union `OfferSlug`, une entrée dans `OFFERS`, une page dans
  `OFFER_PAGES` (la compilation refuse l'oubli de la page ; un test de domaine refuse l'oubli ou
  le doublon dans `OFFERS`). Routes, prérendu, SEO et sitemap suivent sans autre modification.
- Aucun guard, resolver ni lookup runtime : la page reçoit ses données par
  `withComponentInputBinding()`, typées à la compilation.
- Les données SEO ne sont plus écrites à la main dans `app.routes.ts` ; leurs invariants
  (longueur de description, absence d'em-dash, URL canonique) se testent sur toutes les offres.
- Renommer un slug publié exige une nouvelle redirection nginx : les redirections d'URL vivent
  dans le `Dockerfile`, hors du code Angular, et la CI (smoke test du job docker) doit les
  vérifier.
- `app.routes.ts` n'importe plus le contenu d'offre : le bundle initial ne porte que les
  résumés.

## Alternatives considered

- **Route paramétrée `offres/:slug` + `getPrerenderParams`.** Rejetée : il faut un guard
  `canMatch` pour qu'un slug inconnu tombe sur `**`, un resolver (ou un appel impératif au
  service `Seo`) pour des `data.seo` qui varient par slug, et une recherche du contenu par slug
  à l'exécution. Trois pièces runtime pour une liste connue à la compilation.
- **Une seule constante `OFFERS` avec le contenu complet.** Rejetée : le footer et la home
  feraient entrer les FAQ et déroulés des cinq offres dans le bundle initial.
- **Maintien de `/offre-site-industrie` avec un canonical vers la nouvelle URL.** Rejeté : deux
  pages prérendues pour un même contenu, un canonical est un indice et non une consigne pour les
  moteurs, et l'URL héritée continuerait d'être servie et partagée.
- **Redirection par route Angular prérendue.** Rejetée : le prérendu d'un `redirectTo` produit
  une page à `meta refresh` servie en 200, pas un 301.
- **Gateway in-memory comme `features/home`.** Rejetée pour les mêmes raisons que l'ADR-0004
  (abstraction à une implémentation, asynchronisme sans objet, contenu absent du HTML tant que
  le flux n'est pas résolu).
