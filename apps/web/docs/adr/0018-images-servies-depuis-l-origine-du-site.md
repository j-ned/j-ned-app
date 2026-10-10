# ADR-0018 — Images uploadées servies depuis l'origine du site

- **Statut** : proposé (2026-10-10)
- **Date** : 2026-10-10
- **Contexte spec** : `specs/018-images-meme-origine.md`
- **Amende** : ADR-0015 §4 (le Markdown stockait l'URL absolue `api.`)
- **PR liées** : #202 (relais nginx, 1/2), PR front de la spec 018 (2/2)

## Context

Les images uploadées sont servies par le proxy storage de l'API (`/api/storage/<bucket>/<clé>`).
L'API renvoie des clés relatives (`/storage/…`) que le front préfixait par `API_BASE_URL`
(`https://api.nedellec-julien.fr/api` en production, au SSR et au prérendu). L'image LCP de `/blog`
et `/projects` venait donc d'une seconde origine : DNS + TCP + TLS de plus sur mobile. Le
`preconnect … crossorigin` vers `api.` ne l'évite pas, une image se chargeant en `no-cors` sur une
autre connexion.

L'utilisateur a retenu le 2026-10-10 l'architecture A : nginx du site relaie `/api/storage/` vers
l'API par le réseau Docker, avec cache disque (#202). Les XHR restent sur `api.`.

## Decision

1. Le front émet toute image uploadée sous forme de **chemin relatif** `/api/storage/…` : constante
   `STORAGE_BASE_PATH = '/api'` (`shared/api/api-config.ts`), appliquée dans les gateways infra.
   Même valeur au prérendu, au SSR, en production (relais nginx) et en dev (`proxy.conf.cjs`) :
   pas d'`InjectionToken`.
2. Les URL consommées **hors du site** sont absolues sur l'origine du site
   (`SITE_IDENTITY.siteUrl`) : `toShareImageUrl` (og:image, JSON-LD, enclosure RSS) et l'option
   `imageOrigin` de `parseMarkdown` (images du corps dans le `content:encoded` du RSS).
3. **ADR-0015 §4 amendé** : une image insérée dans le corps d'un article est stockée dans le
   Markdown en relatif (`/api/storage/portfolio-storage/blog-content/…`). Le flux RSS absolutise au
   build ; le site la sert depuis son origine.
4. **Compatibilité de lecture** : les URL absolues `api.` déjà stockées restent valides (regex de
   dimensions, CSP `img-src` conservée). Aucune réécriture en base (aucune dans les articles
   publiés au 2026-10-10).
5. Le build RSS lit `length`/`type` de l'enclosure sur l'API directe, pour ne pas dépendre du
   conteneur front précédent ; l'URL publiée est celle du site.

## Consequences

- Plus de connexion vers `api.` sur le chemin critique de l'image LCP ; le preconnect `api.` ne sert
  plus qu'aux XHR (`/api/config`, analytics).
- Le relais nginx devient un point de passage obligé des images : un upstream mal nommé casse toutes
  les images. Merge du front seulement après vérification du relais en prod.
- Les caches navigateur et le cache des crawlers sociaux repartent sur de nouvelles URL (une fois).
- Un changement d'hôte de l'API n'impose plus de réécrire le Markdown des articles (le risque cité
  par ADR-0015 disparaît pour les contenus relatifs).
- En dev, le SSR (données prod) émet des chemins que le proxy CLI envoie à l'API locale : images
  prod absentes en dev SSR.

## Alternatives considered

- **Architecture B — toute l'API en même origine** : supprime aussi la connexion XHR, mais déplace
  CORS, cookies, en-têtes de sécurité et limites de débit ; périmètre bien plus large, écartée.
- **URL absolue `https://nedellec-julien.fr/api/storage/…` partout** : lisible hors site, mais
  casse le dev (pointe la prod au lieu du storage local) et fige l'hôte dans le Markdown.
- **`InjectionToken` `STORAGE_BASE_URL`** : aucun second fournisseur réel, la valeur ne varie pas
  par plateforme (YAGNI).
- **Preconnect `api.` sans `crossorigin`** pour les images : garde un DNS+TCP+TLS parallèle, gain
  inférieur à la même origine, et un second preconnect pour les XHR.
