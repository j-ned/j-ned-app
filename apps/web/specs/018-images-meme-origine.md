---
id: 018
title: Images uploadées servies depuis l'origine du site (front, PR 2/2)
type: perf
status: draft
created: 2026-10-10
related: [docs/adr/0015-images-du-corps-des-articles.md, docs/adr/0018-images-servies-depuis-l-origine-du-site.md, specs/014-refonte-blog.md, specs/016-editeur-articles.md]
---

# 018 — Images uploadées servies depuis l'origine du site

## Description

### Contexte

Les images uploadées (couvertures d'articles, visuels et galeries de projets, images du corps des
articles) sont servies par le proxy storage de l'API NestJS : `GET /api/storage/<bucket>/<clé>`.
L'API renvoie des **clés relatives** (`/storage/portfolio-storage/…`, vérifié en GET sur
`/api/blog/posts` et `/api/projects` le 2026-10-10) que le front préfixe par `API_BASE_URL`, soit
`https://api.nedellec-julien.fr/api` en production navigateur, au SSR et au prérendu
(`app.config.ts:176-184`), `/api` en développement (proxy CLI `proxy.conf.cjs`).

Conséquence en production : l'image LCP de `/blog` et `/projects` (première couverture,
`priority`) se télécharge depuis `api.nedellec-julien.fr`, une **seconde origine** qui coûte DNS +
TCP + TLS sur mobile. Le `<link rel="preconnect" href="https://api.nedellec-julien.fr" crossorigin>`
de `index.html:69` ne l'épargne pas : une image se charge en mode `no-cors`, elle ne réutilise pas
la connexion ouverte en mode CORS par un preconnect `crossorigin`. Levier relevé dans les mesures
prod du 2026-10-06 (« images même origine »).

### Décision (utilisateur, 2026-10-10) : architecture A

Le serveur nginx du site relaie `/api/storage/` vers l'API par le réseau Docker, avec un cache
disque (clé `$uri|$arg_variant`) : les images deviennent `https://nedellec-julien.fr/api/storage/…`.
Les appels XHR (`/api/blog/posts`, `/api/config`, analytics, likes, admin) **restent** sur
`api.nedellec-julien.fr` : seule la diffusion des images change d'origine.

- **PR 1/2 — #202** (`feat/nginx-storage-proxy`, Dockerfile) : `location ^~ /api/storage/` + cache.
  Ouverte, ni mergée ni déployée au 2026-10-10.
- **PR 2/2 — cette spec** : le front émet les URL d'images sur l'origine du site.

### Ce qui est attendu

1. Toute image uploadée affichée par le site (couvertures, visuels et galeries de projets, images du
   corps des articles, vignettes de l'admin) a pour `src` un **chemin relatif** `/api/storage/…`,
   au prérendu, au rendu client et en développement.
2. Le `<link rel="preload" as="image">` posé par `NgOptimizedImage` (`priority`) suit ce chemin.
3. Les URL consommées **hors du site** restent **absolues**, sur l'origine du site :
   `og:image`, `image` du JSON-LD (`https://nedellec-julien.fr/api/storage/…?variant=share`),
   `enclosure` du flux RSS, `src` des images du corps dans le `content:encoded` du RSS.
4. Une image insérée dans le corps d'un article depuis l'éditeur est stockée dans le Markdown sous la
   forme relative `/api/storage/…` (et non plus l'URL absolue `api.` d'ADR-0015 §4).
5. **Compatibilité de lecture** : une URL absolue `https://api.nedellec-julien.fr/api/storage/…`
   déjà présente dans un contenu (brouillon éventuel) continue de s'afficher, avec ses dimensions.
6. Aucune régression sur les appels API (XHR toujours vers `api.`).

### Contraintes

- **Ordre de merge** : cette PR se merge **après** le déploiement de #202 **et** la vérification en
  prod du relais (`curl -I https://nedellec-julien.fr/api/storage/<clé>.avif` → `200`,
  `image/avif`, `cache-control` immuable, `X-Cache-Status` `MISS` puis `HIT` ; même chose avec
  `?variant=share` → `image/jpeg`). Avant cela, toutes les images du site casseraient.
- Le prérendu fige l'URL dans le HTML : seul un redéploiement du front change les pages servies.

### Hors périmètre

- Déplacer les appels XHR en même origine (architecture B, écartée).
- Réécrire en base des URL absolues `api.` (aucune dans les articles publiés au 2026-10-10).
- Retirer `https://api.nedellec-julien.fr` de la CSP `img-src` (suivi, cf. Plan § Risques).

## Plan technique

> Décision structurante : **ADR-0018** (amende ADR-0015 §4). Profil lu ; validation runtime aux
> frontières non vérifiée (aucune lib côté front, adapters purs — inchangé ici).

### Constats vérifiés (2026-10-10)

- `src/app/app.config.ts:176-184` : `API_BASE_URL` absolu hors dev navigateur.
- Préfixage des images : `features/projects/infra/project.adapter.ts:5-7` (`resolveUrl`, appliqué
  `:16` galerie et `:27` visuel, base passée par `http-projects.gateway.ts:44,74,87,93`) ;
  `features/blog/infra/http-blog.gateway.ts:10-15` (`resolveApiUrl`/`resolvePost`, couverture,
  appliqué `:45,30,57`) et `:100` (`uploadContentImage` → URL insérée dans le Markdown).
- `shared/seo/share-image.ts:8-10` : `toShareImageUrl` suffixe `?variant=share` sans rendre
  l'URL absolue ; consommé par `blog-detail.ts:274` (og:image + JSON-LD `image`),
  `project-detail.ts:153`, `scripts/generate-rss.mjs:26,47-51`.
- `scripts/generate-rss.mjs:16,49` : enclosure préfixée par l'API ; `:61` HEAD pour `length`/`type` ;
  `content:encoded` = `parseMarkdown(contentMarkdown)` sans réécriture des `src`.
- `features/blog/infra/content-image-size.ts:3-4` : la regex accepte **déjà** `/api/storage/…`
  relatif et l'absolu `api.` (spec `content-image-size.spec.ts` le triangule) ⇒ **aucune
  modification**.
- `proxy.conf.cjs` : `'/api'` relaie tout sous-chemin, dont `/api/storage/` ⇒ le dev fonctionne déjà
  avec des `src` relatifs (c'était le cas en dev navigateur).
- Articles publiés (GET prod, 2 articles) : `contentMarkdown` sans aucune image ni URL `api.`.
  Brouillons non vérifiables (route admin) ⇒ compatibilité de lecture conservée.
- Pièges de fixtures : `http-projects.gateway.spec.ts:13` fixe `API_BASE_URL = '/api'`, valeur
  **identique** à la base cible ⇒ les attentes actuelles passeraient sans changement de code.
  `http-blog.gateway.spec.ts:13` utilise `https://api.test` (sain).
  `blog-post-builders.ts:23` (`makeContentImage`) porte l'URL absolue `api.`.

### Architecture

Couches touchées : `shared/api` (constante), `infra` (gateways projets et blog, adapter projets),
`shared/seo` (absolutisation de la carte de partage), `features/blog/infra/parse-markdown`
(option d'origine des images pour le RSS), `scripts/generate-rss.mjs`. Aucun composant, aucune page,
aucun store, aucun routage modifié : les vues consomment déjà `project.image`, `ProjectImage.src`,
`post.coverImage` tels quels.

```
API (clé /storage/…)
  └─ gateway infra ── préfixe STORAGE_BASE_PATH ('/api') ──► modèle domaine : '/api/storage/…'
        ├─ templates (ngSrc, preload priority) : relatif, même origine
        ├─ toShareImageUrl : relatif → SITE_IDENTITY.siteUrl + chemin + '?variant=share' (og, JSON-LD)
        └─ RSS (build) : enclosure = toShareImageUrl(relatif) ; HEAD sur l'API directe ;
                         content:encoded = parseMarkdown(md, { imageOrigin: siteUrl })
```

Décisions :

1. **Base des images = constante `STORAGE_BASE_PATH = '/api'`** dans `shared/api/api-config.ts`
   (à côté d'`API_BASE_URL`), pas un `InjectionToken` : la valeur est **identique dans tous les
   environnements** (prérendu, SSR, navigateur prod, dev), elle ne dépend d'aucune plateforme ; un
   jeton n'aurait aucun second fournisseur (YAGNI). Le préfixage reste dans les gateways infra (la
   forme du chemin de diffusion est un détail d'infra, jamais du domaine).
2. **Signatures inchangées** : `toProject(dto, base)` / `toProjectImage(dto, base)` gardent leur
   second paramètre, renommé `storageBase` ; `resolvePost(base, p)` idem. Seuls les sites d'appel
   passent `STORAGE_BASE_PATH` au lieu de `this.apiUrl`. Raison : l'adapter reste pur et paramétré,
   les specs d'adapter existantes compilent, et le RED se fait par assertion. Les deux résolveurs
   dupliqués (`resolveUrl`, `resolveApiUrl`, même logique « absolu `http` intact, sinon préfixe »)
   ne sont **pas** fusionnés ici : refactor hors périmètre, aucune divergence de comportement entre
   eux.
3. **`uploadContentImage`** (`http-blog.gateway.ts:100`) préfixe aussi par `STORAGE_BASE_PATH` :
   l'URL insérée dans le Markdown devient `/api/storage/portfolio-storage/blog-content/…`. Amende
   ADR-0015 §4 (cf. ADR-0018).
4. **og:image / JSON-LD : `toShareImageUrl` rend l'URL absolue.** Contrat : chaîne vide → vide ;
   chemin commençant par `/` → `SITE_IDENTITY.siteUrl + chemin + '?variant=share'` ; URL absolue
   (`http…`) → inchangée + `?variant=share` (compatibilité, et usage RSS côté API, décision 6).
   Import de `SITE_IDENTITY` en **chemin relatif** (`../identity/site-identity.static-data`) : le
   fichier est importé par `generate-rss.mjs` via `tsx`, garder un graphe d'import sans alias
   (comme `parse-markdown.ts`). Aucun site d'appel ne change (`blog-detail.ts:274`,
   `project-detail.ts:153`). `Seo` (`core/seo/seo.ts`) inchangé.
5. **Images du corps dans le RSS** : `parseMarkdown` reçoit une option `imageOrigin?: string`
   (défaut : aucune, rendu inchangé pour le site). Quand elle est fournie, le renderer `image`
   préfixe un `href` commençant par `/` (une seule barre, pas `//`) par cette origine **avant**
   l'appel à `Renderer.prototype.image` ; `contentImageSize` continue de lire les dimensions (la
   regex refuse l'hôte du site : la lecture des dimensions se fait donc sur le `href` **d'origine**,
   avant préfixage). `generate-rss.mjs` appelle `parseMarkdown(md, { imageOrigin: SITE_URL })`.
6. **Enclosure RSS** : URL publiée = `toShareImageUrl('/api' + coverImage)` (origine du site) ;
   métadonnées `length`/`type` lues par HEAD sur **l'API directe**
   (`toShareImageUrl(PROD_API_URL + coverImage)`). Raison : le build Docker du front ne doit pas
   dépendre du conteneur front **précédent** (rollback, environnement neuf) ; le relais transmet
   `Content-Type`/`Content-Length` de l'API à l'identique, les octets sont les mêmes. Le
   `fetchEnclosure` est découplé : il reçoit l'URL à sonder et l'URL à publier.
7. **`index.html`** :
   - **CSP `img-src`** : **garder** `https://api.nedellec-julien.fr` (compatibilité de lecture
     d'URL absolues `api.` éventuellement présentes dans des brouillons ou en cache de transfert ;
     coût nul). Retrait = suivi, après vérification admin qu'aucun contenu ne cite `api.`.
     `connect-src` inchangé (XHR).
   - **`preconnect … crossorigin` + `dns-prefetch` vers `api.`** : **garder**. Ils servent les XHR
     CORS lancés au démarrage sur toute page (`main.ts:26` `GET /api/config`, analytics) ; ils ne
     servaient déjà pas les images (mode `no-cors`). Mettre à jour le commentaire `index.html:68`
     pour dire qu'il ne concerne que les appels XHR. Aucun preconnect à ajouter pour les images
     (même origine).
   - Le `preload` d'image de `NgOptimizedImage` reprend le `ngSrc` tel quel : chemin relatif, même
     origine, sans `crossorigin` — conforme (une image `<img>` sans `crossorigin` doit être
     préchargée sans `crossorigin`, sinon double téléchargement). Le warning NG02956 « preconnect
     manquant » ne peut plus se déclencher pour ces images.
8. **Dev** : rien à changer (`proxy.conf.cjs` couvre `/api/storage/`). Voir Risques pour le rendu
   SSR de `pnpm start`.

### Fichiers à créer / modifier

| Fichier | Rôle |
|---|---|
| `src/app/shared/api/api-config.ts` | + `STORAGE_BASE_PATH = '/api'` (commentaire : clés API relatives à la racine `/api`, relayées par nginx #202 en prod, par `proxy.conf.cjs` en dev). |
| `src/app/features/projects/infra/project.adapter.ts` | Paramètre `apiUrl` → `storageBase` (renommage, logique inchangée). |
| `src/app/features/projects/infra/gateways/http-projects.gateway.ts` | Passe `STORAGE_BASE_PATH` à `toProject` (4 sites). `apiUrl` reste pour les URL de requête. |
| `src/app/features/blog/infra/http-blog.gateway.ts` | `resolvePost` et `uploadContentImage` préfixent par `STORAGE_BASE_PATH`. |
| `src/app/shared/seo/share-image.ts` | Absolutisation contre `SITE_IDENTITY.siteUrl` (import relatif) ; doc mise à jour. |
| `src/app/features/blog/infra/parse-markdown.ts` | Option `imageOrigin?: string` (renderer `image`). |
| `scripts/generate-rss.mjs` | Enclosure publiée en origine du site, HEAD sur l'API ; `content:encoded` avec `imageOrigin`. |
| `src/index.html` | Commentaire du preconnect (XHR seulement). CSP inchangée. |
| `src/app/features/blog/testing/blog-post-builders.ts` | `makeContentImage().url` → `/api/storage/portfolio-storage/blog-content/…` (forme désormais produite). |
| `docs/adr/0018-images-servies-depuis-l-origine-du-site.md` | Créé (amende ADR-0015 §4). |
| `docs/adr/0015-images-du-corps-des-articles.md` | Ligne de statut « §4 amendé par ADR-0018 ». |
| Specs (par `qa`) | `http-projects.gateway.spec.ts`, `project.adapter.spec.ts` (si besoin), `http-blog.gateway.spec.ts`, `share-image.spec.ts`, `parse-markdown.spec.ts`, éventuellement `blog-detail.spec.ts` / `project-detail.spec.ts` (og:image absolu). |

`content-image-size.ts`, `seo.ts`, `app.config.ts`, `main.ts`, `app.routes.server.ts`,
`generate-sitemap.mjs`, `proxy.conf.cjs` : **inchangés** (vérifié).

### Modèles de données

Aucun changement de type. `Project.image`, `ProjectImage.src`, `BlogPost.coverImage`,
`ContentImage.url` restent des `string` ; leur **contenu** devient un chemin relatif
`/api/storage/…`. Le contrat « relatif = même origine / absolu = consommé hors site » est porté par
`toShareImageUrl` et l'option `imageOrigin`, pas par un type (un branded type `SitePath` toucherait
toutes les vues pour un gain nul : la valeur vient de l'API, contrainte variable).

### Réactivité / état

Aucun changement : flux `rxResource`/`Observable` existants, aucun signal ajouté, aucun store ni
facade. Pas de gateway nouveau (frontière d'I/O inchangée).

### Cross-platform / bibliothèques

Sans objet (profil : aucune cible native). Aucune dépendance ajoutée.

### Tranches

- **Tranche 1 — la carte de partage est absolue sur l'origine du site** : `toShareImageUrl`
  absolutise un chemin relatif. Tests : `share-image.spec.ts` (`it.each` : relatif →
  `${SITE_IDENTITY.siteUrl}/api/storage/…?variant=share` ; absolu `api.` → inchangé + suffixe ;
  vide → vide). Autonome et sans effet visible avant T2/T3 (les entrées sont encore absolues) :
  elle prépare le terrain pour que T2/T3 ne cassent jamais l'og:image.
- **Tranche 2 — les images de projets sortent en même origine** : `STORAGE_BASE_PATH` +
  `HttpProjectsGateway`. Tests (`http-projects.gateway.spec.ts`) : avec un `API_BASE_URL`
  **absolu et distinct** (`https://api.test/api`), `image` et `gallery[].src` valent
  `/api/storage/…` ; une URL déjà absolue (`https://…`) reste intacte. Optionnel :
  `project-detail.spec.ts` vérifie que l'og:image est `https://nedellec-julien.fr/api/storage/…?variant=share`
  pour un projet dont l'image est relative (verticalité gateway → SEO via T1).
- **Tranche 3 — couvertures et images du corps du blog en même origine** : `HttpBlogGateway`
  (`resolvePost` + `uploadContentImage`), builder `makeContentImage`. Tests
  (`http-blog.gateway.spec.ts`, `BASE = 'https://api.test'` conservé) : `coverImage` d'une clé
  relative → `/api/storage/…` (liste publique, détail, liste admin) ; couverture absolue →
  intacte ; `uploadContentImage` renvoie `url` `/api/storage/portfolio-storage/blog-content/…`.
  Le rendu d'un corps contenant cette URL relative garde `width`/`height` (déjà couvert par
  `parse-markdown.spec.ts` via la regex : vérifier que le cas relatif `/api/storage/…` y figure,
  l'ajouter sinon).
- **Tranche 4 — le flux RSS publie des URL absolues** : option `imageOrigin` de `parseMarkdown`
  + `generate-rss.mjs`. Tests (`parse-markdown.spec.ts`) : avec `imageOrigin`, un `href`
  `/api/storage/…blog-content/<clé>-1600x900.avif` rend `src="https://nedellec-julien.fr/api/storage/…"`
  **et** `width="1600" height="900"` ; un `href` absolu reste intact ; un `href` `//hôte/…` n'est
  pas préfixé ; sans option, `src` reste relatif. Le script lui-même n'a pas de test unitaire :
  preuve par `pnpm rss:build` (cf. Preuves).

Le reste (`index.html`, ADR) n'a pas de comportement testable : livré avec T4, prouvé par le HTML
prérendu.

### Consignes pour `qa`

- **RED par assertion** : toutes les tranches se testent par des API existantes (`toShareImageUrl`,
  gateways via `HttpTestingController`, `parseMarkdown`). Pas d'import d'un module inexistant, pas
  de NG0201 (fournisseur manquant) comme RED. Exception assumée T4 : la clé `imageOrigin` dans le
  littéral d'options est refusée par le typecheck tant qu'elle n'existe pas (excess property) — si
  l'on veut un RED par assertion, passer les options via une variable typée large, sinon accepter ce
  RED de compilation en le nommant.
- **Pas de défaut piégé** : ne jamais tester la base des images avec `API_BASE_URL = '/api'`
  (valeur égale à `STORAGE_BASE_PATH` ⇒ faux vert). Fournir un `API_BASE_URL` absolu distinct dans
  les nouveaux tests ; laisser le fixture existant de `http-projects.gateway.spec.ts` tel quel ou le
  passer en absolu, au choix, mais l'assertion de T2 doit tourner contre une base absolue.
- **Attentes construites, pas recopiées** : pour l'og:image, bâtir l'attendu depuis
  `SITE_IDENTITY.siteUrl` plutôt qu'un littéral.
- **Jamais de U+202F / U+00A0 littéral** dans les specs (si un texte formaté apparaît, utiliser
  l'échappement `\u202f` / `\u00a0`).
- Lire `$?` après `pnpm test` (sortie 1 possible avec un rapport 100 % vert, rejets non gérés).

### Preuves attendues (avant de déclarer « done »)

1. Gates : `pnpm install --frozen-lockfile`, `pnpm test` (code de sortie 0), `pnpm lint`,
   `pnpm run build --configuration production` (sitemap + RSS + prerender).
2. **HTML prérendu** (`dist/angular-portfolio-app/browser/`) :
   - `blog/index.html` et `projects/index.html` : `<img … src="/api/storage/…">` (ou `srcset`
     relatif) et `<link rel="preload" as="image" href="/api/storage/…">` sans `crossorigin` ;
     `grep -c 'api.nedellec-julien.fr/api/storage'` = 0.
   - un article (`blog/<slug>/index.html`) et une fiche (`projects/<slug>/index.html`) :
     `og:image` = `https://nedellec-julien.fr/api/storage/…?variant=share`, idem `image` du
     JSON-LD de l'article.
   - `public/rss.xml` (artefact du build) : `enclosure url="https://nedellec-julien.fr/api/storage/…?variant=share"`
     avec `length`/`type` renseignés.
3. **Avant merge** : relais #202 vérifié en prod (cf. Contraintes), y compris `?variant=share`.
4. **Après déploiement** (prod) : `curl` des pages `/blog`, `/projects`, d'un article et d'une
   fiche (src, preload, og:image) ; `curl https://nedellec-julien.fr/rss.xml` (enclosure) ;
   onglet Réseau : l'image LCP vient de `nedellec-julien.fr`, `X-Cache-Status: HIT` au second
   chargement ; aucune connexion `api.` sur le chemin critique de l'image LCP.
5. **Lighthouse mobile** `/blog` et `/projects` : mesure **avant** (prod actuelle, 3 passes,
   médiane LCP) et **après** (prod déployée, mêmes conditions). Le « prod-like » local
   (`docker build` + `docker run`) ne relaie que si `STORAGE_UPSTREAM` atteint une API joignable
   en HTTP depuis le conteneur : il sert de smoke test, pas de mesure de référence.

### Risques & inconnues

- **Point de défaillance unique** : si le relais nginx tombe (upstream Dokploy renommé, réseau
  Docker), toutes les images du site cassent, alors qu'avant seule l'API était en jeu ; d'où la
  contrainte de merge après vérification prod, et `STORAGE_UPSTREAM` surchargeable (#202). Le cache
  nginx n'est pas un volume : froid à chaque redéploiement du front (premier hit par image vers
  l'API, sans impact fonctionnel). Les navigateurs des visiteurs récurrents re-téléchargent une fois
  chaque image (nouvelle URL).
- **Crawlers sociaux / RSS** : Facebook, LinkedIn, X gardent en cache l'ancienne og:image `api.`
  (toujours servie, aucun lien mort) ; l'enclosure RSS change d'URL, les agrégateurs peuvent
  re-télécharger la vignette. Le HEAD de build vise l'API directe : un écart de `Content-Length`
  entre API et relais est exclu tant que nginx ne recompresse pas (`gzip_types` du Dockerfile exclut
  `image/avif` et `image/jpeg`) — à recontrôler si `gzip_types` évolue.
- **Dev SSR (`pnpm start`)** : le rendu serveur lit les données de l'API **prod** puis émet
  `/api/storage/<clé prod>`, que le proxy CLI envoie à l'API **locale** : image absente en dev si
  le storage local ne contient pas la clé (avant, l'URL absolue `api.` s'affichait). Régression
  dev-only acceptée ; brouillons admin contenant d'anciennes URL `api.` : non vérifiables sans
  accès admin, couverts par la compatibilité de lecture et la CSP conservée (retrait `img-src api.`
  = suivi après contrôle).

## Plan de test

Les 4 tranches jouées en un seul RED (demande de la session principale). Commande :
`pnpm exec ng cache clean && rm -rf node_modules/.vite`, puis `pnpm test; echo exit=$?`
(`ng test`, typecheck des specs compris : vert, aucune erreur TS). Run complet le 2026-10-10 11:59 :
`Test Files 4 failed | 185 passed (189)`, `Tests 16 failed | 3178 passed (3194)`, `exit=1`.
Les 16 échecs sont tous des `AssertionError` (`toBe`/`toEqual` qui reçoivent l'ancienne forme
d'URL) ; aucun échec de harnais, aucun `NG0201`, aucun squelette de code applicatif.

Sweep du contrat d'URL d'image (grep `api.nedellec-julien.fr`, `api.test`, `/storage/`,
`variant=share`, `toShareImageUrl`, `makeContentImage` sur `src/` et `scripts/`) : seuls les trois
specs infra et `share-image.spec.ts` encodent la base des images. Les specs de composants
(`project-*`, `featured-*`, `home-projects`, `blog-detail`, `seo`) reçoivent des URL absolues en
entrée et restent valides (absolu ⇒ inchangé). `project.adapter.spec.ts` inchangé (signature et
logique conservées, base passée en paramètre). `content-image-size.spec.ts` inchangé (regex
inchangée).

### Tranche 1 — la carte de partage est absolue sur l'origine du site

Fichier : `src/app/shared/seo/share-image.spec.ts` (réécrit en `it.each`, attendus bâtis depuis
`SITE_IDENTITY.siteUrl`).

| Test | Scénario | Assertion clé |
|---|---|---|
| couverture servie par le site | `/api/storage/portfolio-storage/blog/1.avif` | `toBe(siteUrl + chemin + '?variant=share')` |
| capture de projet servie par le site | `/api/storage/…/project-images/img-1-ab12cd34.avif` | idem |
| adresse absolue de l'API | `https://api.test/api/storage/…` | inchangée + `?variant=share` (garde) |
| sans image | `''` | `''` (garde) |

RED confirmé via la commande test du profil le 2026-10-10 11:59, 2 failed / 4 total
(les 2 cas relatifs ; reçu `/api/storage/…?variant=share`). Gardes vertes par construction.

### Tranche 2 — les images de projets sortent en même origine

Fichier : `src/app/features/projects/infra/gateways/http-projects.gateway.spec.ts`. `BASE` passe de
`'/api'` à `'https://api.test/api'` (absolu, distinct de la base des images) ; les URL de requête
restent bâties sur `BASE`, les attendus d'image sont des littéraux `/api/storage/…`.

| Test | Scénario | Assertion clé |
|---|---|---|
| Adaptation `it.each` × 4 (mis à jour) | `getAllProjects`/`getProjectById`/`createProject`/`updateProject` répondent une couverture relative | `image` = `/api/storage/portfolio-storage/projects/uuid-1-fb6c30aa.avif` |
| couverture et captures stockées par l'API (nouveau) | liste avec `image` et `gallery[].url` relatifs, désordonnés | `image` et `gallery[].src` en `/api/storage/…`, ordre respecté |
| couverture et capture déjà absolues (nouveau) | `https://cdn.test/…` | inchangées (garde) |
| Galerie : upload, alt, réordonnancement (mis à jour) | `toProjectImage` sur les 3 sites | `src` = `/api/storage/portfolio-storage/project-images/<id>-ab12cd34.avif` |

RED confirmé via la commande test du profil le 2026-10-10 11:59, 8 failed / 9 total
(reçu `https://api.test/api/storage/…`). Les autres tests du fichier (URL de requête, cache,
toasts) restent verts avec la base absolue.

### Tranche 3 — couvertures et images du corps du blog en même origine

Fichiers : `src/app/features/blog/infra/http-blog.gateway.spec.ts` (`BASE = 'https://api.test'`
conservé), `src/app/features/blog/testing/blog-post-builders.ts` (`makeContentImage().url` →
`/api/storage/portfolio-storage/blog-content/…`).

| Test | Scénario | Assertion clé |
|---|---|---|
| `describe.each` lecteur × `it.each` couverture (remplace « getPublishedPosts résout… ») | liste publique, article, liste admin × clé relative / absolue / vide | relative → `/api/storage/portfolio-storage/blog/id-1-0a1b2c3d.avif` ; absolue et vide inchangées (gardes) |
| upload d'image du corps, adresse relative (mis à jour) | l'API répond `url: /storage/…/blog-content/<clé>` | `{ url: '/api/storage/portfolio-storage/blog-content/<clé>', width, height }` |
| upload, adresse absolue | `https://cdn.test/…` | inchangée (garde) |
| liste admin en échec puis relue (attendu recalé) | couverture `/storage/portfolio-storage/blog/a.avif` | `recovered: ['/api/storage/portfolio-storage/blog/a.avif']` |

Le cas relatif `/api/storage/…-800x1200.avif` figure déjà dans `parse-markdown.spec.ts`
(dimensions lues) : rien à ajouter. Les consommateurs de `makeContentImage`
(`admin-post-editor`, `admin-post-form`, `admin-markdown-toolbar`, `admin-content-image-upload`)
dérivent leurs attendus du builder et restent verts avec l'URL relative (dimensions toujours
lues par la regex).

RED confirmé via la commande test du profil le 2026-10-10 11:59, 5 failed / 12 total
(3 couvertures relatives, upload relatif, liste admin relue ; reçu `https://api.test/storage/…`).

### Tranche 4 — le flux RSS publie des URL absolues

Fichier : `src/app/features/blog/infra/parse-markdown.spec.ts`, bloc « avec l'origine des images
du flux RSS ». La clé `imageOrigin` n'existe pas encore : les options sont typées par un helper
`withImageOrigin` (intersection `NonNullable<Parameters<typeof parseMarkdown>[1]> & { imageOrigin }`).
Une simple variable ne suffit pas : le type d'options actuel est entièrement optionnel (« weak
type »), un objet sans propriété commune est refusé (TS2559) même hors littéral. Aucun squelette.

| Test | Scénario | Assertion clé |
|---|---|---|
| image servie par le site | `href` `/api/storage/…/blog-content/<clé>-1600x900.avif` | `src` = `siteUrl + href`, `width="1600" height="900"` |
| image absolue de l'API | `href` absolu `api.` | inchangé, dimensions lues (garde) |
| image d'un autre hôte | `https://example.com/schema.png` | inchangé, sans dimensions (garde) |
| image en `//hôte` | `//cdn.test/schema.png` | non préfixée (garde) |
| rendu du site après un rendu RSS | `parseMarkdown` sans option après un appel avec | `src` relatif (l'option ne fuit pas d'un appel à l'autre ; garde) |

RED confirmé via la commande test du profil le 2026-10-10 11:59, 1 failed / 5 total
(reçu `src` relatif). `scripts/generate-rss.mjs` : sans test unitaire, preuve par
`pnpm rss:build` (Preuves attendues).

## Journal des tranches

- **Tranche 1 — la carte de partage est absolue sur l'origine du site** : GREEN 4 passed / 4 total (`share-image.spec.ts`) · refactor : aucun
- **Tranche 2 — les images de projets sortent en même origine** : GREEN 9 passed / 9 total (`http-projects.gateway.spec.ts`) ; `STORAGE_BASE_PATH` passé aux 7 sites (4 `toProject` + 3 `toProjectImage`, le plan n'en listait que 4) · refactor : aucun
- **Tranche 3 — couvertures et images du corps du blog en même origine** : GREEN 12 passed / 12 total (`http-blog.gateway.spec.ts`) · refactor : `resolveApiUrl` renommé `resolveStorageUrl` (il ne préfixe plus par l'API)
- **Tranche 4 — le flux RSS publie des URL absolues** : GREEN 3194 passed / 3194 total (suite complète, `exit=0`) ; `generate-rss.mjs` (enclosure publiée sur l'origine du site, HEAD sur l'API directe, `content:encoded` avec `imageOrigin`), commentaire du preconnect d'`index.html` · refactor : aucun (le test « chemin du site, pas `//` » existe dans `share-image.ts` et `parse-markdown.ts` ; une expression d'une ligne dans deux couches qui ne partagent pas de module, laissée inline)

## Verify

Build de production (`pnpm run build --configuration production`, exit 0 : sitemap 20 URL, RSS 2 items,
20 routes prérendues) servi en statique par un serveur Node local (port 4321) : `/api/storage/*` relayé
vers `https://api.nedellec-julien.fr` en GET/HEAD seulement (405 sinon), tout autre `/api/*` répondu 403,
et `connect-src` de la CSP réécrit en `'self'` dans le HTML servi pour qu'aucun XHR (dont le POST
analytics) n'atteigne l'API prod. `img-src` laissé tel quel (`api.` autorisé) : une image qui partirait
encore vers `api.` serait visible, pas masquée.

Steps :

1. Ouvrir `http://localhost:4321/blog`, faire défiler jusqu'à la seconde couverture (lazy).
2. Ouvrir `http://localhost:4321/projects`, forcer le chargement des 6 visuels.
3. Lire `performance.getEntriesByType('resource')`, l'onglet réseau filtré sur `api.nedellec-julien.fr`,
   la console et le journal du serveur.

Résultat : **PASS**.

- `/blog` : 2/2 images décodées (`naturalWidth > 0`), `src` = `/api/storage/portfolio-storage/blog/…avif`.
- `/projects` : 6/6 images décodées, `src` = `/api/storage/portfolio-storage/projects/…avif`.
- Journal serveur : 9 `RELAY GET /api/storage/… 200 image/avif`, aucun autre verbe ; seul `GET /api/config`
  intercepté (403).
- Requêtes vers `api.nedellec-julien.fr` : **0** (ressources et onglet réseau).
- Console : aucun `NG0`. Seules erreurs, attendues et dues au harnais : le 403 de `/api/config` et le
  blocage CSP du POST `analytics/track`.
- Captures : `/blog` (couvertures affichées) et `/projects` (visuel DashFlow affiché), prises dans le
  panneau navigateur de la session.

HTML prérendu (`dist/angular-portfolio-app/browser/`) :

- `blog/index.html`, `projects/index.html` : `src` des `<img>` et `<link rel="preload" as="image">` en
  `/api/storage/…` relatif, sans `crossorigin` ; `grep -c 'api.nedellec-julien.fr/api/storage'` = 0.
- `blog/de-20-ans-de-metallurgie-a-developpeur-full-stack/index.html` : `og:image` et `image` du JSON-LD =
  `https://nedellec-julien.fr/api/storage/portfolio-storage/blog/bdaa8984-…-fff422df.avif?variant=share`.
- `projects/dashflow/index.html` : `og:image` = `https://nedellec-julien.fr/api/storage/portfolio-storage/projects/81239d51-…-610d59b4.avif?variant=share`
  (le JSON-LD `CreativeWork` d'une fiche projet n'a pas de champ `image`, inchangé). Les `/storage/…` du
  script `ng-state` sont les DTO bruts du cache de transfert, re-mappés par le gateway à l'hydratation.
- `grep -rl 'api.nedellec-julien.fr/api/storage'` sur tout `browser/` : aucun fichier.
- `public/rss.xml` : 2 `enclosure url="https://nedellec-julien.fr/api/storage/portfolio-storage/blog/…avif?variant=share"`,
  `length="110162"` / `"81601"`, `type="image/jpeg"` ; 0 occurrence de `api.nedellec-julien.fr`.

## Review code

**Verdict** : REJECTED
**Gates CI locaux** : tests ✅ (`pnpm exec ng cache clean && rm -rf node_modules/.vite` puis `pnpm test`, exit 0, 189 fichiers / 3194 tests) / lint ✅ (`pnpm lint`, exit 0, « All files pass linting ») / build ✅ (`pnpm run build --configuration production`, exit 0 : sitemap 20 URL, RSS 2 items, 20 routes prérendues, CSP 21 pages) ; `pnpm install --frozen-lockfile` exit 0 ; `pnpm run format:check` exit 0 (+ `prettier --check scripts/generate-rss.mjs` exit 0, hors périmètre du script `format:check`)
**Checks mécaniques** : checker non vendoré : auto-checks joués à la main (grep sur les lignes ajoutées : 0 `fakeAsync`/`export default`/`effect(`/`any`/snapshot/`.only`/`console.` ; 1 `innerHTML` en spec, même helper que `imageOf` existant ; motif d'archéologie : 1 hit, ligne de statut de l'ADR-0015, document et non commentaire de code, levé ; 0 U+202F/U+00A0 dans les lignes ajoutées)
**Warnings de gate** : aucun (sortie test, lint et build lues en entier : aucun warning ni diagnostic)
**Rendu compilé** : N/A
**Preuve de verify runtime** : ✅ (preuve `## Verify` complète et cohérente avec le diff, rejouée par la revue : build servi sur un port local, `/api/storage/` relayé en GET/HEAD vers la prod, tout autre `/api/*` en 403, `connect-src 'self'` réécrit ; `/blog` 2/2, `/projects` 6/6, `/projects/dashflow` 6/6 (couverture + 5 captures de galerie, après hydratation), article 1/1, toutes servies par l'origine locale ; 0 ressource vers `api.nedellec-julien.fr` ; og:image et `image` JSON-LD absolus sur `https://nedellec-julien.fr` dans le DOM hydraté ; relais : 18 GET, aucun autre verbe vers la prod ; console : seuls le 403 de `/api/config` et le blocage CSP d'`analytics/track`, dus au harnais, aucun `NG0` ; capture `/projects` mobile 375×812 avec le visuel DashFlow affiché. Panneau masqué ⇒ viewport nul, le lazy-loading a été forcé (`loading='eager'`) pour charger les images sous la ligne de flottaison)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ❌ (politique commentaires, point 2)
**Cross-platform** : ✅
**Tests** : ❌ (point 1)
**Sécurité** : ✅
**Alignement spec** : ✅

Contrôle du `dist/` (`dist/angular-portfolio-app/browser/`) : `grep -rl 'api.nedellec-julien.fr/api/storage'` = aucun fichier ; les seules occurrences d'`api.` sont la CSP (`img-src` conservée, `connect-src`), le preconnect/dns-prefetch, les clés XHR du cache de transfert et la base XHR du bundle. `blog/index.html` et `projects/index.html` : `<img src="/api/storage/…">` et `<link rel="preload" as="image" href="/api/storage/…">` sans `crossorigin`. og:image absolue sur les 2 articles et les 6 fiches, `image` JSON-LD absolue sur les 2 articles. `public/rss.xml` : 2 `enclosure url="https://nedellec-julien.fr/api/storage/…?variant=share"` avec `length` (110162, 81601) et `type="image/jpeg"`, 0 `api.`. Gateway projets : `STORAGE_BASE_PATH` aux 7 sites ; `uploadContentImage` relatif ; `parseMarkdown` lit les dimensions sur le `href` d'origine et remet `imageOrigin` à `null` à chaque appel (testé). Compatibilité `api.` : URL absolues laissées intactes par les deux résolveurs (testé), dimensions lues (testé), `img-src` conservée. Tests de `qa` inchangés par la phase GREEN.

**Tests notables** :
- ⚠️ `src/app/features/blog/infra/parse-markdown.spec.ts:347-352` : le helper `withImageOrigin` (intersection `NonNullable<Parameters<…>[1]> & { imageOrigin }`) ne servait qu'à contourner le typecheck en RED. L'option existe : `parseMarkdown(md, { imageOrigin: SITE_IDENTITY.siteUrl })` suffit.
- ⚠️ `src/app/features/projects/infra/gateways/http-projects.gateway.spec.ts:227-246,269-279` : DTO de galerie écrits en littéraux, alors que le même fichier a déjà `imageDto()` (l. 430, limité au `describe` Galerie). Ce sont des DTO et non des modèles de domaine, et aucun builder du glossaire n'existe pour eux ⇒ non bloquant. Le remonter d'un niveau éviterait la duplication.
- ✨ `http-blog.gateway.spec.ts:52-105` : un `describe.each` sur les 3 lecteurs croisé avec un `it.each` sur relatif, absolu et vide. Tourne contre une base absolue distincte, donc le faux vert `'/api'` est exclu.

**Duplication / dérivation** (advisory) :
- ⚠️ `src/app/shared/seo/share-image.ts:14` et `src/app/features/blog/infra/parse-markdown.ts:73` : même test `startsWith('/') && !startsWith('//')` à 2 sites. Déjà assumé dans le journal (couches sans module commun). Sous le seuil de blocage.
- ⚠️ `scripts/generate-rss.mjs:55` : `/api` écrit en dur, copie de `STORAGE_BASE_PATH`. Importer `api-config.ts` tirerait `@angular/core` dans `tsx`, la copie se défend, mais rien n'alerte si la constante change.

**Risque résiduel** (advisory, § 8) :
- réversibilité et monitoring : profil absent, non renseignés (Sentry présent côté app, sans seuil déclaré).
- Aucun état persistant touché. Seul le Markdown des **nouvelles** images insérées passe en relatif : un revert du front laisserait ces chemins relatifs servis par le relais tant que #202 reste en place. Si #202 est retiré, ces images cassent.
- **Dev (`pnpm start`)** : le SSR lit l'API prod (branche serveur d'`API_BASE_URL`) puis émet `/api/storage/<clé prod>`, que `proxy.conf.cjs` envoie à `localhost:3000`. La clé de cache de transfert diffère entre serveur (`https://api…/api/blog/posts`) et client (`/api/blog/posts`), donc le client refait la requête vers l'API locale après hydratation (déduit du code, non exécuté). Conséquences : sans API locale (cas constaté ici, `:3000` ne répond pas), les images du HTML SSR et le preload LCP partent en erreur proxy, alors qu'elles s'affichaient avant. Avec une API locale, on voit un flash d'images cassées avant l'hydratation. Régression dev-only, mais **à documenter** en une ligne là où le développeur la rencontre : un commentaire dans `proxy.conf.cjs` ou une note dans la section Commandes. Le Risque de la spec et l'ADR-0018 la mentionnent, mais aucun développeur ne les lit au lancement.
- Non couvert par les gates : le relais nginx en prod (vérifié hors PR), l'équivalence `Content-Length` API/relais (dépend de `gzip_types`).

**Points à corriger** :
1. `src/app/shared/seo/share-image.ts:14` : la garde `!imageUrl.startsWith('//')` est du comportement ajouté en GREEN qu'aucun test n'épingle. `share-image.spec.ts` n'a pas de cas `//hôte`, et les autres consommateurs passent des URL `https://`. Supprimer cette condition laisse la suite verte, alors que le brief en fait un contrat (« `//hôte` inchangé »). Ajouter à l'`it.each` de `src/app/shared/seo/share-image.spec.ts:7-27` un cas `{ image: '//cdn.test/blog/1.avif', expected: '//cdn.test/blog/1.avif?variant=share' }`. C'est un ajout de cas, pas une valeur attendue modifiée. Le pendant `parse-markdown` est déjà couvert (l. 382-386).
2. Politique commentaires du profil (« une ligne de WHY intemporel, ou rien ») : 4 commentaires ajoutés ou réécrits par le diff dépassent une ligne. `src/app/shared/api/api-config.ts:10-11` (2 l.), `src/app/shared/seo/share-image.ts:10-11` (2 l.), `src/app/features/blog/infra/parse-markdown.ts:69-70` (2 l., la version précédente tenait en 1), `scripts/generate-rss.mjs:44-47` (4 l.). Ramener chacun à une ligne de WHY. Exemple pour `share-image.ts` : « Un crawler ne résout pas un chemin relatif ; `//hôte` vise déjà un autre hôte. » Ou supprimer la ligne si le code se suffit à lui-même.

Correction des 2 points de la revue (session principale, 2026-10-10) : cas `//cdn.test/…` ajouté à l'`it.each` de `share-image.spec.ts` (mutant sans la garde `//` → 1 failed / 3195, exit 1, fichier restauré) ; les 4 commentaires réduits à une ligne de WHY ; risque dev documenté en tête de `proxy.conf.cjs`. Suite réelle 3195/3195 exit 0, lint et format exit 0.
