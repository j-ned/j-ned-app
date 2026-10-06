---
id: 010
title: Montrer les sites de démonstration sur les pages d'offre Sites (site vitrine, site atelier)
type: feat
status: draft
created: 2026-10-05
related: [specs/009-plateforme-acquisition.md, specs/009-copy-offres.md, PRODUCT.md, DESIGN.md, docs/adr/0004-contenu-statique-de-feature-sans-gateway.md, docs/adr/0007-images-statiques-versionnees-et-picture.md]
---

# 010 — Les démos sur les pages d'offre

## Description

### Contexte

Les offres de la famille Sites (`/offres/site-vitrine`, 890 €, et `/offres/site-atelier`, 690 €)
décrivent le résultat livré, mais ne le montrent pas. Le prospect visé (gérant de TPE, artisan,
responsable d'atelier, peu technique, sur téléphone) juge sur pièce : voir à quoi ressemblera son
site rassure plus qu'une liste de livrables.

Julien a construit trois sites de démonstration, hébergés hors de ce dépôt :

| Démo | URL | Entreprise fictive | Offre illustrée |
|---|---|---|---|
| Coaching Life | https://coaching-life.nedellec-julien.fr/ | coach de vie, coaching équin, accompagnement parental | site vitrine |
| Le Vieux Comptoir | https://vieux-comptoir.nedellec-julien.fr/ | brasserie parisienne | site vitrine |
| Delaunay Précision (`site-industrie`) | https://site-industrie.nedellec-julien.fr/ | atelier d'usinage CN à Élancourt | site atelier |

Ce sont des **démonstrations** : aucune n'est un client. Décision déjà actée en spec 009 pour Le
Vieux Comptoir (« une démo, jamais une référence client »), étendue ici aux trois.

Des visuels prêts à l'emploi existent (capture ordinateur dans une fenêtre de navigateur, capture
mobile superposée dans un téléphone, fond assorti à la démo), produits le 2026-10-05 depuis les
sites en ligne : AVIF et WebP en 1 600 et 800 px de large, 13 à 47 Ko en AVIF, ratio 16:10.

### Ce qui est attendu

#### 1. Une section « Exemples » sur les deux pages d'offre Sites

- `/offres/site-vitrine` montre Coaching Life et Le Vieux Comptoir ; `/offres/site-atelier` montre
  Delaunay Précision. Les trois autres offres (application métier, refonte et maintenance, renfort
  freelance) n'ont pas de section Exemples.
- Placement : après « Ce que contient le site » (livrables) et avant le déroulé, là où le prospect
  se demande « à quoi ça ressemblera ». L'architecte confirme ou justifie un autre emplacement.
- Pour chaque démo :
  - le visuel (capture ordinateur + mobile), avec un `alt` qui décrit ce qu'on voit, pas « capture
    d'écran » ;
  - le nom de l'entreprise fictive et son secteur en une ligne (ex. « Brasserie parisienne ») ;
  - ce que la démo illustre, en une phrase concrète, liée à l'offre (ex. pour l'atelier : parc
    machines, certifications, demande de devis) ;
  - un **badge « Démo »** visible et lisible, en plus du texte ;
  - un lien « Voir la démo » vers le site, ouvert dans un nouvel onglet, avec un nom accessible qui
    nomme la démo et signale le nouvel onglet ; `rel="noopener"`.
- Une phrase d'en-tête de section, honnête et sans ambiguïté, du type : « Des sites de
  démonstration, construits pour montrer le résultat. Les entreprises sont fictives. » La copie
  finale est validée par Julien (cf. Questions ouvertes).

#### 2. Honnêteté : une démo ne passe jamais pour une référence client

- Aucune démo sur la home. Dans `/projects` (Réalisations), une démo n'apparaît qu'avec le tampon
  « Démo » (amendement du 2026-10-06, spec 011, ADR-0008 §7). Aucune démo dans les données
  structurées comme `review`, `testimonial` ou portfolio client.
- Aucun chiffre, avis ou logo inventé autour des démos.
- La copie du site qui oppose « des démos » à « des systèmes qui tournent »
  (`profile.static-data.ts`, page Parcours) reste vraie : elle parle des applications. L'architecte
  vérifie qu'aucune phrase du site ne devient contradictoire avec la section Exemples.

#### 3. Performance et sobriété

- Visuels auto-hébergés dans le dépôt (`public/`), servis en AVIF avec repli WebP, via
  `NgOptimizedImage` (dimensions intrinsèques, `sizes` adapté, chargement différé : la section est
  sous la ligne de flottaison, jamais `priority`).
- Pas d'iframe, pas de script tiers, aucun appel réseau vers les sites de démo au chargement.
- Aucune régression mesurable du LCP et du CLS des deux pages d'offre (mesure Lighthouse avant
  et après, comme pour les PR perf).

#### 4. Contenu en données de domaine

- Les démos sont du contenu statique de la feature `offer`, au même titre que `OFFER_PAGES`
  (ADR-0004) : pas de gateway, pas d'appel API.
- Le prérendu et le SEO des pages d'offre restent intacts. La section est dans le HTML servi.

### Hors périmètre

- Les sites de démo eux-mêmes (autres dépôts) : bandeau « Site de démonstration » et `noindex` à
  poser sur Coaching Life et Le Vieux Comptoir, photo de remplacement du hero de site-industrie.
  Suivi séparé, voir Prérequis.
- Une page ou une section « Démos » dans Réalisations.
- La génération automatique des captures (script de capture conservé hors dépôt, ou ajouté plus
  tard si besoin).

### Prérequis (hors de ce dépôt, à faire avant la mise en ligne)

- **Coaching Life** est aujourd'hui indexable (`<meta name="robots" content="index, follow">`) et
  parle de coaching « certifié » sans mention de démonstration. **Le Vieux Comptoir** n'a ni
  balise robots ni mention. Les deux doivent recevoir `noindex` et un bandeau « Site de
  démonstration », comme site-industrie, avant que les pages d'offre ne les mettent en avant :
  sinon, Google peut les présenter comme de vraies entreprises.
- **site-industrie** : le hero affiche un emplacement gris « Photo du client, 1600 × 1200 ». Une
  photo d'atelier libre de droits rendrait le visuel crédible. Les captures sont à refaire après ce
  changement.

### Critères d'acceptation

1. `/offres/site-vitrine` affiche une section Exemples avec Coaching Life et Le Vieux Comptoir ;
   `/offres/site-atelier` avec Delaunay Précision ; les trois autres pages d'offre n'en ont pas.
2. Chaque démo affiche son visuel, son nom fictif, son secteur, ce qu'elle illustre, un badge
   « Démo » et un lien « Voir la démo » qui ouvre le bon site dans un nouvel onglet.
3. L'en-tête de section dit explicitement que les entreprises sont fictives.
4. Les visuels sont servis depuis `public/` en AVIF (repli WebP), en chargement différé, avec
   `width`/`height` intrinsèques et un `alt` descriptif. Aucun `priority`.
5. La section est présente dans le HTML prérendu des deux pages. Un seul `<h1>`, hiérarchie de
   titres sans saut, zéro violation axe, cibles tactiles ≥ 44 px.
6. Aucun visuel ni nom de démo sur la home ni dans les données structurées de type avis ou
   référence client ; dans `/projects`, une démo porte toujours le tampon « Démo » (amendement du
   2026-10-06, spec 011, ADR-0008 §7).
7. Lighthouse mobile et desktop sur les deux pages : LCP et CLS sans régression mesurable
   (médiane de 5, avant / après).
8. Typographie française du repo respectée (invariant `editorial-typography.spec.ts`).

### Questions ouvertes pour Julien

1. Copie de l'en-tête de section et des phrases « ce que la démo illustre » : la proposition de
   l'architecte ou du `qa` est soumise avant le GREEN.
2. Les trois prérequis hors dépôt (`noindex` et bandeaux, photo du hero de site-industrie) :
   faits par Julien, ou par Claude dans les dépôts des démos si leurs chemins locaux sont fournis ?
3. Le lien de Le Vieux Comptoir reste-t-il sur `j-ned.github.io/le-vieu-comptoir/`, ou passe-t-il
   sur un sous-domaine `nedellec-julien.fr` comme les deux autres (cohérence, et le dépôt
   s'appelle « le-vieu-comptoir », sans x) ?

## Plan technique

> Décision structurante : **ADR-0007** (images statiques de `public/` : nom versionné,
> `<picture>` AVIF/WebP autour de `NgOptimizedImage`). Prolonge ADR-0004 (contenu statique =
> constante de domaine), ADR-0005 (`OFFER_PAGES` n'entre que dans le chunk lazy des offres) et
> ADR-0006 (version dans le nom des fichiers de `public/`). Profil lu :
> `.claude/project-profile.md`. **Aucune dépendance ajoutée, aucun changement d'API, aucun
> changement de CSP ni de nginx.**
>
> Faits vérifiés le 2026-10-05 : les six visuels utiles font exactement 1 600 × 1 000 et
> 800 × 500 px (en-têtes `ispe` AVIF et `VP8X` WebP lus) ; la prod sert déjà `avatar.avif` en
> `content-type: image/avif` avec `cache-control: public, max-age=31536000, immutable` ; Angular
> 22.2.1 sans `IMAGE_LOADER` ne génère aucun `srcset` (`shouldGenerateAutomaticSrcset()`) et
> avertit sur `ngSrcset` (NG02963).

### 1. Architecture

Tout tient dans la feature `offer`, deux couches (ADR-0004) :

```
offer.routes.ts (inchangé)  data.content = OFFER_PAGES[slug]          (chunk lazy des offres)
  └─ OfferPage  content().examples ? → <app-offer-examples>           (entre livrables et déroulé)
        └─ OfferExamples  SplitSection(heading, summary = lead) > ul > li × n
              └─ OfferDemoCard  Cartouche(title = name, reference = sector)
                    ├─ <picture> 2 × <source> + <img ngSrc>   ← demoPicture(image.file)  (domaine pur)
                    ├─ badge « Démo » posé sur le visuel
                    └─ phrase « ce que la démo illustre » + lien « Voir la démo » (nouvel onglet)

domain/
  models/offer.model.ts         + OfferDemo, OfferDemoImage, DemoImageFile, OfferExamples ; OfferPageContent.examples?
  demo-picture.ts               demoPicture(file) → srcsets AVIF/WebP + repli (fonction pure)
  offer-pages.static-data.ts    + examples sur 'site-vitrine' (2 démos) et 'site-atelier' (1 démo)
public/demos/                   6 fichiers versionnés par offre de démo (ADR-0007)
```

- **Placement confirmé** : après « Ce que contient le site », avant le déroulé. Il suit l'ordre
  du principe 2 de `PRODUCT.md` (« vous l'avez déjà fait ? » avant « comment ça se passe ? ») et
  répond à la question que la liste de livrables laisse ouverte (« à quoi ça ressemblera »).
- **Composants dumb**, `input()` seulement. Seule dérivation : `demoPicture()` (fonction pure du
  domaine) dans un `computed()` de la carte. **Pas de presenter** : aucune interaction, aucun
  état, une dérivation d'une ligne.
- **Landmarks** : inchangés. Le shell possède `main`, `banner`, `contentinfo` ; la section est
  une `section aria-labelledby` (via `SplitSection`), sans `header`/`footer` hors `section`.
- **Aucun gateway, aucun appel réseau** vers les sites de démo : les URL ne sont que des `href`.

### 2. Fichiers à créer / modifier

**Créer**

| Fichier | Rôle |
|---|---|
| `src/app/features/offer/domain/demo-picture.ts` | `demoPicture(file)` : `{ avifSrcset, webpSrcset, fallbackSrc, width, height }` ; constante `DEMO_IMAGE_WIDTHS = [800, 1600] as const` |
| `src/app/features/offer/domain/demo-picture.spec.ts` | (qa) sans TestBed |
| `src/app/features/offer/application/components/offer-examples.ts` | `app-offer-examples` : section, en-tête honnête, liste des démos |
| `src/app/features/offer/application/components/offer-demo-card.ts` | `app-offer-demo-card` : cartouche, visuel, badge, phrase, lien |
| `public/demos/coaching-life-20261005-{800,1600}.{avif,webp}` | 4 fichiers, copiés au GREEN (T2) |
| `public/demos/le-vieux-comptoir-20261005-{800,1600}.{avif,webp}` | 4 fichiers, copiés au GREEN (T2) |
| `public/demos/site-industrie-20261005-{800,1600}.{avif,webp}` | 4 fichiers, copiés au GREEN (T1) |
| `docs/adr/0007-images-statiques-versionnees-et-picture.md` | fait (statut « proposé », passe à « accepté » avec la T1) |

Copie (source : `…/scratchpad/demos/out/`, seuls les `.avif`/`.webp`, jamais `*-mockup.png` ni
`*.html`) : `<slug>-<largeur>.<ext>` → `public/demos/<slug>-20261005-<largeur>.<ext>`.

**Modifier**

| Fichier | Changement |
|---|---|
| `src/app/features/offer/domain/models/offer.model.ts` | types de § 3, `examples?: OfferExamples` dans `OfferPageContent` |
| `src/app/features/offer/domain/offer-pages.static-data.ts` | `examples` sur `site-atelier` (T1) et `site-vitrine` (T2), entre `deliverables` et `steps` |
| `src/app/features/offer/application/offer-page.ts` | `@if (page.examples; as examples) { <app-offer-examples [examples]="examples" /> }` entre livrables et déroulé ; import |
| `src/app/features/offer/testing/offer-builders.ts` | `'examples'` dans `OptionalOfferSection` ; `makeOfferDemo()` |
| `src/app/features/offer/domain/offer-pages.static-data.spec.ts`, `src/app/features/offer/application/offer-page.spec.ts`, `src/app/features/offer/offer-seo.spec.ts` | (qa) cf. Tranches |
| `.github/workflows/ci.yml` | job `verify` : section présente et images existantes dans le prérendu ; job `docker` : type et cache d'une image de démo (§ 6) |
| `DESIGN.md` (§ 4, après « Carte d'offre ») et `DESIGN.json` (miroir) | entrée « Carte de démo » : structure, badge, lien, règle d'honnêteté |

`editorial-typography.spec.ts` couvre déjà tout `OFFER_PAGES` (les URL et chemins `/…` sont
exclus par `TECHNICAL_VALUE`) : rien à modifier, la nouvelle copie y est soumise d'office.

### 3. Modèles de données

Dans `offer.model.ts`, `type` `readonly` (profil) :

```ts
export type DemoImageFile = `/demos/${string}`;   // chemin versionné, sans largeur ni extension
export type OfferDemoImage = { readonly file: DemoImageFile; readonly alt: string };

export type OfferDemo = {
  readonly id: string;
  readonly name: string;          // entreprise fictive
  readonly sector: string;        // une ligne
  readonly illustrates: string;   // une phrase, liée à l'offre
  readonly url: `https://${string}`;
  readonly image: OfferDemoImage;
};

export type OfferExamples = OfferSection<OfferDemo> & { readonly lead: string };

export type OfferPageContent = { …; readonly examples?: OfferExamples; … };
```

- **Section optionnelle `examples`**, sur le modèle de `reasons`/`deliverables`/`steps`/`faq` :
  même rendu conditionnel, même place dans `OFFER_PAGES`, même couverture par l'invariant
  typographique. Une constante séparée `OFFER_DEMOS` indexée par slug a été écartée : elle
  dupliquerait l'indexation de `OFFER_PAGES` et sortirait la copie de la typographie testée.
- **Compile-time d'abord.**
  - Une démo ne peut pas devenir une référence client par les données : le seul type d'élément
    de la section est `OfferDemo`, le badge « Démo » est dans le gabarit, pas dans la donnée
    (aucun booléen `isDemo` à oublier). Une vraie référence client exigera un autre type et une
    autre section.
  - `url` refuse tout lien non HTTPS ; `DemoImageFile` refuse un chemin hors `/demos/`.
  - La version finale (`…-20261005`) ne peut **pas** être typée : vérifié avec `tsc`,
    `` `/demos/${string}-${number}` `` rejette `'/demos/site-industrie-20261005'` (le
    `${string}` s'arrête au premier tiret et `industrie-20261005` n'est pas un nombre). Elle se
    teste sur les données : chaque `file` respecte `^/demos/[a-z0-9-]+-\d{8}$`.
  - **Contrainte variable, donc pas dans le type** : quelles offres ont des exemples. C'est un
    choix éditorial (une démo d'application peut venir), il se teste sur les données
    (`OFFER_PAGES`), pas dans `OfferPages`.
- `demoPicture(file: DemoImageFile)` :
  `avifSrcset = "<file>-800.avif 800w, <file>-1600.avif 1600w"`, idem WebP,
  `fallbackSrc = "<file>-1600.webp"`, `width = 1600`, `height = 1000` (dimensions intrinsèques
  du fichier de repli, ratio 16:10 commun à toutes les variantes). Construit depuis
  `DEMO_IMAGE_WIDTHS`, jamais deux littéraux recopiés.
- `OFFER_PAGES` reste annoté `: OfferPages` sans `as const` (ADR-0005) : les URL littérales
  satisfont le template literal type par inférence contextuelle.

### 4. Réactivité

`OfferExamples` : `input.required<OfferExamples>()`, rien d'autre. `OfferDemoCard` :
`input.required<OfferDemo>()` et `protected readonly picture = computed(() =>
demoPicture(this.demo().image.file))`. Aucun `effect()`, aucun `resource()`, aucun RxJS.

### 5. État partagé & coordination

Aucun. Pas de store, pas de facade, pas de gateway (contenu statique, ADR-0004).

### 6. SEO et prérendu

- **Pas de `@defer`.** La section est rendue de façon synchrone dans `OfferPage`, comme toutes
  les autres sections de la page d'offre (qui n'en a aucun). Raisons :
  - le gain d'un `@defer` serait le JS de deux petits composants, déjà dans le **chunk lazy**
    des offres et jamais dans le bundle initial (ADR-0005 : `OFFER_PAGES` n'est importé que par
    `offer.routes.ts`) ;
  - le poids réel est dans les images, déjà différées par `loading="lazy"` (défaut de
    `NgOptimizedImage` hors `priority`) ;
  - un `@defer (on viewport; hydrate on viewport)` (forme imposée par l'ADR-0001) ajouterait un
    `@placeholder` à dimensionner, un risque de CLS en navigation SPA et un découpage de chunk,
    pour un contenu sans interaction.
  - `NgOptimizedImage` est déjà utilisé par d'autres routes lazy (projets, blog, parcours) : il
    entre dans le chunk des offres, pas dans le bundle initial.
- **Contrôle de non-régression du JS initial** (verify) : la ligne `Initial total` de
  `pnpm run build --configuration production` est identique avant et après ; aucun nouveau
  fichier dans les chunks initiaux.
- **HTML servi** : la section, ses `<source>` et son `<img>` sont dans
  `dist/angular-portfolio-app/browser/offres/site-vitrine/index.html` et `…/site-atelier/…`.
- **Données structurées inchangées.** `toOfferSeo` ne lit pas `examples` : pas d'`ImageObject`,
  `CreativeWork`, `subjectOf`, `review` ni `workExample` pour les démos, qui seraient lisibles
  comme des références. `og:image` inchangé. Pas d'extension image dans le sitemap.
- **Garde CI** (job `verify`, à côté de la garde des préchargements de police) :
  - `grep -q 'data-testid="offer-examples"'` dans les deux `index.html` d'offre Sites ;
  - pour chaque chemin `/demos/…` extrait des `src` et `srcset` de ces deux fichiers,
    `test -f dist/angular-portfolio-app/browser/<chemin>` (un nom périmé casse la CI, pas la
    prod) ;
  - job `docker` : `curl -sI` d'un fichier `.avif` de `/demos/` → `content-type: image/avif` et
    `cache-control` immuable.

### 7. Design

Carte de démo = **`Cartouche` en carte de données** (comme la carte d'offre : répétée par
élément, hors de la limite « un cartouche décoratif par écran »). Aucun nouveau primitif
`shared/ui` : un seul consommateur.

- **Section** (`OfferExamples`) : hôte `block border-t border-foreground/8` (comme
  `OfferDeliverables`), `SplitSection` avec `headingId="offer-examples-heading"`, `heading`, et
  `summary = examples.lead` (la phrase d'honnêteté s'affiche sous le `h2`, colonne de gauche,
  épinglée en `lg`). Corps : `ul role="list"` en **une colonne à toutes les largeurs**
  (`grid gap-10`), `data-testid="offer-examples"`. Deux colonnes rendraient les captures
  illisibles (≈ 420 px de large en `xl`).
- **Carte** (`OfferDemoCard`), dans le `li` `data-testid="offer-demo"` :
  - `app-cartouche` `[title]="demo.name"` `[reference]="demo.sector"` : nom en Archivo élargi,
    secteur en mono `text-muted` ; hôte `role="group"` nommé par le nom de la démo. Pas de `h3`
    (le cartouche ne porte jamais de titre ; le groupe nomme la carte).
  - Contenu projeté : le visuel (`div relative border-t-[1.5px] border-line-strong`), puis un
    pied `p-3.5` séparé par un trait `line` : la phrase `illustrates`
    (`data-testid="offer-demo-illustrates"`, texte courant) et le lien.
  - **Badge « Démo »** (`data-testid="offer-demo-badge"`) en surimpression, coin haut gauche du
    visuel (`absolute left-3 top-3`) : `rounded-sm border border-line-strong bg-background
    px-2 py-1 font-mono text-xs uppercase tracking-[0.06em] text-foreground`, comme un tampon
    de plan. `bg-background` (opaque dans les deux registres), **pas** `bg-surface` ni
    `AppTag` (`bg-primary/10`, `bg-foreground/8` : translucides, contraste dépendant de la
    capture). Contraste = paire texte courant du thème, calculée (WCAG 2.x, valeurs hex de
    `DESIGN.md`) : `#fafafa` sur `#0a0a0a` = 18,97:1, `#292524` sur `#faf7f2` = 14,19:1.
    Pas d'indigo : le badge est une mention, pas un accent (One Indigo Rule).
  - **Lien** : `link-btn-outline` (utility existante, `min-h-11` = 44 px), libellé visible
    « Voir la démo », icône `external-link` (`AppIcon`, `aria-hidden` par défaut) à droite.
    Un seul lien par carte : ni le visuel ni la carte ne sont cliquables (pas de lien étiré :
    ouvrir un site externe en cliquant une image surprend).
- **Aucune cote** (`DimensionLine`) : réservée aux délais (`DESIGN.md`).
- **Mouvement** : aucun.

### 8. Images

- **Emplacement et nom** (ADR-0007, décision 1) : `public/demos/<slug>-20261005-<800|1600>.<avif|webp>`,
  servis à `/demos/…`. `<slug>` : `coaching-life`, `le-vieux-comptoir`, `site-industrie`.
  Toute nouvelle capture (photo du hero de site-industrie, changement d'URL du Vieux Comptoir)
  = nouvelle date dans le nom, nouveau `file` dans les données, anciens fichiers supprimés.
- **`<picture>` et `NgOptimizedImage`.** La directive ne gère pas `<picture>` : la FAQ de
  https://angular.dev/guide/image-optimization répond « No, but this is on our roadmap ». Elle
  ne l'interdit pas non plus : elle agit sur l'`<img>` seule. D'où :

  ```html
  <picture>
    <source type="image/avif" [srcset]="picture().avifSrcset" [sizes]="sizes" data-testid="offer-demo-source-avif" />
    <source type="image/webp" [srcset]="picture().webpSrcset" [sizes]="sizes" data-testid="offer-demo-source-webp" />
    <img [ngSrc]="picture().fallbackSrc" [width]="picture().width" [height]="picture().height"
         [alt]="demo().image.alt" class="block h-auto w-full" data-testid="offer-demo-image" />
  </picture>
  ```

  - Format **et** résolution choisis par les `<source>` (AVIF d'abord, WebP sinon).
  - Pas de `ngSrcset` (NG02963 sans loader), pas de `sizes` ni de `priority` sur l'`<img>`.
  - `width`/`height` = 1 600 × 1 000, intrinsèques du fichier `ngSrc` : ratio réservé, pas de
    CLS ; `h-auto w-full` indispensable (règle du repo).
  - `loading="lazy"`, `fetchpriority="auto"`, `decoding="auto"` : posés par la directive.
  - Les contrôles NG02952/NG02960 portent sur la variante réellement chargée (`naturalWidth`).
- **`sizes`** (constante `DEMO_IMAGE_SIZES` dans `offer-demo-card.ts` : elle décrit la mise en
  page, pas le domaine). Largeur du visuel = colonne de contenu de `SplitSection` (bordure du
  cartouche de 3 px négligée) :
  - `≥ 80rem` : 80rem − 2 × 2rem − 18rem − 4rem = **54rem** (864 px) ;
  - `64–80rem` : 100vw − 4rem − 18rem − 4rem = **calc(100vw − 26rem)** (608 px à 1 024) ;
  - `40–64rem` : **calc(100vw − 3rem)** (`px-6`) ;
  - `< 40rem` : **calc(100vw − 2rem)** (`px-4`).

  Soit `"(min-width: 80rem) 54rem, (min-width: 64rem) calc(100vw - 26rem), (min-width: 40rem) calc(100vw - 3rem), calc(100vw - 2rem)"`.
  À 375 px : 343 px CSS, 800w en DPR 2 (686 px), 1600w en DPR 3 (1 029 px).
- Poids : 13 à 47 Ko par visuel AVIF ; au plus deux visuels par page, chargés à l'approche du
  viewport.

### 9. Accessibilité

- **Lien** : `<a [href]="demo.url" target="_blank" rel="noopener" data-testid="offer-demo-link">
  Voir la démo<span class="sr-only">&nbsp;: {{ demo.name }}, nouvel onglet</span>…</a>`.
  - Nom accessible « Voir la démo : Coaching Life, nouvel onglet » : nomme la démo, annonce le
    nouvel onglet, commence par le libellé visible (WCAG 2.5.3), chaque lien distinct sur la
    page vitrine. Précédent suivi : le `sr-only` de `OfferCard`, **pas** l'`aria-label` de
    `project-detail-header.ts` (qui écrase le nom visible et n'annonce pas l'onglet).
  - `rel="noopener"` comme le demande la spec, sans `noreferrer` (écart assumé avec les liens
    externes du repo) : les démos appartiennent à Julien, et la `Referrer-Policy`
    `strict-origin-when-cross-origin` n'envoie que l'origine ; elle lui dit d'où vient la visite.
- **Badge** : un mot, pas une couleur ; lu dans l'ordre du DOM après le nom et le secteur
  (titre du cartouche, puis visuel). La phrase d'en-tête et le nom du lien répètent « démo ».
- **`alt`** descriptif, en donnée (`image.alt`), propositions au § 11. Jamais « capture
  d'écran ».
- **Titres** : `h1` unique (hero), section en `h2`, aucun `h3` ajouté : pas de saut.
- **Cible tactile** : lien 44 px (`min-h-11`). Aucun autre interactif dans la carte.
- **axe** : pas de dépendance axe dans le repo ; contrôle au verify (Lighthouse a11y et axe
  DevTools sur les deux pages), comme en spec 009.

### 10. Bibliothèques, cross-platform

Aucune bibliothèque. `NgOptimizedImage` (`@angular/common`). Pas de cible native.

### 11. Honnêteté et copie

- **Vérifié dans le repo** : la seule phrase qui oppose démos et production est
  `profile.static-data.ts` (« Pas des démos, mais des systèmes qui tournent. », page Parcours).
  Elle parle des applications, et la page Parcours ne montre pas les démos : pas de
  contradiction. L'autre « Voir la démo » du site (`project-detail-header.ts`) pointe vers des
  applications en ligne de projets personnels : sens différent, aucun changement.
- **Garde-fous testés** : aucune chaîne de démo (nom, URL, chemin d'image) dans `OFFERS` (lu par
  la home, le header et le footer), ni dans le `SeoData` d'aucune offre. `/projects` vient de
  l'API : non testable côté front, vérifié en prod au verify.
- **Copie proposée** (Question 1, à valider par Julien avant le GREEN de chaque tranche) :
  - titre : « Exemples » ; `lead` : « Des sites de démonstration, construits pour montrer le
    résultat. Les entreprises sont fictives. »
  - Delaunay Précision — secteur « Atelier d'usinage CN à Élancourt » ; illustre « Ce qu'un
    acheteur vérifie en trente secondes&nbsp;: savoir-faire, parc machines, certifications et
    demande de devis. » ; `alt` « Page d'accueil de Delaunay Précision sur ordinateur et sur
    téléphone&nbsp;: un bandeau Site de démonstration, le titre «&nbsp;Vos pièces de précision,
    usinées au centième près&nbsp;» et un bouton Demander un devis. »
  - Coaching Life — secteur « Coaching de vie, coaching équin et accompagnement parental » ;
    illustre « Trois activités sur un seul site, et la prise de rendez-vous à portée de clic sur
    chaque page. » ; `alt` « Page d'accueil de Coaching Life sur ordinateur et sur
    téléphone&nbsp;: le titre «&nbsp;Révélez votre plein potentiel intérieur&nbsp;», un bouton
    Prendre rendez-vous et la photo d'une coach dans un salon lumineux. »
  - Le Vieux Comptoir — secteur « Brasserie parisienne » ; illustre « Une ambiance qui se voit
    dès la première image, la carte en ligne et la réservation d'une table. » ; `alt` « Page
    d'accueil du Vieux Comptoir sur ordinateur et sur téléphone&nbsp;: une salle de brasserie
    aux lustres anciens, le titre «&nbsp;L'Âme de Paris&nbsp;» et les boutons Réserver une table
    et Découvrir la carte. »

  Les phrases « illustre » ne citent que ce qui se voit sur les captures du 2026-10-05 (menus et
  boutons des sites). Espaces insécables conformes à `editorial-typography.spec.ts`.

### Tranches

Deux PR, dans l'ordre. Les preuves de prérendu se font en verify (`pnpm run build
--configuration production` puis `grep` dans `dist/angular-portfolio-app/browser/offres/**`).

- **Tranche 1 — l'offre atelier montre sa démo** : modèle (§ 3), `demoPicture`, `OfferExamples`,
  `OfferDemoCard`, insertion dans `OfferPage`, `examples` de `site-atelier`, 4 fichiers
  `site-industrie-20261005-*`, garde CI, entrée `DESIGN.md`/`DESIGN.json`, ADR-0007 accepté.
  Structure porteuse : la section, la carte et la convention d'image naissent ici.
  - `demoPicture` (domaine, sans TestBed) : srcsets AVIF et WebP en 800w et 1600w dans cet
    ordre, repli = WebP 1 600, 1 600 × 1 000 ; triangulé sur deux `file` (`it.each`).
  - `OFFER_PAGES['site-atelier'].examples` : copie validée mot pour mot, une démo, URL
    `https://site-industrie.nedellec-julien.fr/`, `file` = `/demos/site-industrie-20261005`
    (motif de version `^/demos/[a-z0-9-]+-\d{8}$`).
  - `OfferPage` (données atelier) : section `offer-examples` nommée par son `h2`, placée entre
    livrables et déroulé (ordre des `h2` mis à jour dans les tests existants) ; dans
    `offer-demo` : nom (`cartouche-title`), secteur (`cartouche-reference`), badge « Démo »,
    phrase ; `offer-demo-link` : `href`, `target="_blank"`, `rel` contenant `noopener`, nom
    accessible « Voir la démo : Delaunay Précision, nouvel onglet » ; `offer-demo-source-avif`
    (`type="image/avif"`) avant `offer-demo-source-webp`, `srcset` et `sizes` présents ;
    `offer-demo-image` : `src` du repli, `width`/`height` 1600/1000, `loading="lazy"`, `alt`
    de la donnée, aucun `fetchpriority="high"`.
  - Contenu construit par builder sans `examples` (`withoutSections`) : aucune section
    `offer-examples`.
  - `toOfferSeo` (atelier) : la sérialisation JSON ne contient ni le nom, ni l'URL, ni le
    chemin d'image de la démo.

- **Tranche 2 — la vitrine montre ses deux démos, les autres offres aucune** : `examples` de
  `site-vitrine` (Coaching Life puis Le Vieux Comptoir), 8 fichiers `coaching-life-20261005-*`
  et `le-vieux-comptoir-20261005-*`. Aucun code applicatif nouveau attendu : si la T2 en exige,
  c'est que la T1 était mal découpée.
  - `OFFER_PAGES` : `site-vitrine` a deux démos (copie mot pour mot, URL, `file`) ;
    `application-metier`, `refonte-maintenance`, `renfort-freelance` n'ont pas d'`examples`
    (`it.each`) ; ids uniques dans chaque section.
  - `OfferPage` (données vitrine) : deux `offer-demo` dans l'ordre, deux noms de lien distincts.
  - Honnêteté : aucun nom ni URL de démo dans les chaînes de `OFFERS`, ni dans le `SeoData`
    d'aucune des cinq offres (`it.each`).

### Risques & inconnues

- **Mise en ligne avant les prérequis** : tant que Coaching Life et Le Vieux Comptoir sont
  indexables sans bandeau, la T2 met en avant des sites qui se présentent comme de vraies
  entreprises. La PR de la T2 se merge **après** la pose de `noindex` et des bandeaux, vérifiés
  en ligne (même logique que l'ordre API puis front de `CLAUDE.md`). La T1 n'en dépend que pour
  la photo du hero de site-industrie (cf. Questions).
- **Captures périssables** : la capture de site-industrie montre l'emplacement gris « Photo du
  client » ; celle du Vieux Comptoir affiche `j-ned.github.io/le-vieu-comptoir` dans la barre
  d'adresse. Une photo ou une URL changée impose une nouvelle capture, donc un nouveau nom
  (ADR-0007), un nouveau `file` et un nouvel `alt`.
- **Images déjà publiées sans version** (`avatar.avif`, `avatar.png`, `favicon.*`,
  `public/icons/*`) : servies `immutable` un an, un remplacement resterait invisible aux
  visiteurs déjà venus. Hors périmètre, à traiter le jour où l'une change.

### Questions pour Julien (plan)

1. **Copie** (§ 11) : titre « Exemples », phrase d'en-tête, secteurs, phrases « illustre » et
   `alt` à valider ou corriger avant le GREEN de la T1 (atelier) et de la T2 (vitrine).
2. **T1 avec la capture actuelle de site-industrie** (emplacement gris visible) ou attente de la
   photo de hero ? Le nom versionné permet de livrer maintenant et de remplacer ensuite sans
   souci de cache, mais l'emplacement gris affaiblit la démo.
3. **`rel="noopener"` seul** (spec, referrer utile à vos statistiques de démo) ou
   `noopener noreferrer` comme les autres liens externes du site ?
4. Rappel de la Description : URL du Vieux Comptoir (sous-domaine `nedellec-julien.fr` ou
   GitHub Pages). Si elle change, la capture est à refaire avant la T2.

## Arbitrages du propriétaire (2026-10-05)

1. **Copie** (§ 11) : validée telle quelle, à figer mot pour mot dans les tests des deux tranches.
2. **T1** : attend la photo du hero de site-industrie. La capture est refaite après ce changement,
   avec un nouveau nom daté (ADR-0007).
3. **`rel`** : `noopener` seul, comme prévu (le referrer renseigne les statistiques des démos).
4. **Le Vieux Comptoir** passe sur un sous-domaine `nedellec-julien.fr`, comme les deux autres.
   L'URL et la capture sont refaites avant la T2.

Conditions de démarrage : la T1 attend la photo du hero de site-industrie ; la T2 attend en plus
le sous-domaine du Vieux Comptoir, puis `noindex` et les bandeaux « Site de démonstration » en
ligne sur Coaching Life et Le Vieux Comptoir.

## Plan de test

### Tranche 1 — l'offre atelier montre sa démo

Les composants `OfferExamples` et `OfferDemoCard` sont dumb, sans spec isolé : ils sont couverts
outside-in par `offer-page.spec.ts`. La seule dérivation, `demoPicture`, est testée dans le
domaine, sans TestBed. La copie du § 11 est figée mot pour mot (arbitrage 1), et `rel` vaut
exactement `noopener` (arbitrage 3). `editorial-typography.spec.ts` parcourt déjà tout
`OFFER_PAGES` : rien à y ajouter, la nouvelle copie y passe d'office.

Contrats fixés par ce RED (le plan les laissait implicites) :

- **Modèle** (§ 3, tel quel) : `DemoImageFile`, `OfferDemoImage`, `OfferDemo`
  `{ id, name, sector, illustrates, url, image: { file, alt } }`, `OfferExamples` =
  `OfferSection<OfferDemo> & { lead }`, `OfferPageContent.examples?` entre `deliverables` et
  `steps`.
- **`demoPicture`** (`domain/demo-picture.ts`) : renvoie exactement
  `{ avifSrcset, webpSrcset, fallbackSrc, width: 1600, height: 1000 }`, sans autre clé.
  `DEMO_IMAGE_WIDTHS` vaut `[800, 1600]`.
- **Données atelier** : `id` de la démo = `'site-industrie'`, apostrophes droites comme le reste
  de `OFFER_PAGES`, espaces insécables U+00A0 avant `:` et à l'intérieur des guillemets « ».
- **Testids** : `offer-examples` (le `ul`), `offer-demo` (chaque `li`, enfant direct du `ul`),
  `offer-demo-badge`, `offer-demo-illustrates`, `offer-demo-link`, `offer-demo-source-avif`,
  `offer-demo-source-webp`, `offer-demo-image`. Le nom et le secteur passent par
  `cartouche-title` et `cartouche-reference`.
- **Lead** : c'est le `summary` de `SplitSection`, lu dans le `header p` de la section.
- **Lien** : il n'a pas d'`aria-label`. Son texte complet est
  `Voir la démo : <name>, nouvel onglet`, et l'icône ne porte aucun texte. C'est le seul
  `a`/`button` de la carte.
- **`<picture>`** : enfants exactement dans l'ordre `source` AVIF, `source` WebP, `img`. Les
  deux `source` portent le `sizes` du § 8 mot pour mot.
- **`img`** : `src` = repli, `width="1600"`, `height="1000"`, `loading="lazy"`,
  `fetchpriority="auto"`, sans `srcset` ni `sizes`.
- **Builder** (`testing/offer-builders.ts`) : `makeOfferDemo()` ; `makeOfferPageContent()`
  contient désormais `examples` (une démo) ; `'examples'` s'ajoute à `OptionalOfferSection`.

**`domain/demo-picture.spec.ts`** (TS pur, 3 tests, nouveau)

| Test | Scénario | Assertions clés |
|---|---|---|
| largeurs | `DEMO_IMAGE_WIDTHS` | `toEqual([800, 1600])` |
| dérivation (`it.each`, 2 cas) | `/demos/site-industrie-20261005`, `/demos/coaching-life-20270312` | `toEqual` des srcsets AVIF puis WebP littéraux (800w puis 1600w), repli `…-1600.webp`, 1600 × 1000 |

**`domain/offer-pages.static-data.spec.ts`** (+2 tests, 1 recalibré)

| Test | Scénario | Assertions clés |
|---|---|---|
| titres de l'atelier (recalibré) | `site-atelier` | `examples: 'Exemples'` entre livrables et déroulé |
| démo Delaunay Précision | `site-atelier.examples` | golden `toEqual` : titre, lead, une démo (id, nom, secteur, phrase, URL `https://site-industrie.nedellec-julien.fr/`, `file` `/demos/site-industrie-20261005`, `alt`) |
| version des images | toutes les démos de `OFFER_PAGES` | au moins une ; chaque `file` respecte `^/demos/[a-z0-9-]+-\d{8}$` (motif vérifié sur 4 cas) |

**`offer-seo.spec.ts`** (+1 test)

| Test | Scénario | Assertions clés |
|---|---|---|
| démo hors données structurées | `toOfferSeo` atelier | 3 chaînes de démo (nom, URL, `file`) ; aucune dans le JSON sérialisé |

**`application/offer-page.spec.ts`** (+14 tests, 3 recalibrés)

| Test | Scénario | Assertions clés |
|---|---|---|
| lead honnête | atelier | `header p` de la section = phrase « entreprises fictives » |
| carte | atelier | 1 `li` `offer-demo` enfant de `offer-examples` ; nom, secteur, badge `Démo`, phrase |
| lien | atelier | `A`, `href` exact, `target="_blank"`, `rel="noopener"`, pas d'`aria-label`, texte `Voir la démo : Delaunay Précision, nouvel onglet` |
| un seul interactif | atelier | 1 `a, button` dans la carte |
| `<picture>` | atelier | parent `PICTURE`, ordre avif, webp, img ; `type`, `srcset` littéraux, `sizes` du § 8 |
| `img` | atelier | `src` `…-1600.webp`, 1600/1000, `lazy`, `fetchpriority="auto"`, sans `srcset` ni `sizes`, `alt` de la donnée |
| section nommée (`it.each`, +1 ligne × 2 contenus) | atelier, builder | `offer-demo` dans une section `aria-labelledby` vers un `H2` = `examples.heading` |
| ordre des `h2` (recalibré × 2) | atelier, builder | `examples.heading` entre livrables et déroulé |
| sans déroulé ni FAQ (recalibré) | builder | `examples.heading` entre livrables et tarif |
| sans exemples (2 tests) | `withoutSections(…, 'examples')` | ni `offer-examples` ni `offer-demo` ; `h2` sans « Exemples » |
| cartes du builder (`describe.each` 1 et 2 démos, 2 tests chacun) | builder | une carte par démo dans l'ordre (nom, secteur, badge, phrase, `href`, nom du lien, `src`, `alt`) ; lead du contenu |

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil
le 2026-10-05 20:49, 22 failed / 1080 total). Nature des échecs : sur l'arbre réel, `pnpm test`
(après `ng cache clean` et purge de `node_modules/.vite`) s'arrête à la compilation, uniquement
sur des symboles applicatifs dus au GREEN : `TS2307` `./demo-picture`, `TS2305` `OfferDemo`,
`TS2339`/`TS2353` `examples` absent d'`OfferPageContent`, plus les `TS7006`/`TS7031`/`TS7053`
qui en découlent. Aucune faute de type propre aux specs ; prettier et eslint verts sur
`features/offer` ; aucun résultat pour le motif d'archéologie. Mesure du rouge comportemental :
squelette jetable posé le temps d'une exécution, puis retiré (types du § 3 dans le modèle,
`demoPicture` qui renvoie des chaînes vides et des zéros, `DEMO_IMAGE_WIDTHS = []`, ni données
ni composant ; `git checkout` du modèle, fichier supprimé). Résultat : 107 fichiers,
22 failed / 1080 total, tous en `AssertionError` : 3 `demoPicture`, 3 `OFFER_PAGES` dont
1 recalibré, 1 SEO, 15 `OfferPage` dont 3 recalibrés. Verts par nature sous le squelette : les
2 tests « sans exemples » (garde du `@if`). Harnais vérifié : une implémentation jetable (données
atelier, `demoPicture`, les deux composants avec `NgOptimizedImage`, insertion dans `OfferPage`)
donne 1080 passed / 1080 ; elle a été retirée par `git checkout` et suppression, et `git status`
ne montre plus aucun fichier applicatif.
Non-régression : la base avant RED donne 1060 passed / 1060 ; 1080 = 1060 + 20 tests ajoutés.
Seuls tombent, parmi les tests existants, les 4 recalibrés sur le nouvel ordre des sections.
Squelette dû au GREEN : `domain/models/offer.model.ts` (types du § 3), `domain/demo-picture.ts`,
`domain/offer-pages.static-data.ts` (`examples` de `site-atelier`),
`application/components/offer-examples.ts`, `application/components/offer-demo-card.ts`,
`application/offer-page.ts` (insertion).

### Tranche 2 — la vitrine montre ses deux démos, les autres offres aucune

La structure de la T1 suffit : la T2 n'ajoute que des données. Aucun spec isolé, aucun builder
nouveau. Les tests existants qui couvraient déjà la surface sont recalibrés, sans test parallèle
(titres et décomptes par offre, ids uniques, garde SEO). `editorial-typography.spec.ts` parcourt
déjà tout `OFFER_PAGES`, il n'y a donc rien à y ajouter. Le harnais validé ci-dessous montre que
la nouvelle copie y passe.

Contrats fixés par ce RED :

- **Copie** : § 11 mot pour mot (arbitrage 1), avec **un ajustement des `alt`**, demandé le
  2026-10-05. Les captures refaites ce jour-là montrent le bandeau « Site de démonstration » en
  haut des deux sites. Comme pour Delaunay, « un bandeau Site de démonstration, » s'insère donc
  juste après le deux-points des `alt` de Coaching Life et du Vieux Comptoir. Le reste est
  inchangé :
  - Coaching Life : « Page d'accueil de Coaching Life sur ordinateur et sur téléphone&nbsp;: un
    bandeau Site de démonstration, le titre «&nbsp;Révélez votre plein potentiel
    intérieur&nbsp;», un bouton Prendre rendez-vous et la photo d'une coach dans un salon
    lumineux. »
  - Le Vieux Comptoir : « Page d'accueil du Vieux Comptoir sur ordinateur et sur
    téléphone&nbsp;: un bandeau Site de démonstration, une salle de brasserie aux lustres
    anciens, le titre «&nbsp;L'Âme de Paris&nbsp;» et les boutons Réserver une table et
    Découvrir la carte. »
- **Données vitrine** : `examples` entre `deliverables` et `steps`. Titre `Exemples` et `lead`
  identiques à ceux de l'atelier. Ordre : Coaching Life, puis Le Vieux Comptoir. Les apostrophes
  sont droites. U+00A0 avant `:` et à l'intérieur des « ».
  - `id` = slug du fichier, comme `site-industrie` : `coaching-life`, `le-vieux-comptoir`.
  - URL (arbitrage 4, sous-domaines servis) : `https://coaching-life.nedellec-julien.fr/`,
    `https://vieux-comptoir.nedellec-julien.fr/`. Il n'y a pas de `le-` dans le sous-domaine.
  - `file` : `/demos/coaching-life-20261005`, `/demos/le-vieux-comptoir-20261005`.
- **Offres sans exemples** : `application-metier`, `refonte-maintenance` et `renfort-freelance`
  ont un titre et un décompte `examples` à `undefined`. Au rendu, chaque offre du catalogue
  affiche exactement 2 cartes (vitrine), 1 (atelier) ou 0 (les trois autres).
- **Honnêteté** : les chaînes surveillées sont le nom, l'URL et le `file` de **toutes** les démos
  d'`OFFER_PAGES`, soit exactement 9, pour que la garde ne passe pas à vide. Aucune ne doit
  apparaître :
  - dans les chaînes d'`OFFERS` ;
  - dans le `SeoData` sérialisé de chacune des cinq offres (`title`, `description`, `url`,
    JSON-LD).
- **Dû au GREEN, hors tests** :
  - `examples` de `site-vitrine` dans `offer-pages.static-data.ts` ;
  - les 8 fichiers `public/demos/{coaching-life,le-vieux-comptoir}-20261005-{800,1600}.{avif,webp}`,
    copiés depuis `…/scratchpad/demos/out/{coaching-life,le-vieux-comptoir}-{800,1600}.{avif,webp}` ;
  - `site-vitrine` ajouté à la boucle de la garde `verify` de `.github/workflows/ci.yml`
    (`for page in site-atelier site-vitrine`, point de la Review code de la T1).

**`domain/offer-pages.static-data.spec.ts`** (+2 tests, 13 recalibrés : 4 + 4 + 5)

| Test | Scénario | Assertions clés |
|---|---|---|
| titres des sections (`describe.each`, recalibré × 4) | vitrine, application, refonte, renfort | clé `examples` : `'Exemples'` pour la vitrine, `undefined` pour les trois autres |
| décomptes (`describe.each`, recalibré × 4) | idem | `examples` : `2` pour la vitrine, `undefined` pour les trois autres |
| démos de la vitrine | `site-vitrine.examples` | golden `toEqual` : titre, lead, Coaching Life puis Le Vieux Comptoir (id, nom, secteur, phrase, URL, `file`, `alt` ajusté) |
| ids distincts (`it.each` × 5, recalibré) | toutes les offres | les démos entrent dans la liste des ids uniques |
| `OFFERS` sans démo | toutes les démos d'`OFFER_PAGES` | 9 chaînes ; aucune dans `collectStrings(OFFERS)` |

**`offer-seo.spec.ts`** (+4 tests : 1 test atelier remplacé par un `it.each` × 5)

| Test | Scénario | Assertions clés |
|---|---|---|
| démos hors données de recherche (`it.each(OFFERS)`) | `toOfferSeo` de chaque offre | 9 chaînes de démo ; aucune dans le `SeoData` sérialisé |

**`application/offer-page.spec.ts`** (+14 tests)

| Test | Scénario | Assertions clés |
|---|---|---|
| cartes par offre (`describe.each(OFFERS)`, × 5) | les cinq offres réelles | `offer-demo` : 2 / 1 / 0 / 0 / 0 (table `DEMO_COUNT` littérale) |
| démos de la vitrine | `site-vitrine` | ordre Coaching Life puis Le Vieux Comptoir : nom, secteur, badge `Démo`, `href`, `src` `…-20261005-1600.webp` |
| noms de lien distincts | `site-vitrine` | `Voir la démo : Coaching Life, nouvel onglet`, puis `… Le Vieux Comptoir, …` |
| section nommée et ordre des `h2` (`describe.each` + 1 contenu, × 7) | `site-vitrine` | chaque section (dont `offer-demo`) nommée par son `h2` ; `Exemples` entre livrables et déroulé |

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil
le 2026-10-05 21:27, 14 failed / 1100 total). Nature des échecs : `pnpm test` complet, après
`ng cache clean` et purge de `node_modules/.vite`. La compilation passe sans aucune erreur
`TS` : les types de la T1 suffisent. Les 14 échecs sont tous des `AssertionError` :

- 5 SEO : 9 chaînes de démo attendues, 3 trouvées ;
- 4 `OFFER_PAGES` : golden vitrine, titres et décomptes de la vitrine (2 recalibrés), garde
  `OFFERS` ;
- 5 `OfferPage` : 2 cartes attendues sur la vitrine, ordre et contenu des cartes, noms de lien,
  section `offer-demo` nommée, ordre des `h2`.

Prettier et eslint sont verts sur `features/offer`. Le motif d'archéologie ne donne aucun
résultat (aucun commentaire ajouté).

Certains tests sont verts par nature sous le RED, parce qu'ils gardent des absences ou des
invariants :
- les 3 offres sans exemples (titres, décomptes, 0 carte) ;
- l'atelier (1 carte) ;
- les 5 autres sections nommées de la vitrine ;
- les ids distincts.

Harnais vérifié : les seules données `examples` de `site-vitrine`, ajoutées le temps d'une
exécution sans aucun autre code, donnent 1100 passed / 1100, typographie comprise. Elles ont
ensuite été retirées par `git checkout`. `git status` ne montre que les 3 specs.

Non-régression : la base avant RED donne 1080 passed / 1080. Le total de 1100 correspond à
1080 + 20 tests ajoutés (2 + 4 + 14). Parmi les tests existants, seuls tombent les tests
recalibrés sur le nouveau contrat : les 2 titres et décomptes de la vitrine, et le cas atelier
de la garde SEO généralisée. Ce cas exige désormais les 9 chaînes des trois démos. Aucun autre
test de la T1 ne tombe.

## Journal des tranches

- **Tranche 1 — l'offre atelier montre sa démo** : GREEN 1080 passed / 1080 total · refactor : aucun (passe manuelle sur le diff, `simplify` non invoqué en sous-agent : `demoPicture` dérive repli et dimensions de `DEMO_IMAGE_WIDTHS`, sans littéral recopié ; `computed` de la carte nommé `picture` pour ne pas masquer la fonction du domaine ; aucun wrapper de rôle, aucun nom cryptique ; espaces insécables de la copie en ` ` dans les données, `&nbsp;` dans le seul gabarit du lien, comme `OfferCard`). Deux écarts au § 7 et au § 8 du plan : pas de `border-t-[1.5px]` sur le visuel, car la barre de titre du cartouche porte déjà ce trait (il serait doublé) ; `srcset` et `sizes` des `<source>` liés en `[attr.…]`, qui garantit l'attribut dans le HTML prérendu.
- **Tranche 2 — la vitrine montre ses deux démos, les autres offres aucune** : GREEN 1100 passed / 1100 total · refactor : aucun (diff de données seul : `examples` de `site-vitrine` recopié du Plan de test, espaces insécables en `\u00a0` comme l'atelier ; aucun code applicatif, aucun nom ni wrapper à revoir ; 8 visuels copiés ; boucle de la garde CI étendue à `site-vitrine`).

## Verify

### Tranche 1 — `/offres/site-atelier/` (surface atteignable en production, restructurée)

Steps : `pnpm install --frozen-lockfile` → `pnpm run build --configuration production` (20 routes
prérendues) sur la branche, et sur la base `4e8cbba` (worktree détaché dans le scratchpad, retiré
ensuite) → lecture de `dist/angular-portfolio-app/browser/offres/*/index.html` →
`python3 -m http.server` sur chaque `browser/` (`:4361` branche, `:4362` base) → Chromium headless
(Playwright) sur `/offres/site-atelier/` à 1440×900 (DPR 1) et 375×812 (DPR 2), clair puis sombre
(thème posé avant chargement par `j-ned:theme`), défilement jusqu'à la section, axe-core 4.13
injecté par évaluation de script → Lighthouse 12.8 mobile et desktop (throttling simulé), base et
branche dans la même session. `public/sitemap.xml` et `public/rss.xml` restaurés par
`git checkout` après les builds. Serveurs arrêtés par `fuser -k`.

1. **HTML prérendu** : `data-testid="offer-examples"` présent dans `offres/site-atelier/index.html`,
   absent de `site-vitrine`, `application-metier`, `refonte-maintenance` et `renfort-freelance`
   (aucun chemin `/demos/` dans ces quatre pages). `h1` unique, puis `h2` dans l'ordre : raisons,
   « Ce que contient le site », « Exemples », « Le déroulé en 7 jours », « Tarif », « Questions
   fréquentes ». `<picture>` = `source` AVIF puis `source` WebP (`srcset` 800w et 1600w, `sizes`
   du § 8), puis `<img>` `src="/demos/site-industrie-20261005-1600.webp"` `width="1600"`
   `height="1000"` `loading="lazy"` `fetchpriority="auto"`, `alt` de la donnée ; aucun
   `fetchpriority="high"` ni préchargement d'image dans la page. Lien
   `target="_blank" rel="noopener"`, `sr-only` « &nbsp;: Delaunay Précision, nouvel onglet ».
   JSON-LD inchangé (aucune chaîne de démo).
2. **Garde CI** rejouée à la main sur le build : section présente, 4 chemins `/demos/…` cités, tous
   présents dans `dist/…/browser/demos/`. Contre-épreuve : un AVIF retiré d'une copie du build fait
   échouer la garde (`visuel de démo sans fichier : /demos/site-industrie-20261005-800.avif`,
   code 1). Le contrôle `content-type`/`cache-control` du job `docker` n'est pas rejoué
   localement (pas de `docker build`) ; la règle nginx `\.(…|avif)$` → `immutable` est celle qui
   sert déjà `avatar.avif` en production.
3. **Visuels** : 4 fichiers `public/demos/site-industrie-20261005-{800,1600}.{avif,webp}`,
   1 600 × 1 000 et 800 × 500 (en-têtes `ispe` AVIF et `VP8` WebP lus), 17 546 à 72 518 o. La
   capture montre la photo d'atelier du hero (arbitrage 2) et le bandeau « Site de
   démonstration ».
4. **Runtime** (4 combinaisons largeur × registre) :

   | Largeur | Registre | Variante chargée | Requête avant défilement | Badge | Lien | CLS | axe |
   |---|---|---|---|---|---|---|---|
   | 1440 | clair | `…-1600.avif` | oui (dans le seuil lazy de Chromium) | « DÉMO », sur le visuel | 44 px | 0 | 0 |
   | 1440 | sombre | `…-1600.avif` | oui | idem | 44 px | 0 | 0 |
   | 375 | clair | `…-800.avif` | non | idem | 44 px | 0 | 0 |
   | 375 | sombre | `…-800.avif` | non | idem | 44 px | 0 | 0 |

   - AVIF choisi par Chromium à chaque fois ; `img` rendue 862 × 539 (1440) et 341 × 213 (375),
     ratio conservé.
   - Badge : texte `oklch(0.266 0.011 56)` sur `oklch(0.97 0.008 87)` en clair,
     `oklch(0.985 0.003 286)` sur `oklch(0.145 0.003 286)` en sombre, fond opaque ; axe ne relève
     aucun contraste insuffisant.
   - Nom accessible du lien : « Voir la démo : Delaunay Précision, nouvel onglet ». Clic (1440,
     clair) : nouvel onglet sur `https://site-industrie.nedellec-julien.fr/`, `window.opener`
     nul, page d'origine inchangée.
   - Console : les trois mêmes entrées que sur la base, toutes préexistantes et dues au serveur
     statique local (`/api/config` en 404, `analytics/track` refusé par CORS depuis
     `localhost`). Aucune erreur ni avertissement lié à la section.
   - Mode développement (`ng serve`, 375 DPR 2 et 3, 412 DPR 1,75, 1440 DPR 1 et 2) : aucun
     NG029xx (ratio, surdimensionnement) ; NG02955 (« image LCP sans `priority` ») apparaît
     seulement si on fait défiler par script avant toute interaction, jamais avec un défilement
     à la molette : l'image n'est pas l'élément LCP d'une visite réelle.
5. **Bundle initial** : 7 fichiers initiaux, mêmes noms de chunks hors `main` et `styles`.
   `Initial total` : base 582,80 kB / 144,72 kB estimés, branche 582,94 kB / 144,71 kB estimés (+0,14 kB bruts, −0,01 kB transférés). Écart non nul,
   expliqué : `main` ne change que par l'ordre des modules et le renommage des identifiants du
   minifieur (`Cartouche` déplacé dans le fichier, aucun code ajouté, −42 o bruts) ; `styles`
   gagne les utilitaires Tailwind nouvellement employés (`top-3`, `justify-self-start`, `h-auto`,
   et `border-t-[1.5px]` lu dans le texte de cette spec, que Tailwind analyse). Aucun code de la
   section dans les chunks initiaux : `OfferExamples`, `OfferDemoCard` et `NgOptimizedImage`
   sont dans le chunk lazy des offres.
6. **Lighthouse `/offres/site-atelier/`** (perf · LCP · CLS ; élément LCP = `h1#offer-heading`
   sur toutes les passes, avant et après) :

   | Profil | Image | Perf (passes) | LCP médian (passes) | CLS médian |
   |---|---|---|---|---|
   | mobile, simulé, 5 passes | base | 64 (64/67/62/64/64) | 6 042 ms (6 042/5 741/6 304/6 153/6 040) | 0 |
   | mobile, simulé, 5 passes | branche | 64 (64/64/64/64/64) | 6 246 ms (6 246/6 249/6 158/6 156/6 248) | 0 |
   | desktop, simulé, 3 passes | base | 96 (96/96/95) | 1 165 ms (1 184/1 133/1 165) | 0 |
   | desktop, simulé, 3 passes | branche | 96 (95/96/96) | 1 168 ms (1 149/1 168/1 169) | 0 |
   | mobile, devtools, 3 passes | base | 88 (88/88/86) | 1 030 ms (1 033/1 030/1 023) | 0,035 |
   | mobile, devtools, 3 passes | branche | 86 (86/85/87) | 1 033 ms (1 037/1 027/1 033) | 0,035 |

   Accessibilité 100 sur toutes les passes qui la mesurent. CLS identique avant et après dans
   chaque profil (le 0,035 du throttling devtools existe déjà sur la base).
   **Réserve sur le LCP mobile simulé (+204 ms, +3,4 %)** : au viewport Lighthouse mobile
   (412 × 823), le visuel commence à 2 045 px, juste dans le seuil de chargement anticipé du
   `loading="lazy"` de Chromium (823 + 1 250 px) ; il est donc demandé dès la première mise en
   page (priorité basse, 17 735 o), en même temps que les polices de texte, avant le LCP
   observé. Le modèle simulé de Lighthouse le compte alors dans le chemin du LCP. Sous un vrai
   throttling (devtools), la requête part à 1 026 ms et le LCP ne bouge pas (+3 ms). À 375 px,
   le visuel (2 074 px) reste hors du seuil et n'est demandé qu'au défilement. Desktop : +3 ms.

Verdict : **PASS**, avec la réserve du point 6 (LCP mobile simulé +204 ms, non reproduit sous
throttling réel) et l'écart d'`Initial total` du point 5 (aucun code ajouté au JS initial), à
trancher par la session principale.

Captures (scratchpad de session, `t1/shots/`) :
`site-atelier-{1440,375}-{light,dark}-examples.png`. Rapports Lighthouse : `t1/lh/`,
`t1/lh-devtools/` ; mesures runtime : `t1/verify-after.json`.

### Tranche 2 — `/offres/site-vitrine/` (surface atteignable en production, restructurée)

Steps : `pnpm run build --configuration production` (exit 0, 21 pages durcies par la CSP) →
`public/sitemap.xml` et `public/rss.xml` restaurés par `git checkout` → lecture de
`dist/angular-portfolio-app/browser/offres/*/index.html` → garde CI `verify` rejouée à la main →
`python3 -m http.server 4371` sur `browser/` → Chromium headless (Playwright) sur
`/offres/site-vitrine/` à 1440×900 (DPR 1) et 375×812 (DPR 2), clair puis sombre (thème posé
avant chargement par `j-ned:theme`), défilement jusqu'à la section, axe-core 4.13 injecté, clic
sur chaque lien. Aucune mesure Lighthouse (consigne du propriétaire). Serveur arrêté par
`fuser -k 4371/tcp`.

1. **HTML prérendu** : `site-vitrine` contient la section `offer-examples` avec 2 `offer-demo`
   (8 chemins `/demos/…`), `site-atelier` 1 carte (4 chemins). `application-metier`,
   `refonte-maintenance` et `renfort-freelance` n'ont ni section ni chemin `/demos/`, et aucune
   autre page du build ne cite `/demos/`. Les deux `<img>` : `src="/demos/<slug>-20261005-1600.webp"`,
   `width="1600"` `height="1000"` `loading="lazy"` `fetchpriority="auto"`, `alt` de la donnée.
   Les liens sont `target="_blank" rel="noopener"`, vers `https://coaching-life.nedellec-julien.fr/`
   puis `https://vieux-comptoir.nedellec-julien.fr/`.
2. **Garde CI** (`for page in site-atelier site-vitrine`) rejouée sous `bash -euo pipefail` :
   `site-atelier OK : 4 chemins`, `site-vitrine OK : 8 chemins`, exit 0. Contre-épreuve sur une
   copie du build sans `le-vieux-comptoir-20261005-800.avif` :
   `visuel de démo sans fichier : /demos/le-vieux-comptoir-20261005-800.avif`, exit 1.
3. **Visuels** : 8 fichiers `public/demos/{coaching-life,le-vieux-comptoir}-20261005-{800,1600}.{avif,webp}`.
   Dimensions lues dans les en-têtes (`ispe` AVIF, `VP8` WebP) : 1 600 × 1 000 et 800 × 500.
   Tailles de 17 501 à 71 010 o. Les captures montrent le bandeau « Site de démonstration »
   sur les deux sites.
4. **Runtime** (4 combinaisons largeur × registre ; décompte de cartes au rendu : vitrine 2,
   atelier 1, les trois autres 0) :

   | Largeur | Registre | Variantes chargées | CLS | axe | Liens (nom, hauteur) |
   |---|---|---|---|---|---|
   | 1440 | clair | `coaching-life-…-1600.avif`, `le-vieux-comptoir-…-1600.avif` | 0 | 0 | 2 noms distincts, 44 px |
   | 1440 | sombre | idem | 0 | 0 | idem |
   | 375 | clair | `…-800.avif` × 2 | 0 | 0 | idem |
   | 375 | sombre | `…-800.avif` × 2 | 0 | 0 | idem |

   - AVIF choisi par Chromium à chaque fois, `loading="lazy"` sur les deux images. Images
     rendues en 862 × 539 (1440) et 341 × 213 (375), ratio conservé. Badge « DÉMO » sur le
     visuel, mêmes couleurs que la T1 dans les deux registres.
   - Requêtes avant défilement : seul le **premier** visuel est demandé, le second l'est au
     défilement. À 375 px, le premier visuel commence à 2 014 px, sous le seuil de chargement
     anticipé de Chromium (812 + 1 250 = 2 062 px). Sur l'atelier, le visuel commençait à 2 074 px
     et restait hors du seuil. Ce n'est pas une préférence de chargement : l'image reste en
     `loading="lazy"` / `fetchpriority="auto"` et n'est pas préchargée.
   - Noms accessibles : « Voir la démo : Coaching Life, nouvel onglet » puis « Voir la démo : Le
     Vieux Comptoir, nouvel onglet ». Les deux clics ont été faits dans chaque combinaison. Chacun
     ouvre un nouvel onglet sur la bonne URL de démo, avec `window.opener` nul, et la page
     d'origine reste sur `/offres/site-vitrine`.
   - Console : les trois mêmes entrées qu'à la T1, préexistantes et dues au serveur statique
     local (`/api/config` en 404, `analytics/track` refusé par CORS depuis `localhost`). Aucune
     erreur liée à la section.

Verdict : **PASS**.

Captures (scratchpad de session, `t2/shots/`) :
`site-vitrine-{1440,375}-{light,dark}-examples.png`. Mesures runtime : `t2/verify.json`.

## Review code

### Tranche 1

**Verdict** : REJECTED
**Gates CI locaux** : install ✅ (`pnpm install --frozen-lockfile`, exit 0) / tests ✅ (`pnpm test`, exit 0, 107 fichiers / 1080 passed, après `ng cache clean` + purge `node_modules/.vite`) / lint ✅ (`pnpm lint`, exit 0, « All files pass linting ») / build ✅ (`pnpm run build --configuration production`, exit 0, 20 routes prérendues, CSP sur 21 pages, `Initial total` 582,94 kB / 144,71 kB, écart arbitré) ; `public/sitemap.xml` et `public/rss.xml` restaurés par `git checkout`
**Checks mécaniques** : checker non vendoré (`.claude/checks/` absent) : auto-checks joués à la main sur les fichiers du diff. Archéologie (motif du profil) 0 hit, aucun commentaire ajouté. `OnPush`, `@Input`/`@Output`, `styles:`, `ngAfterViewInit`, `export default`, `effect(` : 0 hit. U+00A0 ou U+202F bruts dans les gabarits : 0 (`&nbsp;` dans le seul `sr-only` du lien, ` ` échappé dans les données). Chaînes de démo (`Delaunay`, `site-industrie`, `/demos/`) hors `offer-pages.static-data.ts`, du modèle et des composants de la carte : 0 (seul `app.routes.ts:156`, la redirection historique `offre-site-industrie`, sans rapport).
**Warnings de gate** : aucun (test, lint et build relus en entier)
**Rendu compilé** : N/A (aucun sélecteur attribut ni `shared/ui/**` touché ; rendu observé au verify)
**Preuve de verify runtime** : ✅ (preuve `## Verify` complète, rejouée par la revue, cf. ci-dessous)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ✅
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ❌ (ADR-0007, point 1)

Contrôles de la revue :

- **Contrats et copie** : modèle du § 3 tel quel (`offer.model.ts:67-86`, `examples?` entre `deliverables` et `steps`) ; `demoPicture` dérive repli et dimensions de `DEMO_IMAGE_WIDTHS` ; copie de l'atelier égale mot pour mot au § 11 (titre, lead, secteur, phrase, `alt`, U+00A0 avant `:` et dans « »), `rel` exactement `noopener` (arbitrage 3) ; testids et ordre `source` AVIF, `source` WebP, `img` conformes au Plan de test.
- **Honnêteté** : badge dans le gabarit (`offer-demo-card.ts:18-23`, gabarit du badge), aucun booléen dans la donnée ; `toOfferSeo` ne lit pas `examples` (test `offer-seo.spec.ts:88`) ; HTML prérendu : section et chemins `/demos/` présents **uniquement** dans `offres/site-atelier/index.html` (absents de la home et des quatre autres offres) ; JSON-LD sans chaîne de démo.
- **`<picture>`** : `[attr.srcset]`/`[attr.sizes]` (écart au § 8, consigné au Journal) émettent bien les attributs dans le HTML prérendu ; l'`img` n'a ni `srcset` ni `sizes`, `loading="lazy"`, `fetchpriority="auto"`. Dev (`ng serve`, 375 DPR 2 et 3, 412 DPR 1,75, 1440 DPR 1 et 2, défilement molette) : **aucun NG029xx** ; variante chargée 800 ou 1600 AVIF selon la densité.
- **CI `verify`** : bloc rejoué tel quel (`bash -eo pipefail`) sur le build : exit 0. Contre-épreuves sur une copie du build : WebP 800 retiré ⇒ exit 1 « visuel de démo sans fichier : /demos/site-industrie-20261005-800.webp » ; testid retiré ⇒ exit 1 « section Exemples absente : site-atelier ». Le `ng-state` ne transporte pas `data.content` : seuls les 4 chemins avec extension sont extraits.
- **CI `docker`** : simulé avec la conf nginx extraite du `Dockerfile` (heredocs `HEADERS` et `NGINX` montés dans un conteneur nginx 1.31.6, `browser/` du build monté en lecture seule, port 3000) puis les cinq lignes ajoutées rejouées sous `set -euo pipefail` : `demo=/demos/site-industrie-20261005-800.avif`, `Content-Type: image/avif`, `Cache-Control: public, max-age=31536000, immutable`, en-têtes de sécurité présents ⇒ OK. Conteneur arrêté.
- **Verify runtime** (nginx ci-dessus, Chromium 1208 headless, 375 DPR 2 et 1440 DPR 1, clair et sombre) : page hydratée ; `h1` unique puis `h2` raisons, livrables, « Exemples », déroulé (`h3` d'étapes), tarif, FAQ : pas de saut ; à 375 aucune requête `/demos/` avant défilement, puis `…-800.avif` ; à 1440 `…-1600.avif` (dans le seuil lazy de Chromium) ; `img` 341 × 213 et 862 × 539 ; badge « DÉMO » opaque (`bg-background`/`text-foreground` dans les deux registres) ; lien 44 px de haut, `group "Delaunay Précision"`, nom accessible « Voir la démo : Delaunay Précision, nouvel onglet » ; **axe-core 4.13 : 0 violation** sur la page et sur la section, dans les 4 combinaisons ; clic : nouvel onglet sur `https://site-industrie.nedellec-julien.fr/`, `window.opener === null`, page d'origine inchangée. Console : uniquement `/api/config` 404 et CORS d'`analytics/track`, préexistants et dus à `localhost`. Aucun Lighthouse rejoué (consigne du propriétaire ; LCP et `Initial total` arbitrés).
- **DESIGN.md / DESIGN.json** : entrée « Carte de démo » conforme au § 7 et au code (badge, lien, une colonne, honnêteté) ; « Don't » ajouté dans les deux fichiers, à l'identique.

**Tests notables** :
- ✨ `src/app/features/offer/application/offer-page.spec.ts:158` : nom du lien vérifié par le texte complet **et** l'absence d'`aria-label`, ce qui verrouille WCAG 2.5.3.
- ✨ `src/app/features/offer/offer-seo.spec.ts:88` : garde d'honnêteté qui affirme d'abord ses 3 chaînes (`toHaveLength(3)`), donc ne passe pas à vide.
- ✨ `src/app/features/offer/domain/demo-picture.spec.ts:8` : `it.each` sur deux `file`, qui empêche un srcset codé en dur.

**Risque résiduel** (advisory, § 8) :
- réversibilité : profil muet (Dokploy continu sur `master`) · monitoring : Sentry
- aucun état persistant touché
- non couvert par les gates : LCP mobile simulé (+204 ms) et `Initial total` (+0,14 kB), arbitrés par le propriétaire, non remesurés ici ; la garde CI `verify` ne couvre que `site-atelier`, la T2 doit ajouter `site-vitrine` à la boucle (`ci.yml:79`).

**Points à corriger** :
1. `docs/adr/0007-images-statiques-versionnees-et-picture.md:50-51` : l'exemple de la décision 2 lie `[srcset]` et `[sizes]` en propriété sur les `<source>`, alors que le code (`offer-demo-card.ts:27-28` et `:33-34`) lie `[attr.srcset]`/`[attr.sizes]`, choisi pour que les attributs soient émis dans le HTML prérendu. Comme l'ADR est la référence d'une future image en `<picture>`, aligner l'exemple sur `[attr.srcset]`/`[attr.sizes]` et ajouter une puce qui dit pourquoi (attribut garanti au prérendu). Dans la même retouche, `:71-73` (Consequences) : la CI ne vérifie pas « chaque chemin d'image de `public/` cité dans le HTML prérendu », mais les chemins `/demos/` des pages d'offre listées dans `ci.yml`. Reformuler à cette portée réelle.

Point 1 corrigé après la revue (2026-10-05) : l'exemple de la décision 2 d'ADR-0007 lie
désormais `[attr.srcset]` / `[attr.sizes]`, avec une puce qui en donne la raison (attributs émis
au prérendu) ; les Consequences ramènent la garde CI à sa portée réelle (chemins `/demos/` des
pages d'offre listées dans `ci.yml`). Documentation seule : aucun code, test ni CI modifié.
**Verdict après correction : APPROVED.**

### Tranche 2

**Verdict** : REJECTED
**Gates CI locaux** : install ✅ (`pnpm install --frozen-lockfile`, exit 0) / tests ✅ (`pnpm test`, exit 0, 107 fichiers / 1100 passed, après `ng cache clean` + purge `node_modules/.vite`) / lint ✅ (`pnpm lint`, exit 0, « All files pass linting ») / build ✅ (`pnpm run build --configuration production`, exit 0, 20 routes prérendues, CSP sur 21 pages, `Initial total` 582,94 kB / 144,73 kB) ; `public/sitemap.xml` et `public/rss.xml` restaurés par `git checkout`
**Checks mécaniques** : checker non vendoré (`.claude/checks/` absent) : auto-checks joués à la main sur le diff. Archéologie (motif du profil) 0 hit. `export default`, `effect(`, `fakeAsync`/`waitForAsync`, `innerHTML`, `console.`, snapshot, boucle `for`/`forEach` génératrice d'`it` : 0 hit. U+00A0 brut dans les données : 6 (point 1).
**Warnings de gate** : aucun (test, lint et build relus en entier)
**Rendu compilé** : N/A (aucun sélecteur attribut ni `shared/ui/**` touché ; rendu observé au verify)
**Preuve de verify runtime** : ✅ (preuve `## Verify` complète, rejouée par la revue, cf. ci-dessous)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ✅
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ❌ (point 1 : le Journal décrit un encodage que le code ne suit pas)

Contrôles de la revue :

- **Copie** : les 7 valeurs de chaque démo de `site-vitrine` (id, nom, secteur, phrase, URL, `file`, `alt`) se retrouvent mot pour mot dans la spec, `&nbsp;` lu comme U+00A0 (comparaison scriptée). Les deux `alt` sont exactement ceux du § 11 avec « un bandeau Site de démonstration, » inséré après le deux-points, et rien d'autre. Titre et `lead` identiques à l'atelier. Les deux captures montrent bien ce que décrit leur `alt` (bandeau, titre, boutons, photo), et la barre d'adresse affiche `vieux-comptoir.nedellec-julien.fr`.
- **Ordre et ids** : `examples` entre `deliverables` et `steps` de `site-vitrine` (`offer-pages.static-data.ts:52`) ; Coaching Life puis Le Vieux Comptoir ; ids `coaching-life`, `le-vieux-comptoir`, distincts entre eux et des autres ids de l'offre (test des ids recalibré).
- **URLs** : `https://coaching-life.nedellec-julien.fr/` et `https://vieux-comptoir.nedellec-julien.fr/` (arbitrage 4).
- **Versionnement (ADR-0007)** : 8 fichiers `public/demos/{coaching-life,le-vieux-comptoir}-20261005-{800,1600}.{avif,webp}`, jamais publiés auparavant (pas de `-2` à prévoir, rien à supprimer). Dimensions relues par un script indépendant (`ispe` AVIF unique, en-tête `VP8 ` WebP) : 1600 × 1000 et 800 × 500 pour les 8. 17 501 à 71 010 o.
- **Tests modifiés** : la garde d'honnêteté exige d'abord ses 9 chaînes (`toHaveLength(9)`) puis les cherche dans le `SeoData` sérialisé de chacune des 5 offres (`offer-seo.spec.ts:88`) et dans `collectStrings(OFFERS)` : elle ne passe pas à vide. `DEMO_COUNT` est un `Record<OfferSlug, number>` littéral, exhaustif au typage. Recalibrages légitimes : les tables titres/décomptes gagnent la clé `examples` (valeur explicite `undefined` pour les 3 offres sans démo), le test des ids inclut les démos, le test SEO atelier est généralisé et non doublé. Aucun test resté sur l'ancienne valeur (`toHaveLength(3)` de la T1 remplacé ; grep `examples`/`offer-demo`/`/demos/` sur toute la suite).
- **CI `verify`** : bloc rejoué tel quel sous `bash -eo pipefail` sur le build : exit 0. Contre-épreuves sur une copie du build : `coaching-life-20261005-1600.webp` retiré ⇒ exit 1 « visuel de démo sans fichier : /demos/coaching-life-20261005-1600.webp », alors que **l'ancienne boucle** (`site-atelier` seul) rend exit 0 sur la même copie ; testid retiré de la vitrine ⇒ exit 1 « section Exemples absente : site-vitrine ». Le point de la Review code T1 est repris.
- **HTML prérendu** : `offer-demo` 2 / 1 / 0 / 0 / 0 (vitrine, atelier, application, refonte, renfort) ; chemins `/demos/` uniques 8 / 4 / 0 / 0 / 0 ; aucune autre page du build ne cite `/demos/`.
- **Verify runtime** (`python3 -m http.server 4381` sur `browser/`, Chromium 1208 headless, 1440 DPR 1 et 375 DPR 2, clair et sombre posés par `j-ned:theme`) : page hydratée ; décompte au rendu 2 / 1 / 0 / 0 / 0 ; `loading="lazy"`, `fetchpriority="auto"`, AVIF choisi (`…-1600.avif` à 1440, `…-800.avif` à 375), images 862 × 539 et 341 × 213 ; liens 44 px, `target="_blank"`, `rel="noopener"`, noms « Voir la démo : Coaching Life, nouvel onglet » puis « … Le Vieux Comptoir, … » ; **axe-core 4.10.2 (wcag2a/aa, 21a/aa, best-practice) : 0 violation** dans les 4 combinaisons ; clic sur chaque lien : popup sur `https://coaching-life.nedellec-julien.fr/` puis `https://vieux-comptoir.nedellec-julien.fr/`, `window.opener === null`, page d'origine restée sur `/offres/site-vitrine`. Console : seulement `/api/config` 404 et le CORS d'`analytics/track`, préexistants et dus au serveur local ; aucune `pageerror`. Aucun Lighthouse (consigne du propriétaire). Serveur arrêté par `fuser -k 4381/tcp`.
- **Démos en ligne** (curl, 2026-10-05) : les deux accueils répondent 200 avec `<meta name="robots" content="noindex">` et le bandeau « Site de démonstration. » dans le HTML servi. Condition de merge du plan (Risques) remplie pour les pages d'accueil.
- **Premier visuel demandé avant défilement à 375 px** : constaté (haut du visuel à 2 014 px, seuil lazy de Chromium 812 + 1 250 = 2 062 px ; même chose à 1440, visuel à 1 691 px). **Acceptable** : c'est le comportement natif du `loading="lazy"`, la requête reste en priorité basse, sans préchargement, après les ressources critiques ; 17,5 Ko (800 AVIF) ; l'élément LCP est le `h1`. Le contourner (observer maison, `loading` piloté par script) coûterait du code pour un gain non mesuré. Le risque est la même réserve qu'en T1 sur le LCP *simulé* de Lighthouse, non remesurée ici.

**Duplication / dérivation** (advisory) :
- ⚠️ `offer-seo.spec.ts:91-94` et `offer-pages.static-data.spec.ts:465-468` : même extraction `Object.values(OFFER_PAGES).flatMap(… [name, url, image.file])` à 2 sites. Sous le seuil bloquant ; candidate à un helper de test (`testing/`) si un troisième site apparaît.

**Tests notables** :
- ✨ `src/app/features/offer/application/offer-page.spec.ts:20` et `:356` : `DEMO_COUNT` littéral et typé `Record<OfferSlug, number>`, une nouvelle offre sans entrée casse la compilation.
- ✨ `src/app/features/offer/offer-seo.spec.ts:88` : garde généralisée aux 5 offres, ancrée sur 9 chaînes.

**Risque résiduel** (advisory, § 8) :
- réversibilité : profil muet (Dokploy continu sur `master`) · monitoring : Sentry
- aucun état persistant touché
- non couvert par les gates : `noindex` et bandeau vérifiés sur les pages d'accueil des démos seulement ; effet du premier visuel préchargé par le seuil lazy sur le LCP mobile simulé non mesuré (consigne).

**Points à corriger** :
1. `src/app/features/offer/domain/offer-pages.static-data.ts:65` et `:77` : les deux `alt` de la vitrine portent 6 U+00A0 **bruts** (3 par ligne), alors que les 14 autres insécables du fichier, dont l'`alt` de Delaunay (`:226`), sont écrits ` `. Le rendu est identique, mais un caractère invisible dans la source échappe à la relecture et se perd au premier copier-coller ; et le Journal de la T2 affirme « espaces insécables en ` ` comme l'atelier », ce qui est faux. Remplacer les 6 occurrences par ` ` (donnée seule, tests inchangés).

Point 1 corrigé après la revue (2026-10-05) : les 6 espaces insécables bruts des deux `alt` de la
vitrine sont écrits ` `, comme le reste du fichier (rendu identique). `pnpm test` 1100/1100,
`pnpm lint` et Prettier verts. **Verdict après correction : APPROVED.**
