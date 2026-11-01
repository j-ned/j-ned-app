---
id: 032
title: L'atelier, le métier de tourneur CN sur le site
type: feature
status: draft
created: 2026-10-21
related: [PRODUCT.md, specs/034-guide-plaquettes.md, DESIGN.md, specs/031-ton-amical.md, specs/033-nouveau-visuel.md, specs/030-adr-en-articles.md, docs/adr/0011-themes-du-blog-derives-du-catalogue-de-tags.md, docs/adr/0007-images-statiques-versionnees-et-picture.md, docs/adr/0024-rendu-a-la-requete-des-pages-de-contenu.md, docs/adr/0032-confidentialite-verifiable-du-contenu-d-atelier.md]
---

# 032 — L'atelier

## Description

### Objectif

Demande du propriétaire (2026-10-21) : donner une place au métier de Julien, **tourneur sur
commande numérique dans l'aéronautique**, mis en place **progressivement**. Le site le cite
aujourd'hui en une phrase (« Tourneur CN le jour, développeur web le reste du temps ») et par son
motif visuel (cartouche, cotes), mais ne montre rien du métier lui-même. Le ton est celui de la
spec 031 : amical, au tutoiement.

### Arbitrages (2026-10-21)

Les quatre volets sont retenus, livrés l'un après l'autre :

| Volet | Ce que c'est |
|---|---|
| V1 | **Page « L'atelier »** : le métier raconté (le tournage CN, l'aéronautique, les machines, une journée type), avec des photos si c'est possible |
| V2 | **Rubrique « Atelier » du blog** : des articles sur l'usinage (G-code, outils, tolérances, contrôle) |
| V3 | **Calculateur de conditions de coupe** : un outil interactif (vitesse de coupe, fréquence de rotation, avance) |
| V4 | **Pont usinage ↔ code** : le lien entre la rigueur de l'atelier et celle du code, rendu visible sur tout le site |

### Exigences communes

1. **Exactitude** : tout ce qui est dit du métier vient de Julien ou d'une source citée. Aucune
   donnée technique inventée (matières, vitesses, outils).
2. **Confidentialité** : rien qui puisse exposer l'employeur, ses clients, ses pièces ou ses plans
   (secteur aéronautique, souvent soumis à des clauses de confidentialité et à des contrôles
   d'export). Aucune photo de pièce client, aucune référence de programme ou de client.
3. **Mêmes standards que le reste du site** : rendu côté serveur, titre, description, canonical et
   données structurées ; WCAG AA (audit axe en CI) ; ton de la spec 031 ; verrou éditorial.
4. **Navigation** : l'atelier est atteignable depuis le menu principal dès qu'une page publique
   existe (aujourd'hui : Blog, Réalisations, Parcours).

### Exigences par volet

**V1 — Page « L'atelier »**

5. Une page publique (route à fixer, par exemple `/atelier`) qui explique le métier à un développeur
   qui n'a jamais vu un tour : ce que fait un tour CN, ce qu'est une cote et une tolérance, ce que
   change l'aéronautique (matières, exigences de contrôle), une journée type.
6. Le contenu vient de Julien. Les photos, si elles existent, sont des photos qu'il a le droit de
   publier (outillage personnel, atelier de formation, machine sans pièce client) ; images statiques
   versionnées selon ADR-0007.

**V2 — Rubrique « Atelier » du blog**

7. Un thème « Atelier » s'ajoute au catalogue de tags (ADR-0011), avec ses tags (par exemple
   G-code, Tournage, Tolérances, Métrologie) ; un thème vide reste masqué (ADR-0020).
8. Le premier article de la rubrique est écrit avec Julien (son sujet, ses exemples).

**V3 — Calculateur de conditions de coupe**

9. Un outil interactif dans le navigateur : à partir du diamètre et d'une vitesse de coupe, il donne
   la fréquence de rotation ; à partir de l'avance par tour, l'avance en mm/min. Formules du
   tournage : `n = 1000 × Vc / (π × D)` et `Vf = n × f`.
10. Les plages de vitesses par matière, si l'outil en propose, viennent d'une source que Julien
    valide (catalogue d'un fabricant d'outils, son expérience), affichées avec leur source et un
    avertissement : un calcul indicatif ne remplace ni les données de l'outil ni l'expérience.
11. Utilisable au clavier et au lecteur d'écran (champs étiquetés, résultat annoncé), sans appel
    d'API, résultats arrondis de façon lisible.

**V4 — Pont usinage ↔ code**

12. Le lien entre l'atelier et le code devient visible : renvois entre la page « L'atelier », la
    rubrique du blog et les articles techniques ; la règle de l'atelier (« une pièce hors tolérance
    ne part pas ») expliquée là où elle s'applique (tests, CI, accessibilité).

### Constat (2026-10-21, `master` `2e55a1a`)

- Menu principal (`layout/components/header/nav-items.ts`) : Blog, Réalisations, Parcours.
- Thèmes du blog (`blog-tag.model.ts`) : stack, security, engineering, journey, projects. Le thème
  « Parcours » contient déjà Industrie et Usinage n'y est pas.
- Accroche de l'accueil (`home.static-data.ts`) : « Tourneur CN le jour, développeur web le reste du
  temps. »
- Le brouillon A1 et les ADR citent déjà la règle de l'atelier.

### Découpage en PR (proposé)

| # | Dépôt | Périmètre | Dépend de |
|---|---|---|---|
| 1 | front | cette spec | — |
| 2 | front | plan technique (`architect`) du volet en cours | 1 |
| 3+ | front | un volet par PR (ou deux PR pour V3 : moteur de calcul, puis interface) | 2 |

Ordre retenu : **V1, V2, V3, V4**. V1 pose la page et l'entrée de menu « L'atelier » dont les autres
volets ont besoin ; V4 se fait au fil de l'eau une fois les trois premiers en ligne.

### Hors périmètre

- Simulateur de G-code, visualisation 3D de trajectoires d'outil : à rouvrir plus tard si l'envie
  est là.
- Toute donnée de l'employeur ou de ses clients.

### Arbitrages complémentaires (2026-10-21)

1. **Ordre** : V1 (page), V2 (rubrique du blog), V3 (calculateur), V4 (pont usinage ↔ code).
2. **Nom dans le menu** : « L'atelier ».

### Arbitrages (2026-10-25) : « L'atelier » devient un espace

Précision du propriétaire : « L'atelier » n'est pas une page de récit, c'est un **espace** où
s'ajoutent des éléments de métier, en plus de ce qui se raconte sur le blog. Cela remplace la
définition de V1 ci-dessus.

1. **V1 devient l'accueil de l'espace** (`/atelier`) : une **intro courte** (quelques lignes sur le
   métier), puis les **cartes des éléments** de l'atelier, puis les **derniers articles** de la
   rubrique « Atelier » du blog (V2) quand elle en a. Le récit détaillé prévu en sections (le tour,
   la cote, l'aéronautique, une journée type) n'est plus une page : chacun de ces sujets peut devenir
   une fiche (V5) ou un article (V2).
2. **Deux sortes d'éléments** :
   - les **outils interactifs**, développés dans le code, une spec ou un volet par outil : le guide
     des plaquettes (spec 034) est le premier, le calculateur de conditions de coupe (V3) suit ;
   - les **fiches métier**, du texte saisi par Julien dans l'admin, sans PR (nouveau volet V5).
3. **Ordre** : l'accueil de l'espace est livré avec le premier outil (spec 034), puisqu'il faut un
   endroit où le poser. V2, V3, V4 et V5 suivent, dans un ordre à revoir à chaque volet.

**V5 — Fiches métier saisies dans l'admin**

13. Julien crée, modifie, publie et dépublie des fiches depuis l'admin : un titre, un résumé et un
    corps de texte, sur le modèle de l'éditeur d'articles. Chaque fiche publiée a sa page sous
    `/atelier` et sa carte sur l'accueil de l'espace.
14. Les fiches ne contiennent **que du texte** dans ce volet. Une image de fiche demanderait une garde
    côté API équivalente à ADR-0032 §2 et §3 (sujet typé, date de vérification, métadonnées retirées) :
    à décider dans un volet à part.
15. Confidentialité : ADR-0032 §5 s'étend aux fiches. L'éditeur avertit avec
    `findConfidentialReferences` comme pour les articles, et c'est la publication par Julien qui fait
    office de case « confidentialité » (pas de PR pour une fiche).
16. Le volet demande une évolution de l'**API** (dépôt séparé : entité, routes d'admin et publiques),
    à livrer et déployer avant la PR front (CLAUDE.md, ordre de déploiement).

17. **Fiche ou article** (tranché par Julien le 2026-10-25) : une fiche est une **page de référence
    sans date**, que Julien met à jour au fil du temps (un lexique, l'explication du tour) ; un
    article est **daté et raconte**. Une fiche n'a donc ni date de publication affichée, ni place dans
    le flux RSS ni dans la liste du blog ; elle a sa place dans le sitemap. Les deux se renvoient l'un
    à l'autre quand le sujet s'y prête (V4). La différence justifie une entité distincte côté API
    (exigence 16) plutôt qu'un article mis en avant.

### Questions ouvertes

1. **Photos** : as-tu des photos que tu peux publier sans risque (outillage, poste sans pièce, atelier
   de formation) ? Ton employeur a-t-il une règle sur ce sujet ? (à trancher avant V1)
2. **Calculateur** : quelles matières et quelles sources pour les vitesses de coupe (fabricant
   d'outils, tes propres valeurs) ? Tournage seulement, ou aussi fraisage plus tard ? (à trancher
   avant V3)

## Plan technique — V1 (page « L'atelier »)

> **À réviser (2026-10-25)** : ce plan décrit la page de récit d'avant les arbitrages du 2026-10-25.
> Il reste valable pour la route `/atelier`, l'entrée de menu et de pied de page, le sitemap,
> `findConfidentialReferences` (tranche 3) et les vérifications. Sont caducs : les sections de récit
> (`WORKSHOP_PAGE.sections`, tranches 2 et 5, questions 3 à 6 et 8) et la décision 3 « pas d'admin
> ni d'API », remplacée par le volet V5. Le mode de rendu est à revoir : un accueil qui liste des fiches
> et des articles lus dans l'API relève du rendu à la requête (ADR-0024), pas du prérendu. Le plan
> révisé de l'accueil de l'espace est rédigé avec celui de la spec 034.
>
> **Remplacé (2026-10-25)** : l'accueil de l'espace est planifié dans le `## Plan technique` de
> `specs/034-guide-plaquettes.md` (prérendu tant qu'il ne lit pas l'API, rendu à la requête à
> l'arrivée de V2 ou V5). Il reprend d'ici la route, le menu, le pied de page, le sitemap et
> `findConfidentialReferences` ; le reste de ce plan n'est plus à implémenter.

Rédigé le 2026-10-22 sur `master` `4c54e0b` (spec 031 et `DESIGN.md` « Copeaux vifs » mergés, tokens
de la spec 033 pas encore implémentés). Profil lu : `.claude/project-profile.md`.

### Décisions structurantes

1. **Route `/atelier`, `RenderMode.Prerender`.** Le contenu est écrit dans le code et ne lit aucune
   API : c'est la catégorie « contenu écrit dans le code : prérendu au build » d'ADR-0024 (précédents :
   `mentions-legales`, `confidentialite`). Chemin en français comme les autres pages éditoriales
   écrites dans le code (`mentions-legales`) et comme le mot que le lecteur cherche ; aucune ancienne
   URL ne l'occupe (vérifié : ni route, ni location 410 dans le `Dockerfile`).
2. **Aucune location nginx à ajouter.** La page prérendue est servie par `location /`
   (`try_files $uri $uri/index.html =404`), comme les mentions légales ; la liste fermée de la
   location SSR (`^/(about|projects…|blog…)?/?$`) ne change pas, et le test
   `renders on request exactly the content routes and nothing else` reste vrai. Si un jour la page lit
   l'API (V4 ou plus tard), elle passe en `Server` **et** dans cette location.
3. **Contenu statique versionné dans le front**, dans une nouvelle feature `features/workshop/`
   (code en anglais, URL et libellés en français), domaine pur : `WORKSHOP_PAGE` dans
   `domain/workshop-page.static-data.ts`, précédents `home-hero.static-data.ts` et
   `project-outcomes.static-data.ts`. Pas d'admin ni d'API : chaque changement de contenu doit passer
   la garde de confidentialité et la case de Julien (ADR-0032 §4), ce qu'un commit garantit et un
   formulaire non. Pas de gateway (aucune I/O), pas de use case, pas de store, pas de presenter : la
   page est présentationnelle (données → gabarit, zéro dérivation hors `workshopPhotoSources`).
4. **Le texte métier vient de Julien, mot pour mot.** Ce plan fixe la structure et les emplacements,
   jamais une phrase métier. Aucun agent n'écrit de contenu sur le tournage, l'aéronautique, les
   matières ou les machines ; `angular-expert` recopie le texte fourni par Julien. Seules exceptions
   rédigées ici, à valider par Julien : titre et description SEO (métadonnées, § SEO) et libellés de
   navigation.
5. **Confidentialité vérifiable** : ADR-0032 (créé avec ce plan). Garde mécanique dans le dépôt
   (motifs de référence, photos typées, fichiers sans métadonnées), noms de l'employeur et des clients
   jamais écrits dans le dépôt, case « confidentialité » cochée par Julien sur la PR.
6. **La page tient sans photo.** Les visuels de V1 sont deux schémas SVG inline (le tour, la cote et
   sa tolérance), thémés par `currentColor`. Les photos sont une tranche conditionnelle (T7), livrée
   seulement si Julien en a de publiables.

### Architecture

```
app.routes.ts ── /atelier (loadComponent, data.seo, preload) ──► pages/workshop/workshop.ts (Workshop)
app.routes.server.ts ── { path: 'atelier', Prerender }               │ lit WORKSHOP_PAGE (domaine)
                                                                      ├─ en-tête : h1, chapô, cartouche « fiche » optionnel
                                                                      ├─ @for section ─► application/workshop-section.ts
                                                                      │                    └─ app-split-section (shared/ui)
                                                                      │                       paragraphes, étapes (ol), figure :
                                                                      │                       @switch kind ─► lathe-diagram.ts
                                                                      │                                    ─► tolerance-diagram.ts
                                                                      │                                    ─► workshop-photo.ts (T7)
                                                                      └─ « Pour aller plus loin » : 2 × a[app-link-card] (/about, /blog)
layout/header/nav-items.ts ── + « L'atelier » ; layout/footer ── + « L'atelier »
server/feeds/sitemap.ts ── + /atelier
```

- **Landmarks** : le shell (`App`, `Header`, `Footer`) garde le seul `main`, `banner` et
  `contentinfo`. La page n'émet ni `<main>`, ni `<header>`, ni `<footer>` à sa racine ; les
  `<header>` internes de `SplitSection` sont scopés à leur `<section>` (aucun landmark). Chaque section
  est une `<section aria-labelledby>` nommée par son `h2` (fourni par `SplitSection`).
- **Titres** : un seul `h1` (« L'atelier », `data-testid="workshop-title"`), puis un `h2` par section
  et un `h2` « Pour aller plus loin ». Aucun `h3` requis ; si Julien en veut dans une section, le
  modèle gagne un bloc dédié (pas de Markdown en V1).
- **Hydratation et `@defer`** : aucun `@defer`. Le contenu est principal, prérendu, sans widget
  lourd ; le chunk de la route est paresseux. L'ensemble reste hydraté (les `routerLink` des cartes
  et du menu naviguent côté client).
- **Pas de `@defer (hydrate never)`** non plus : il casserait la navigation client des cartes de
  lien, pour un gain nul (la page n'a aucun code lourd).

### Fichiers à créer / modifier

**Créer** (`src/app/features/workshop/`) :

- `domain/models/workshop-page.model.ts` : types du contenu (ci-dessous).
- `domain/workshop-page.static-data.ts` : `WORKSHOP_PAGE`, le texte de Julien.
- `domain/workshop-page.static-data.spec.ts` : invariants de structure du contenu (sans TestBed).
- `domain/confidential-references.ts` (+ `.spec.ts`) : `findConfidentialReferences(text): readonly
  string[]`, fonction pure (ADR-0032 §3).
- `domain/workshop-photo-sources.ts` (+ `.spec.ts`) : `workshopPhotoSources(basename)` →
  `{ avifSrcset, webpSrcset, fallbackSrc }` (T7 seulement).
- `pages/workshop/workshop.ts` (+ `.spec.ts`) : la page (`Workshop`, `app-workshop`).
- `application/workshop-section.ts` (+ `.spec.ts`) : une section, dumb (`input.required<WorkshopSection>()`).
- `application/lathe-diagram.ts` (+ `.spec.ts`) : schéma du tour, dumb (`input.required<LatheDiagramFigure>()`).
- `application/tolerance-diagram.ts` (+ `.spec.ts`) : schéma de la cote, dumb.
- `application/workshop-photo.ts` (+ `.spec.ts`) : `<picture>` ADR-0007 (T7 seulement).
- `testing/workshop-section.builder.ts` : builder de `WorkshopSection` et des figures pour les specs
  (dossier `testing/` exclu du verrou anti-vouvoiement par `TEST_DATA`).

**Créer** (racine) :

- `src/app/app.routes.workshop.spec.ts` : route, titre, SEO (précédent `app.routes.about.spec.ts`).
- `src/app/workshop-confidentiality.spec.ts` : garde ADR-0032 sur `WORKSHOP_PAGE` et `public/workshop/`
  (lecture `node:fs`, précédent `editorial-identity.spec.ts`).
- `docs/adr/0032-confidentialite-verifiable-du-contenu-d-atelier.md` (fait avec ce plan).

**Modifier** :

- `src/app/app.routes.ts` : constante `WORKSHOP_TITLE`, route `atelier` (`loadComponent`,
  `title`, `data: { preload: true, seo }`).
- `src/app/app.routes.server.ts` (+ `app.routes.server.spec.ts`) : `{ path: 'atelier', renderMode:
  RenderMode.Prerender }` dans le bloc « Contenu écrit dans le code ».
- `src/app/layout/components/header/nav-items.ts` (+ `header.spec.ts`) : entrée « L'atelier ».
- `src/app/layout/components/footer/footer.static-data.ts`, `footer.ts` (+ `footer.spec.ts`) : lien
  « L'atelier » dans Ressources.
- `src/server/feeds/sitemap.ts` (+ `sitemap.spec.ts`) : `/atelier` dans `STATIC_URLS`.
- `src/app/testing/editorial-sources.ts` : `['WORKSHOP_PAGE', WORKSHOP_PAGE]` dans `EDITORIAL_SOURCES`.
- `src/app/editorial-identity.spec.ts` : la page et ses données dans la liste `reads %s`.
- `e2e/a11y/scenarios.ts` : `{ path: '/atelier', ready: 'workshop-title' }` dans `PUBLIC_PAGES`.
- `.github/workflows/ci.yml` : job `verify`, `test -f $browser/atelier/index.html` ; job `docker`,
  `/atelier` répond 200 et contient `data-testid="workshop-title"` (corps écrit dans un fichier puis
  `grep`, comme `/about/`) ; en T7, garde « chaque chemin `/workshop/` du HTML prérendu existe dans
  `dist/` » (extension prévue par ADR-0007, Conséquences).
- `DESIGN.md` § 5 : entrée « Page L'atelier » (gabarit, schémas, règle des cotes de schéma ci-dessous).

### Modèles de données

`domain/models/workshop-page.model.ts`, `type` immuables, unions discriminées :

```ts
export type WorkshopSectionId = 'lathe' | 'tolerance' | 'aeronautics' | 'day';
export type WorkshopStep = { readonly label: string; readonly text: string };
export type WorkshopFact = { readonly label: string; readonly value: string };

export type LatheDiagramFigure = {
  readonly kind: 'lathe-diagram';
  readonly caption: string;      // légende visible (figcaption)
  readonly description: string;  // alternative textuelle complète (aria-label du svg)
  readonly labels: { readonly spindle: string; readonly chuck: string; readonly part: string;
                     readonly tool: string; readonly zAxis: string; readonly xAxis: string };
};
export type ToleranceDiagramFigure = {
  readonly kind: 'tolerance-diagram';
  readonly caption: string;
  readonly description: string;
  readonly labels: { readonly nominal: string; readonly tolerance: string;
                     readonly lowerLimit: string; readonly upperLimit: string };
};
export type PhotoSubject = 'personal-tooling' | 'training-workshop' | 'machine-without-part';
export type WorkshopPhotoFigure = {
  readonly kind: 'photo';
  readonly basename: string;     // `<slug>-<AAAAMMJJ>`, sans largeur ni extension (ADR-0007)
  readonly width: number;        // intrinsèques du fichier 1600 w
  readonly height: number;
  readonly alt: string;
  readonly caption: string;
  readonly subject: PhotoSubject;  // ADR-0032 §2 : pas de membre « pièce », ne compile pas
  readonly clearedOn: string;      // AAAA-MM-JJ, vérification de Julien
};
export type WorkshopFigure = LatheDiagramFigure | ToleranceDiagramFigure | WorkshopPhotoFigure;

export type WorkshopSection = {
  readonly id: WorkshopSectionId;
  readonly heading: string;
  readonly summary: string;                          // résumé de SplitSection, '' accepté
  readonly paragraphs: readonly [string, ...string[]];  // au moins un paragraphe, par le compilateur
  readonly steps?: readonly WorkshopStep[];          // la journée type, en liste ordonnée
  readonly figure?: WorkshopFigure;
};

export type WorkshopPage = {
  readonly heading: string;                          // « L'atelier »
  readonly lead: string;                             // chapô
  readonly sheet?: { readonly title: string; readonly reference: string;
                     readonly rows: readonly WorkshopFact[] };  // cartouche « fiche » optionnel
  readonly sections: readonly WorkshopSection[];
  readonly furtherReading: {
    readonly heading: string;
    readonly about: { readonly overline: string; readonly heading: string };
    readonly blog: { readonly overline: string; readonly heading: string };
  };
};
```

- **Compile-time d'abord** : section sans paragraphe (tuple non vide), photo sans sujet ou avec un sujet
  hors liste, figure de nature inconnue : refusés par le compilateur. Restent au runtime (tests du
  domaine) : unicité et ordre des `id`, `basename` daté (`/-\d{8}$/u`), `clearedOn` au format
  `AAAA-MM-JJ`, textes non vides.
- `WorkshopFact` a la forme de `CartoucheRow` (`shared/ui/cartouche.ts`) sans l'importer : le domaine
  n'importe pas `shared/ui` (même règle que `HOME_HERO_STICKER_LABEL`, spec 033).
- Les `href` des cartes (`/about`, `/blog`) restent dans le gabarit de la page, pas dans les données :
  ce sont des routes, pas du contenu.
- Validation aux frontières : sans objet (aucune frontière d'I/O ; contenu typé à la compilation).

### Gabarit et composants

- **Page `Workshop`** : `host: { class: 'block min-h-svh pt-20' }` (précédent `About`). En-tête dans
  `page-container` : `h1` avec la liste de classes du `h1` de `/projects` et `/blog`
  (`text-[clamp(2.75rem,6vw,5.25rem)] font-extrabold leading-none tracking-[-0.04em]`), chapô
  `text-muted`. Quatrième occurrence de cette liste sur un `h1` natif : candidate à un `@utility
  page-title` (ADR-0003), **pas** dans cette PR (les trois autres fichiers sont dans l'inventaire de la
  PR 6b de la spec 033, qui retouche aussi la police des titres) ; signalé à la PR 6b. `@if (page.sheet)` : `app-cartouche`
  (`title`, `reference`, `rows`) à droite à partir de `lg`, empilé dessous en mobile ; c'est **le**
  cartouche décoratif de l'écran (règle `DESIGN.md`). Puis `@for (section of page.sections; track
  section.id)` → `<app-workshop-section [section]="section" data-testid="workshop-section" />`. Puis
  `<section aria-labelledby="workshop-further">` avec `h2` et deux `a[app-link-card]` (`routerLink`
  `/about` et `/blog`, `data-testid` `workshop-further-about` / `workshop-further-blog`).
- **`WorkshopSection`** : enveloppe `app-split-section` (`heading`, `headingId` = `workshop-<id>`,
  `summary`) ; contenu : paragraphes en `<p>` (classe de lecture des pages éditoriales, `max-w-prose`) ;
  `@if (section.steps?.length)` → `<ol data-testid="workshop-steps">` (`li` : libellé en
  `font-semibold`, texte) ; `@if (section.figure; as figure)` → `@switch (figure.kind)` vers le schéma
  ou la photo, dans un `<figure data-testid="workshop-figure">` + `<figcaption>`.
- **Schémas SVG** (`LatheDiagram`, `ToleranceDiagram`) :
  - `<svg role="img" [attr.aria-label]="figure.description" viewBox="0 0 400 H">`, `<text>` des
    libellés en `fill="currentColor"` ; enfants présentationnels sous `role="img"`, l'alternative est
    l'`aria-label`, la légende visible est la `figcaption` (pas de doublon : description ≠ légende).
  - **Lisibilité mobile, calculée** : largeur utile à 375 px = 375 − 2 × 16 = 343 px ; facteur
    d'échelle = 343 / 400 = 0,8575 ; un texte de 14 unités rend 14 × 0,8575 = 12,0 px. Règle :
    `viewBox` de 400 unités de large au plus, texte ≥ 14 unités ; sur grand écran, `max-w-[32rem]`
    (512 px, facteur 1,28, texte 17,9 px). Un `viewBox` de 480 tomberait à 10,0 px : refusé.
  - **Couleurs** : traits porteurs et texte en `currentColor` sur `text-foreground` ; l'accent
    (`text-primary`, traits de cote et flèche d'axe) seulement pour ce qui se mesure. Aucune couleur en
    dur, aucun remplissage porteur d'information (en `forced-colors`, `currentColor` suit `CanvasText`).
    Contrastes : hérités des tokens (texte ≥ 4,5:1, objets graphiques ≥ 3:1, cf. `DESIGN.md` § 2) ;
    l'audit axe vérifie le texte, la revue vérifie les traits (axe ne mesure pas un trait de SVG).
  - **Cotes de schéma** : dessinées dans le SVG, ce sont du **contenu** (l'information est la cote),
    pas l'`app-dimension-line` décorative réservée aux délais et durées. À écrire dans `DESIGN.md`.
  - Géométrie et libellés validés par Julien (exigence 1) : le dessin est une simplification
    pédagogique, la légende le dit si Julien le souhaite.
- **Tokens** : uniquement des tokens et composants présents sur `master` (`text-primary`,
  `text-muted`, `text-foreground`, `bg-surface`, `border-line`, `page-container`, `section-title`,
  `SplitSection`, `LinkCard`, `Cartouche`). **Aucune dépendance** à `rounded-part`, `rounded-card`,
  `bg-sticker-*` ni `app-sticker` (spec 033, PR 4 à 6, pas encore mergées) : la page n'a pas
  d'autocollant en V1 ; elle hérite du restylage de la spec 033 par les composants partagés, et ses
  classes brutes (`rounded-*`, `border-foreground/*`) entrent dans l'inventaire de la PR 6b.

### Navigation

- `NAV_LINKS` : `{ label: "L'atelier", href: '/atelier', icons: 'lucide-wrench' }`, **en dernier**
  (Blog, Réalisations, Parcours, L'atelier). L'icône existe déjà (`icon-map.ts` → `solid-wrench`,
  présente dans `public/icons/sprite.svg`) : pas de `pnpm icons:build`.
- **Noms accessibles distincts** : « Parcours » et « L'atelier » ne partagent aucun mot ; le titre de
  `/about` (« Parcours : de l'atelier au code ») n'est pas un nom de lien. Apostrophe droite `'`,
  comme les autres libellés (`M'écrire`).
- **Mobile** : le drawer lit `NAV_LINKS`, l'entrée y apparaît sans changement de gabarit ; cible de
  44 px déjà tenue (`py-2.5` + `text-lg`). Le scénario axe `open mobile menu` la couvre.
- **Desktop** : quatre liens à partir de `lg` (1 024 px). Estimation, à vérifier à l'œil en Verify
  à 1 024 px : une ligne sans retour (sinon `gap-6` → `gap-5`).
- **Pied de page** : `FOOTER_COPY.resources.workshop = "L'atelier"`, lien après « Parcours ».

### SEO

- `WORKSHOP_TITLE = "L'atelier : le métier de tourneur CN | Julien Nédellec"` (54 caractères,
  calculé ; espace insécable avant `:` exigée par le verrou typographique).
- Description proposée, **à valider par Julien** : « Le tournage sur commande numérique expliqué à un
  développeur : le tour CN, les cotes et les tolérances, ce que change l'aéronautique, une journée
  type. » (151 caractères avec l'espace insécable, calculé ; plafond 160 testé).
- `url: ${SITE_IDENTITY.siteUrl}/atelier` → `canonical` et `og:url` par `Seo.applySeoData` ;
  `type: 'website'` ; pas de `keywords` (précédent des pages légales) ; image de partage par défaut
  (aucun visuel dédié en V1).
- **JSON-LD** : `BreadcrumbList` Accueil → L'atelier, même forme que `/about` et `/projects`. Pas de
  `WebPage` ni d'`Occupation` : aucun résultat enrichi n'en dépend, et une `Occupation` demanderait des
  données (code métier, qualification) que la spec interdit d'inventer.
- **Sitemap** : `{ path: '/atelier', changefreq: 'monthly', priority: '0.8' }` juste après `/about`
  (même poids que le parcours, public secondaire).
- Le `<head>` est émis au prérendu (`Seo.applySeoData` câblé dans `app.config.ts` sur `data.seo`) : aucune API
  navigateur seule.

### Images

- **Sans photo (défaut)** : deux schémas SVG inline, aucun fichier dans `public/`, rien à versionner.
- **Avec photos (T7)** : `public/workshop/<slug>-<AAAAMMJJ>-<800|1600>.<avif|webp>` (ADR-0007
  décision 1), `<picture>` + `NgOptimizedImage` sur l'`<img>` de repli (`fallbackSrc` = variante
  1 600 WebP, `width`/`height` intrinsèques), `loading` paresseux par défaut, **jamais** `priority` (le
  LCP de la page est le `h1`, aucune photo au-dessus de la ligne de flottaison). `sizes` :
  `(min-width: 1024px) 40rem, 100vw` (colonne de contenu de `SplitSection`).
- **Règles de confidentialité vérifiables** (ADR-0032) : sujet fermé et `clearedOn` dans le type ;
  fichiers sans EXIF ni XMP (test) ; export documenté dans la PR (`exiftool -all=` puis `cwebp
  -metadata none` / `avifenc` sans `--exif`/`--xmp`) ; liste de vérification humaine cochée par Julien
  (aucune pièce, aucun plan ni écran de commande, aucun logo, badge, plaque d'inventaire, enseigne ni
  vue qui situe l'atelier, aucun visage sans accord).

### Tests

- **Verrous existants, portée vérifiée** :
  - Anti-vouvoiement sur fichiers : `PUBLIC_ROOT` = `^(?:core|pages|layout|shared|features\/(?!admin\/|auth\/)[^/]+)\/`
    → `features/workshop/**/*.ts` (hors `.spec.ts` et `testing/`) est lu **automatiquement**.
  - Typographie, formulations interdites, vouvoiement sur données : portent sur `EDITORIAL_SOURCES`,
    liste **explicite** → `WORKSHOP_PAGE` y est ajouté (sinon le contenu n'est pas vérifié). Les
    `routes` y sont déjà : titre et description SEO de `/atelier` sont couverts sans ajout.
  - Formulations interdites qui touchent directement ce contenu : « métallurgie », « 20 ans »,
    « vingt ans », « Je suis tourneur CN », « aujourd'hui tourneur CN en », « jour N » (`jours? \d`),
    « CDI », « missions ». À communiquer à Julien avant qu'il écrive.
- **Domaine, sans TestBed** : invariants de `WORKSHOP_PAGE` (ids uniques et dans l'ordre `lathe`,
  `tolerance`, `aeronautics`, `day` ; titres et paragraphes non vides ; étapes non vides si présentes) ;
  `findConfidentialReferences` en `it.each` des deux côtés (exemples d'ADR-0032 §3 : signale `P/N
  4521-07`, `PN: 88-123`, `réf. pièce`, `plan n° 12`, `n° de plan`, `OF n° 3`, `indice C`, `D23456789` ;
  ne signale pas `AS9100`, `EN 9100`, `ISO 2768`, `Inconel 718`, `Ti-6Al-4V`, `7075-T6`,
  `Ø20 ±0,02`, `G71`, `M30`, `10 000 tr/min` avec espace fine insécable).
- **Composants (TestBed, `setInput`, `data-testid` seulement)** : la page rend un `h1`, autant de
  `workshop-section` que `WORKSHOP_PAGE.sections` (test agnostique du texte : il lit la constante),
  chaque `<section>` nommée par un `h2` existant (`aria-labelledby` résolu), aucun `main`, `header`
  racine ni `footer` émis par la page, les deux cartes pointent vers `/about` et `/blog` ;
  `WorkshopSection` via builder : paragraphes, `ol` d'étapes seulement si présentes, figure selon
  `kind`, aucune `figure` sans figure ; schémas : `role="img"`, `aria-label` = `description`,
  libellés rendus, `figcaption` = `caption`.
- **Axe (job `a11y`)** : scénario `/atelier` prêt sur `workshop-title`, clair et sombre (boucle
  `THEMES` existante) ; le menu mobile ouvert (scénario existant) audite la nouvelle entrée.

### Tranches

Prérequis hors TDD : le texte de Julien pour la tranche concernée (questions ci-dessous). Une tranche
peut s'implémenter sur un brouillon **écrit par Julien** ; la PR reste en brouillon tant que le texte
final et la case « confidentialité » ne sont pas validés par lui.

Le modèle grandit avec les tranches : chaque tranche n'ajoute que les champs et membres d'union
qu'elle rend (`furtherReading` en T6, figures en T5, photo en T7).

- **Tranche 1 — la page existe et se trouve** : modèle (`heading`, `lead`, `sections` vide à ce
  stade), `WORKSHOP_PAGE` (titre, chapô), page `Workshop` (`h1`, chapô), route `atelier` lazy +
  `data.seo` (titre, description ≤ 160, canonical, fil d'Ariane), `Prerender` dans
  `app.routes.server.ts`, `/atelier` dans le sitemap, `EDITORIAL_SOURCES`, scénario axe, gardes CI
  (`atelier/index.html` prérendu, 200 dans l'image). Tests : `app.routes.workshop.spec`,
  `app.routes.server.spec`, `sitemap.spec`, `workshop.spec` (h1, landmarks).
- **Tranche 2 — les sections racontent le métier** : `WorkshopSection` sur `SplitSection`,
  paragraphes, étapes en `ol`, les quatre sections dans `WORKSHOP_PAGE` ; invariants du domaine.
- **Tranche 3 — une référence de pièce ne peut pas partir** : `findConfidentialReferences` et
  `workshop-confidentiality.spec.ts` sur tout le texte de `WORKSHOP_PAGE`.
- **Tranche 4 — on y arrive depuis le menu et le pied de page** : `NAV_LINKS`, `FOOTER_COPY`,
  `footer.ts` ; `header.spec`, `footer.spec`.
- **Tranche 5 — le tour et la cote se voient** : `LatheDiagram`, `ToleranceDiagram`, union
  `WorkshopFigure`, `@switch` dans `WorkshopSection`, figures des sections `lathe` et `tolerance`.
- **Tranche 6 — pour aller plus loin** : section de liens vers `/about` et `/blog` (`LinkCard`),
  cartouche « fiche » si Julien en fournit les lignes, entrée `DESIGN.md`.
- **Tranche 7 (conditionnelle) — les photos** : seulement si Julien a des photos publiables.
  `WorkshopPhotoFigure`, `workshopPhotoSources`, `WorkshopPhoto`, fichiers `public/workshop/`, garde
  EXIF/XMP et existence des fichiers, garde CI des chemins `/workshop/`. Sans photo : tranche non
  ouverte, le type `photo` n'est pas ajouté (YAGNI), et ADR-0032 §2 s'applique le jour où il l'est.

### Vérifications (Verify)

- Gates du Dockerfile (`pnpm install --frozen-lockfile`, `pnpm run build --configuration
  production`), `pnpm lint`, `pnpm test` (lire `$?`), `pnpm run format:check`, job `a11y`.
- `dist/angular-portfolio-app/browser/atelier/index.html` contient le `h1`, le titre, la
  description, le `canonical` et le JSON-LD ; CSP sans `'unsafe-inline'` (garde CI existante).
- Image Docker : `curl -I /atelier` et `/atelier/` → 200, servis par nginx sans réveiller Node.
- À l'œil : 375 px (schémas lisibles, pas de défilement horizontal), 1 024 px (menu sur une ligne),
  clair et sombre, `forced-colors` (traits des schémas visibles).
- Production après merge : `/atelier` 200, sitemap qui la liste, Lighthouse mobile > 95.

### Risques & inconnues

- **Contenu bloquant** : rien ne se merge sans le texte de Julien ; un détail anodin peut identifier
  un client (forme, matière + secteur + région) : la garde ne voit que la forme, la case de Julien
  porte le fond (ADR-0032 §4).
- **Spec 033 en parallèle** : la PR 6b recalcule son inventaire de gabarits publics ; si V1 merge
  avant, ses fichiers y entrent. Ordre de merge à annoncer si les deux PR touchent `header.ts`
  ou `footer.ts` (PR 6b : pilule de navigation, `footer-heading`).
- **Faux positifs de la garde** : un nombre de 5 chiffres sans espace ou un numéro de bloc G-code
  (`N10010`) casse `pnpm test` ; réglé par la typographie (espace fine) en V1, à rouvrir en V2.

### Questions à Julien (avant la tranche 1, sauf mention)

1. **Photos** (question ouverte 1, toujours bloquante pour T7) : en as-tu de publiables (outillage
   perso, atelier de formation, machine sans pièce) ? Ton employeur a-t-il une règle écrite sur les
   photos ou sur le fait de parler de ton poste en ligne ? Sans réponse : pas de photo, T7 non ouverte.
2. **Chapô** (T1) : deux ou trois phrases qui disent ce qu'est la page et à qui elle parle.
3. **« Ce que fait un tour CN »** (T2, T5) : comment tu l'expliquerais à un développeur ; quelles
   pièces du tour tu veux nommer sur le schéma (broche, mandrin, outil, tourelle, axes X et Z…).
4. **« Une cote, une tolérance »** (T2, T5) : ton exemple de cote (valeur nominale et tolérance
   d'exemple, pas celle d'une vraie pièce) ; veux-tu y placer la règle « une pièce hors tolérance ne
   part pas » dès V1, ou la garder pour V4 ?
5. **« Ce que change l'aéronautique »** (T2) : ce que tu acceptes de dire des matières, du contrôle
   et de la traçabilité, sans rien qui situe ton employeur ou ses clients.
6. **« Une journée type »** (T2) : les étapes (libellé court + une ou deux phrases chacune), avec ou
   sans horaires.
7. **Fiche** (T6, optionnelle) : un cartouche « fiche de poste » en tête (métier, secteur, type de
   machine…) te parle-t-il ? Si oui, quelles lignes ; une marque ou un modèle de machine reste-t-il
   anodin pour toi ?
8. **Glossaire** (optionnel) : veux-tu une section de mots du métier (broche, plaquette, avance…) ?
   Elle ajouterait un id `glossary` et un bloc `dl` au modèle.
9. **Titre et description SEO, ordre du menu** : valides-tu le titre, la description proposée et
   « L'atelier » en dernier dans le menu ?
