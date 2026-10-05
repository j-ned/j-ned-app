# ADR-0007 — Images statiques de `public/` : nom versionné, `<picture>` AVIF/WebP autour de `NgOptimizedImage`

- **Statut** : accepté (2026-10-05, avec la Tranche 1 de la spec 010)
- **Date** : 2026-10-05
- **Contexte spec** : `specs/010-demos-offres.md`
- **Prolonge** : ADR-0006 (version dans le nom des polices de `public/fonts/`)

## Context

La spec 010 ajoute les premières images éditoriales auto-hébergées du site : trois visuels de
sites de démonstration, chacun en AVIF et WebP, en 800 et 1 600 px de large (ratio 16:10).
Jusqu'ici, les images de contenu venaient de l'API (projets, articles) ; `public/` ne contenait
que l'avatar, le favicon et les icônes de stack.

Faits vérifiés :

- **Cache nginx** (`Dockerfile`, `location ~* \.(…|webp|avif|…)$`) :
  `Cache-Control: public, max-age=31536000, immutable` sur toute image, y compris celles de
  `public/`, que le build copie **sans hacher leur nom**. Vérifié en production le 2026-10-05 :
  `curl -I https://nedellec-julien.fr/avatar.avif` renvoie `content-type: image/avif` et ce
  `cache-control`. Un fichier remplacé sous le même nom reste périmé un an chez tout visiteur
  qui l'a déjà chargé.
- **Pas d'`IMAGE_LOADER`** dans `app.config.ts`. Sans loader, `NgOptimizedImage` (Angular
  22.2.1, `@angular/common/fesm2022/common.mjs`) ne génère aucun `srcset` automatique
  (`shouldGenerateAutomaticSrcset()` exige `imageLoader !== noopImageLoader`) et signale
  `ngSrcset` par l'avertissement NG02963 (« the same image being used for all configured
  sizes »).
- **`<picture>` n'est pas géré par la directive.** La FAQ du guide officiel
  (https://angular.dev/guide/image-optimization, « Does NgOptimizedImage support the
  `<picture>` tag? ») répond : « No, but this is on our roadmap, so stay tuned. » La directive
  s'applique à l'élément `<img>` seul ; elle ignore les `<source>` voisins, sans les interdire.
- **Les contrôles de développement de la directive lisent la ressource réellement chargée**
  (`assertNoImageDistortion` : `img.naturalWidth`, `naturalHeight`), donc la variante choisie
  par `<source>` : ratio et surdimensionnement (NG02952, NG02960) restent vérifiés.
- **CSP** : `img-src 'self'` couvre `public/`.

## Decision

1. **Toute image statique de `public/` référencée par un chemin écrit dans le code porte une
   version dans son nom**, comme les polices (ADR-0006). Pour un visuel produit par capture ou
   export, la version est la **date de production** `AAAAMMJJ` :
   `public/demos/<slug>-<AAAAMMJJ>-<largeur>.<avif|webp>`. Tout changement de binaire (nouvelle
   capture, recadrage, réencodage) **change le nom** ; deux productions le même jour prennent un
   suffixe `-2`. L'ancien fichier est supprimé dans la même PR (aucune page prérendue ne le
   référence plus après le build).
2. **Formats et tailles par `<picture>` natif, `NgOptimizedImage` sur l'`<img>` de repli.**

   ```html
   <picture>
     <source type="image/avif" [attr.srcset]="avifSrcset" [attr.sizes]="SIZES" />
     <source type="image/webp" [attr.srcset]="webpSrcset" [attr.sizes]="SIZES" />
     <img
       [ngSrc]="fallbackSrc"
       width="1600"
       height="1000"
       [alt]="alt"
       class="block h-auto w-full"
     />
   </picture>
   ```

   - `srcset` et `sizes` sont liés en **attributs** (`[attr.…]`), pas en propriétés : les attributs
     sortent ainsi tels quels dans le HTML prérendu, et le navigateur peut choisir la variante avant
     l'hydratation.

   - Les `<source>` portent les descripteurs de largeur (`800w`, `1600w`) et `sizes` : le
     navigateur choisit format et résolution. Aucun `ngSrcset`, aucun `sizes` sur l'`<img>`
     (inutile quand une `<source>` correspond, et la directive préfixerait `auto,`).
   - L'`<img>` garde ce que la directive apporte : `width`/`height` (ratio réservé, pas de CLS),
     `loading="lazy"` et `fetchpriority="auto"` par défaut, contrôles NG029xx en développement.
     `width`/`height` = dimensions intrinsèques du fichier de `ngSrc`.
   - `priority` reste possible sur l'`<img>` d'une image LCP, mais son `<link rel="preload">`
     viserait le fichier de repli, pas la variante AVIF : une image LCP en `<picture>` exige une
     décision à part (hors périmètre de cet ADR).

3. **Pas d'`IMAGE_LOADER`, ni global ni local**, tant que les images servies ne viennent pas
   d'un CDN capable de redimensionner.

## Consequences

- Une mise à jour d'image = de nouveaux fichiers, de nouveaux chemins dans les données, la
  suppression des anciens. Un chemin périmé produit une image cassée : la CI vérifie que chaque
  chemin `/demos/` cité dans le HTML prérendu des pages d'offre listées dans `ci.yml` existe dans
  `dist/…/browser/` (même garde que celle des préchargements de police). Une nouvelle famille
  d'images versionnées étend cette garde.
- Le jour où la directive gère `<picture>`, la migration est locale au composant qui porte le
  `<picture>`.
- L'avatar (`avatar.avif`, `avatar.png`), le favicon et les icônes de `public/icons/` existent
  déjà sans version : ils restent tels quels (hors périmètre), mais leur remplacement futur doit
  suivre la décision 1, sinon il restera invisible un an pour les visiteurs déjà venus.

## Alternatives considered

- **AVIF seul en `ngSrc`, sans repli** (précédent : `avatar.avif`). Rejeté : la spec exige le
  repli WebP, et sans `srcset` le téléphone télécharge la variante 1 600 px.
- **`IMAGE_LOADER` fourni au niveau du composant** (loader qui réécrit `<src>-<largeur>`) pour
  obtenir `ngSrcset`. Rejeté : ne règle pas le format (il faut quand même `<picture>`), et une
  convention de loader maison pour trois images est de l'indirection sans gain.
- **`IMAGE_LOADER` global.** Rejeté : il réécrirait aussi les URL des images de l'API, qui ne
  suivent pas cette convention.
- **Cache nginx court (ou `no-cache` + ETag) sur `public/demos/`.** Rejeté : revalidation à
  chaque visite pour un contenu qui change quelques fois par an ; le nom versionné garde le
  cache d'un an sans risque de fichier périmé.
- **Faire hacher les images par le build** (référence depuis la CSS). Rejeté : `public/` est
  copié tel quel, et seul un `url()` CSS fait hacher un fichier ; les visuels sont du contenu de
  template, pas de la décoration CSS.
- **`<img src>` natif dans un `<picture>`, sans la directive.** Rejeté : la règle du repo
  impose `NgOptimizedImage` sur toute `<img>`, et on perdrait ses contrôles de ratio et de
  surdimensionnement.
