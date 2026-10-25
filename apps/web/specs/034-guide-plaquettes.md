---
id: 034
title: Guide des plaquettes, de la matière à l'outil de coupe
type: feature
status: draft
created: 2026-10-25
related: [specs/032-atelier.md, specs/031-ton-amical.md, PRODUCT.md, DESIGN.md, docs/adr/0004-contenu-statique-de-feature-sans-gateway.md, docs/adr/0024-rendu-a-la-requete-des-pages-de-contenu.md, docs/adr/0032-confidentialite-verifiable-du-contenu-d-atelier.md, docs/adr/0033-referentiel-d-usinage-source-par-le-type.md]
---

# 034 — Guide des plaquettes

## Description

### Objectif

Demande du propriétaire (2026-10-25) : un outil de l'atelier (spec 032) qui guide le choix d'un
outil de coupe en tournage. On tape le début du nom d'une matière, le guide propose les matières
connues ; on choisit la matière puis l'opération, et le guide indique le **type** de plaquette à
utiliser, avec ce qu'il faut savoir pour bien usiner cette matière. Public : des devs et des curieux
(PRODUCT.md), mais aussi des usineurs débutants ; ton de la spec 031, au tutoiement.

### Parcours

1. **Matière** : un champ de saisie avec suggestions. La recherche porte sur toutes les désignations
   d'une matière (EN, numéro matière, AISI/UNS, ancienne AFNOR, nom courant), sans tenir compte de
   la casse, des espaces, des tirets ni des accents : `42cd4`, `4140` et `1.7225` trouvent toutes
   `42CrMo4`. Le choix affiche le groupe ISO 513 (lettre, couleur, nom) et le comportement de la
   matière à la coupe.
2. **Opération**, regroupée par famille :

   | Famille | Opérations |
   |---|---|
   | Tournage extérieur | ébauche, semi-finition, finition |
   | Intérieur (alésage) | ébauche, finition |
   | Gorge et tronçonnage | gorge, tronçonnage |
   | Filetage | filetage |
   | Perçage | perçage au foret à plaquettes |

3. **Recommandation** pour le couple matière × opération :
   - le type de plaquette. En tournage extérieur et intérieur, c'est un code de désignation ISO
     partiel (forme, dépouille, rayon de bec…) dont chaque champ est expliqué. En gorge,
     tronçonnage, filetage et perçage, les plaquettes ne suivent pas cette désignation : elles sont
     décrites par leur type (largeur, profil, nombre d'arêtes, système de fixation) ;
   - la géométrie (brise-copeaux, préparation d'arête) et la nuance, **décrites avec des mots**,
     jamais par un nom commercial ;
   - une plage de vitesse de coupe indicative quand la source en donne une ;
   - les pièges propres à la matière (écrouissage, arête rapportée, usure en entaille…) ;
   - la source de chaque information et un avertissement : la recommandation est indicative et ne
     remplace ni le catalogue de l'outil ni l'expérience.

### Exigences

1. **Exactitude (exigence 1 de la spec 032)** : chaque donnée affichée porte sa source. Une
   recommandation sans source n'existe pas dans le référentiel. Aucune donnée inventée : une
   combinaison matière × opération sans recommandation sourcée l'affiche franchement (« pas encore
   de recommandation pour ce cas ») plutôt que d'extrapoler.
2. **Sources** :
   - matières, groupes ISO 513, correspondances de désignations et comportement : les tables de
     classification et de correspondance des matières de Sandvik Coromant. Le « Référentiel des
     alliages d'usinage » fourni par Julien a été produit par une IA (Gemini) : il sert de liste de
     départ, chaque valeur est vérifiée dans la source citée avant d'entrer dans le référentiel, et
     il n'est jamais cité comme source ;
   - recommandations d'outils par matière et opération : le **catalogue Sandvik Coromant**, cité
     sur chaque fiche ;
   - désignation des plaquettes : la norme ISO 1832, via la page « désignation » du catalogue
     Sandvik Coromant.
3. **Confidentialité (spec 032, ADR-0032)** : aucune donnée de l'employeur ni de ses clients. Les
   noms d'alliages, de normes et les valeurs de coupe génériques sont autorisés.
4. **Accessibilité** : le champ à suggestions est utilisable au clavier (flèches, Entrée, Échap) et
   annoncé au lecteur d'écran (nombre de suggestions, suggestion active) ; la recommandation est
   annoncée quand elle change ; aucune information portée par la seule couleur du groupe ISO.
5. **Rendu et SEO** : page publique rendue côté serveur, sans appel d'API ; la saisie (matière,
   opération) se reflète dans l'URL pour partager une fiche ; titre, description et canonical
   comme le reste du site.
6. **Lien avec la spec 032** : le guide vit sous « L'atelier ». La plage de vitesse affichée
   pré-remplit le calculateur de conditions de coupe (V3) quand celui-ci existe.

### Constat (2026-10-25, `master` `5c2e228`)

- **Référentiel des alliages** (3 pages) : 6 groupes ISO 513, une trentaine de matières avec
  correspondances EN / numéro / AISI-UNS / AFNOR, usinabilité et applications. Correspondances
  contrôlées par sondage (C45 1.0503, 42CrMo4 1.7225 / 4140, 316L 1.4404, 17-4 PH 1.4542,
  TA6V R56400 / 3.7165, Inconel 718 N07718 / 2.4668…) : aucun écart trouvé. Trois passages sont
  **coupés au saut de page** : les règles d'or du groupe P, la fin du tableau des aluminiums (série
  5000 et suivantes, cuivreux, laitons, bronzes), et les repères de vitesse des groupes S et H.
  Le document ne contient **aucune recommandation de plaquette par opération**.
- **Fiche de codification des plaquettes** : affiche de la boutique « Un Petit Usineur », offerte en
  téléchargement sur sa page « Guide complet : tout savoir sur la désignation des plaquettes de
  tournage » (copyright 2026, aucune condition de réutilisation, aucune source citée). Elle cite
  « ISO 1853 », alors que la désignation des plaquettes amovibles relève de l'ISO 1832 ; son tableau
  des angles de dépouille donne deux valeurs pour les lettres D, E et P. Ni l'affiche ni la page ne
  donnent de recommandation par matière ou par opération. Elle ne sert donc pas de source et rien
  n'en est recopié ; la désignation est reprise de Sandvik Coromant.
- La page « L'atelier » (V1 de la spec 032) a son plan technique (PR #256) mais n'est pas encore
  implémentée : la route `/atelier` n'existe pas.

### Découpage en PR (proposé)

| # | Périmètre | Dépend de |
|---|---|---|
| 1 | cette spec | — |
| 2 | plan technique (`architect`) de l'accueil de l'espace et du guide | 1 |
| 3 | accueil `/atelier` (intro courte, carte du guide, menu et pied de page) | 2 |
| 4 | référentiel des matières et recherche (domaine pur, sans interface) | 2 |
| 5 | interface : champ à suggestions, choix de l'opération, fiche matière | 3, 4 |
| 6+ | recommandations, une famille d'opérations par PR, au rythme de la saisie des données sourcées | 5 |

### Hors périmètre

- Fraisage.
- Références commerciales, prix, liens d'achat.
- Conditions de coupe complètes (profondeur de passe, avance) au-delà de ce que donne la source.
- Décodeur et composeur de désignation ISO en outil séparé : à rouvrir après ce guide.

### Arbitrages (2026-10-25)

1. **Catalogue** : Sandvik Coromant, pour toutes les familles d'opérations. Les fiches décrivent les
   types de plaquettes et les géométries avec des mots ; aucun nom commercial ni référence Sandvik
   n'est affiché, seule la source est citée.
2. **Référentiel des alliages** : produit par Gemini à la demande de Julien. Une sortie d'IA n'est
   pas une source (exigence 1) : la liste des matières est reprise comme point de départ, mais
   chaque correspondance, groupe, comportement et plage de vitesse est vérifié et cité dans Sandvik
   Coromant. Ce qui n'y figure pas n'est pas publié. Les trois passages coupés ne sont pas à
   récupérer : leur contenu viendra de la même source.
3. **Fiche de codification** : écartée comme source (voir Constat).
4. **Liste des matières** : celles du référentiel seulement pour cette version, une fois vérifiées
   dans Sandvik Coromant. D'autres matières pourront s'ajouter plus tard, selon la même règle.
5. **Place dans « L'atelier »** : « L'atelier » devient un espace d'éléments de métier (spec 032,
   arbitrages du 2026-10-25). Le guide en est le **premier outil** : il est livré avec l'accueil de
   l'espace (`/atelier` : intro courte, cartes des éléments), et vit sous `/atelier` (chemin exact
   fixé par le plan technique). Le plan technique couvre donc les deux.

## Plan technique

Rédigé le 2026-10-25 sur `master` `7041257` (spec 033 soldée, route `/atelier` absente, aucune
feature `workshop` dans `src/`). Profil lu : `.claude/project-profile.md`. Remplace le
`## Plan technique — V1` de la spec 032 pour l'accueil de l'espace ; ce qui en reste valable est
repris ici nommément.

**Aucune donnée technique dans ce plan.** Il fixe la forme du référentiel, jamais son contenu :
pas de matière, de correspondance, de groupe, de couleur, de vitesse ni de recommandation. Le
référentiel se remplit après coup, fiche par fiche, depuis Sandvik Coromant, et chaque ajout est
validé par Julien (ADR-0033). Les tests tournent sur des **fixtures manifestement fictives**.

### Décisions structurantes

1. **Deux routes, deux modes de rendu (ADR-0024).**
   - `/atelier` (accueil de l'espace) : **`RenderMode.Prerender`**. Son contenu (intro, cartes des
     outils) est écrit dans le code et ne lit aucune API : c'est la catégorie « contenu écrit dans le
     code » d'ADR-0024, comme les pages légales. Servi par `location /` de nginx
     (`try_files $uri/index.html`), sans réveiller Node.
   - `/atelier/plaquettes` (le guide) : **`RenderMode.Server`**, sans aucun appel d'API. Son contenu
     est dans le code, mais **ce qu'il affiche dépend de la query string** (`?matiere=…&operation=…`).
     Un prérendu produit un seul HTML pour toutes les URL : une fiche partagée arriverait vide, la
     recommandation n'apparaîtrait qu'après hydratation (texte absent du HTML servi, saut de mise en
     page, branche `@if` différente entre serveur et client). Rendu à la requête, le HTML servi
     contient la fiche demandée (exigence 5). Précédent : `/blog?tag=` lu côté serveur par
     `input()`. Coût : la route entre dans la liste fermée de la location SSR de nginx et dans le
     test `app.routes.server.spec.ts` ; aucune lecture d'API, donc jamais de 503 d'amont.
   - **Ce qui fera changer** : l'accueil passe en `Server` (et dans la location SSR) le jour où il lit
     l'API, c'est-à-dire à l'arrivée des **derniers articles « Atelier » (V2)** ou des **cartes de
     fiches (V5)**. V5 ajoute aussi `/atelier/:slug` en `Server`, déclarée **après**
     `atelier/plaquettes` dans `app.routes.ts` (la route statique gagne), et l'API refuse les slugs
     réservés aux outils (`plaquettes`, et ceux des outils suivants). Le guide reste en `Server`
     tant que son état est dans l'URL ; il ne lirait l'API que si le référentiel quittait le code
     (non prévu, ADR-0033). Note ajoutée à ADR-0024 pour cette catégorie « contenu du code dont
     l'affichage dépend de la requête ».
2. **Référentiel sourcé par le type (ADR-0033).** Chaque donnée affichée est un `Sourced<T>` dont la
   citation est **obligatoire** : une matière, une correspondance ou une recommandation sans source
   ne compile pas. Les sources forment une union fermée (`SourceId`) adossée à un catalogue
   `Record<SourceId, Source>`. L'absence de recommandation est un **état du domaine**
   (`{ status: 'unavailable' }`), jamais un trou à combler : une entrée de recommandation **liste
   explicitement** les matières qu'elle couvre, sans repli automatique du groupe ISO vers la matière
   (ce serait une extrapolation, exigence 1).
3. **Le type de plaquette dépend de la famille d'opération, à la compilation.** Tournage extérieur et
   intérieur : désignation ISO 1832 partielle, champ par champ. Gorge, tronçonnage, filetage, perçage :
   description par aspects (largeur, profil, nombre d'arêtes, fixation). Un type conditionnel
   distributif sur `OperationId` refuse une désignation ISO pour une gorge et une description libre
   pour une finition extérieure.
4. **Données dans le domaine, lues par l'interface au travers d'un `InjectionToken`.** Le référentiel
   est une constante de domaine (ADR-0004 : pas d'`infra`, pas de gateway, pas de use case). **Écart
   assumé à ADR-0004** (Conséquences, « les tests de composants consomment la constante réelle ») :
   la page lit `INSERT_GUIDE_REFERENCE`, un `InjectionToken` dont la `factory` rend la constante
   réelle (précédents `GISCUS_CONFIG`, `API_BASE_URL`). Raison : le référentiel est vide au moment
   où l'interface se construit et grandit à chaque PR de données ; des tests de composants couplés au
   contenu réel seraient soit impossibles (rien à choisir), soit réécrits à chaque saisie. Les tests
   de composants fournissent une fixture fictive ; les tests d'intégrité du domaine tournent sur la
   constante réelle.
5. **Champ matière : composant de feature, pas `shared/ui`.** `MaterialCombobox` vit dans
   `features/workshop/application/`. Le dépôt a déjà un combobox ARIA 1.2
   (`features/admin/application/components/admin-tags-selector.ts`) : le nouveau en **reprend le
   motif à l'identique** (`role="combobox"`, `aria-autocomplete="list"`, `aria-activedescendant`,
   option en `mousedown.preventDefault()`, défilement de l'option active par
   `afterRenderEffect({ write })`, statut `sr-only`, `FormValueControl`), mais pas le code : l'un est
   multi-sélection avec saisie libre (Entrée ajoute le texte tapé, virgule, puces), l'autre est
   mono-sélection dans une liste fermée (Entrée ne choisit qu'une option active). Un
   `shared/ui/combobox` générique devrait porter la projection de gabarit d'option, deux politiques
   d'Entrée et une refonte de l'admin hors périmètre, pour un seul nouveau consommateur. Promotion en
   `shared/ui` le jour où un troisième combobox apparaît, ou quand l'admin est retouché : le cœur
   commun (navigation dans la liste, identifiants, statut) en sortira tel quel. Pas d'ADR : décision
   locale, réversible.
6. **État dans l'URL, Signal Forms pour les champs.** Le modèle du formulaire est un
   `linkedSignal` dérivé des paramètres d'URL (précédent `editor-draft.ts`) ; `form(model)` sans
   `submission` (rien n'est soumis) ; les deux champs sont des contrôles personnalisés liés par
   `[formField]` (`FormValueControl`, précédent `AdminTagsSelector`). Un `effect()` reflète le modèle
   dans l'URL (effet de bord vers un état externe, comme `localStorage`), `replaceUrl: true`, et ne
   navigue **que** si le modèle diffère de la sélection lue dans l'URL : aucune navigation au rendu
   serveur ni au retour arrière. La recommandation est un `computed()` sur une fonction pure du
   domaine.
7. **Le texte métier vient de Julien.** Ce plan ne rédige ni l'intro de l'accueil ni aucune phrase
   sur l'usinage. Seuls sont proposés, **à valider par Julien** : titres et descriptions SEO,
   libellés d'interface (§ Copie d'interface).

### Architecture

```
app.routes.ts ─┬─ /atelier            (loadComponent, data.seo, preload) ─► pages/workshop/workshop.ts (Workshop)
               │                                                            h1, intro (WORKSHOP_SPACE), cartes a[app-link-card]
               └─ /atelier/plaquettes (loadComponent, data.seo)           ─► pages/insert-guide/insert-guide.ts (InsertGuide)
app.routes.server.ts : atelier → Prerender ; atelier/plaquettes → Server
Dockerfile (nginx)   : location SSR += atelier/plaquettes ; /atelier par location /

InsertGuide (smart : inputs d'URL, form, effet URL, computed)
 │ inject(INSERT_GUIDE_REFERENCE) ──► domain : MATERIALS, OPERATION_FAMILIES, ISO_513_GROUPS,
 │                                             RECOMMENDATIONS, SOURCES
 │ matiere, operation (query) ─► parseGuideSelection ─► linkedSignal (modèle) ─► form()
 │                                                       └─ effect ─► router.navigate([], queryParams, replaceUrl)
 │ computed : material, operation, state = resolveGuideState(…), status = insertGuideStatus(state)
 ├─ section « matière »      ─► MaterialCombobox [formField] (searchMaterials) ─► MaterialSheet ─► IsoGroupBadge, SourceCitation
 ├─ section « opération »    ─► OperationPicker  [formField] (fieldset par famille, radios)
 └─ section « plaquette »    ─► RecommendationPanel [state] ─► IsoInsertDesignation | DescribedInsert, SourceCitation
                                + avertissement + p role=status sr-only (annonce du changement)
```

- **Frontière dérivation / vue.** Toute la dérivation non triviale est dans des **fonctions pures du
  domaine** (`normalizeDesignation`, `searchMaterials`, `parseGuideSelection`,
  `findRecommendation`, `resolveGuideState`) et une fonction pure d'application qui produit la phrase
  d'annonce (`insertGuideStatus`). **Pas de presenter** : aucun composant ne mêle interaction DOM et
  dérivation non triviale. `MaterialCombobox` porte l'interaction (clavier, défilement, focus) et
  appelle `searchMaterials` dans un seul `computed` ; `InsertGuide` n'a aucune interaction DOM (ni
  `viewChild`, ni mesure), seulement de la glue `computed` vers le domaine.
- **Décomposition** : 2 pages, 8 composants dumb (`application/`), listés ci-dessous ; aucun fichier
  « à découper plus tard ».
- **Landmarks** : le shell garde le seul `main`, `banner` et `contentinfo`. Aucune des deux pages
  n'émet `<main>`, `<header>` ni `<footer>` à sa racine. Le guide est découpé en trois
  `<section aria-labelledby>` nommées par leur `h2` ; l'accueil en une section « Les outils ».
- **Titres** : un `h1` par page ; `h2` par section ; `h3` dans la fiche matière (nom de la matière)
  et dans le panneau de recommandation (blocs). Aucun saut de niveau.
- **Hydratation** : aucun `@defer`. Le guide est le contenu principal et interactif ; l'accueil est
  léger et ses cartes naviguent côté client.
- **Pas d'élément `<form>`** sur le guide : rien n'est soumis, et un `<form>` ferait d'Entrée dans le
  champ une soumission. `form()` de Signal Forms ne l'exige pas.

### Fichiers à créer / modifier

**Créer** (`src/app/features/workshop/`), par PR :

PR 3 (accueil)
- `domain/models/workshop-space.model.ts` : `WorkshopSpace`, `WorkshopTool`.
- `domain/workshop-space.static-data.ts` (+ `.spec.ts`) : `WORKSHOP_SPACE` (intro de Julien, cartes).
- `domain/confidential-references.ts` (+ `.spec.ts`) : `findConfidentialReferences(text)`, repris
  tel quel du plan V1 de la spec 032 (ADR-0032 §3).
- `pages/workshop/workshop.ts` (+ `.spec.ts`) : `Workshop`, `app-workshop`.

PR 4 (référentiel et recherche, domaine pur)
- `domain/models/source.model.ts` : `SourceId`, `Source`, `SourceCitation`, `Sourced<T>`.
- `domain/models/material.model.ts` : `IsoGroupLetter`, `IsoGroupColor`, `IsoGroup`,
  `DesignationSystem`, `Designation`, `Material`, `MaterialSuggestion`.
- `domain/models/operation.model.ts` : `OperationFamilyId`, `OperationId`, `Operation`,
  `OperationFamily`.
- `domain/models/recommendation.model.ts` : `IsoInsertDesignation`, `DescribedInsert`,
  `InsertFor<O>`, `CuttingSpeedRange`, `RecommendationEntry`, `GuideState`.
- `domain/models/insert-guide-reference.model.ts` : `InsertGuideReference` (agrégat lu par le
  token).
- `domain/sources.static-data.ts` : `SOURCES`.
- `domain/iso-groups.static-data.ts` : `ISO_513_GROUPS`.
- `domain/operations.static-data.ts` : `OPERATION_FAMILIES` (familles et opérations de la spec,
  slugs d'URL).
- `domain/materials.static-data.ts` : `MATERIALS` (vide tant qu'aucune matière n'est vérifiée).
- `domain/recommendations.static-data.ts` : `RECOMMENDATIONS` (vide jusqu'aux PR 6+).
- `domain/normalize-designation.ts` (+ `.spec.ts`).
- `domain/search-materials.ts` (+ `.spec.ts`).
- `domain/guide-selection.ts` (+ `.spec.ts`) : `parseGuideSelection`.
- `domain/find-recommendation.ts` (+ `.spec.ts`) : `findRecommendation`, `resolveGuideState`.
- `domain/reference-types.spec.ts` : garanties de compilation (`@ts-expect-error`).
- `domain/reference-integrity.spec.ts` : invariants sur les **données réelles** (§ Tests).
- `testing/insert-guide-builders.ts` : builders à valeurs fictives (`aMaterial()`,
  `aRecommendation()`, `aReference()`).

PR 5 (interface)
- `application/insert-guide-reference.ts` : `INSERT_GUIDE_REFERENCE` (`InjectionToken`,
  `providedIn: 'root'`, `factory` → constantes du domaine).
- `application/insert-guide-copy.ts` : `INSERT_GUIDE_COPY` (libellés, avertissement, absence,
  libellés des systèmes de désignation et des aspects de plaquette).
- `application/insert-guide-status.ts` (+ `.spec.ts`) : `insertGuideStatus(state)`, phrase annoncée.
- `application/material-combobox.ts` (+ `.spec.ts`) : `MaterialCombobox`,
  `FormValueControl<string>` (slug ou `''`).
- `application/operation-picker.ts` (+ `.spec.ts`) : `OperationPicker`, `FormValueControl<string>`.
- `application/material-sheet.ts` (+ `.spec.ts`) : fiche de la matière choisie.
- `application/iso-group-badge.ts` (+ `.spec.ts`) : lettre, nom, pastille de couleur.
- `application/source-citation.ts` (+ `.spec.ts`) : une citation.
- `application/recommendation-panel.ts` (+ `.spec.ts`) : états incomplet, absent, disponible.
- `pages/insert-guide/insert-guide.ts` (+ `.spec.ts`) : `InsertGuide`, `app-insert-guide`.
- `testing/insert-guide.page-model.ts` : PageModel du guide (champ, options, radios, panneau).

PR 6+ (recommandations)
- `application/iso-insert-designation.ts` (+ `.spec.ts`) : avec la première famille ISO (extérieur).
- `application/described-insert.ts` (+ `.spec.ts`) : avec la première famille décrite (gorge).
- `domain/recommendations.static-data.ts`, `domain/materials.static-data.ts` : données saisies.

**Créer** (racine)
- `src/app/app.routes.workshop.spec.ts` (PR 3, étendu en PR 5) : routes, titres, SEO, fil d'Ariane.
- `src/app/workshop-confidentiality.spec.ts` (PR 3, étendu en PR 4) : garde ADR-0032 sur
  `WORKSHOP_SPACE` et tout le texte libre du référentiel.
- `docs/adr/0033-referentiel-d-usinage-source-par-le-type.md` (fait avec ce plan).

**Modifier**
- `src/app/app.routes.ts` : `WORKSHOP_TITLE`, `INSERT_GUIDE_TITLE` ; routes `atelier` (PR 3) et
  `atelier/plaquettes` (PR 5), **au premier niveau** (pas de `loadChildren`) pour que
  `ROUTE_TEXTS` des verrous éditoriaux les lise sans ajout.
- `src/app/app.routes.server.ts` (+ `.spec.ts`) : `atelier` dans « Contenu écrit dans le code »
  (PR 3) ; `atelier/plaquettes` dans un nouveau bloc « Contenu du code qui dépend de la requête »
  (PR 5). Le test `renders on request exactly the content routes and nothing else` devient « exactly
  the routes nginx relays to Node » et inclut le guide.
- `Dockerfile` (PR 5) : regex de la location SSR
  `^/(about|projects(/[^/]+)?|blog(/[^/]+)?|atelier/plaquettes)?/?$`.
- `src/app/layout/components/header/nav-items.ts` (+ `header.spec.ts`), `footer.static-data.ts`,
  `footer.ts` (+ `footer.spec.ts`) (PR 3) : « L'atelier » en dernier, `lucide-wrench` (repris du
  plan V1, icône déjà au sprite).
- `src/server/feeds/sitemap.ts` (+ `.spec.ts`) : `/atelier` (PR 3, `monthly`, `0.8`, après
  `/about`), `/atelier/plaquettes` (PR 5, `monthly`, `0.7`).
- `src/app/testing/editorial-sources.ts` : `WORKSHOP_SPACE` (PR 3) ; `INSERT_GUIDE_COPY`,
  `OPERATION_FAMILIES`, `ISO_513_GROUPS`, `MATERIALS`, `RECOMMENDATIONS` (PR 4 et 5). `SOURCES`
  n'y entre pas (titres de documents tiers, pas du texte du site).
- `e2e/a11y/scenarios.ts` : `/atelier` (PR 3), `/atelier/plaquettes` et ses états (PR 5).
- `.github/workflows/ci.yml` : job `verify` (PR 3) `test -f $browser/atelier/index.html`, (PR 5)
  `test ! -f $browser/atelier/plaquettes/index.html` ; job `docker` (PR 3) `/atelier/` 200 avec
  `data-testid="workshop-title"`, (PR 5) `/atelier/plaquettes` 200 avec
  `data-testid="insert-guide-title"` et un en-tête `X-Cache-Status` (servi par Node).
- `src/styles.css` (PR 5, si la question 7 est validée) : six tokens `--color-iso-*` en OKLCH, Sable
  et Nuit.
- `DESIGN.md` § 5 : « Accueil de l'atelier » (PR 3), « Guide des plaquettes », « Champ à
  suggestions », « Badge de groupe ISO » (PR 5) ; § 2, exception bornée à la One Orange Rule
  (PR 5, si validée).
- `docs/adr/0024-…` : note sur la catégorie de rendu (fait avec ce plan).
- `specs/032-atelier.md` : renvoi dans l'encadré « À réviser » (fait avec ce plan).

### Modèles de données

`type` immuables, unions fermées, aucune valeur métier ci-dessous.

```ts
// source.model.ts
export type SourceId = /* union fermée, un membre par document cité, remplie à la saisie */;
export type Source = {
  readonly title: string;        // titre du document tel que publié
  readonly publisher: string;
  readonly url: `https://${string}`;
  readonly consultedOn: string;  // AAAA-MM-JJ
};
export type SourceCitation = { readonly source: SourceId; readonly locator: string }; // section, tableau, page
export type Sourced<T> = { readonly value: T; readonly cite: SourceCitation };

// material.model.ts
export type IsoGroupLetter = 'P' | 'M' | 'K' | 'N' | 'S' | 'H';
export type IsoGroupColor = /* union fermée des couleurs que la norme attribue aux groupes, remplie à la saisie */;
export type IsoGroup = { readonly letter: IsoGroupLetter; readonly name: Sourced<string>; readonly color: Sourced<IsoGroupColor> };
export type DesignationSystem = 'en-symbol' | 'material-number' | 'aisi' | 'uns' | 'afnor-legacy' | 'common-name';
export type Designation = Sourced<string> & { readonly system: DesignationSystem };
export type Material = {
  readonly slug: string;                                         // valeur de ?matiere=
  readonly designations: readonly [Designation, ...Designation[]]; // la première est le nom affiché
  readonly isoGroup: Sourced<IsoGroupLetter>;
  readonly behaviour: readonly [Sourced<string>, ...Sourced<string>[]]; // comportement à la coupe
};
export type MaterialSuggestion = { readonly material: Material; readonly matched: Designation };

// operation.model.ts
export type OperationFamilyId = 'external-turning' | 'internal-turning' | 'grooving-parting' | 'threading' | 'drilling';
export type OperationId =
  | 'external-roughing' | 'external-semi-finishing' | 'external-finishing'
  | 'internal-roughing' | 'internal-finishing'
  | 'grooving' | 'parting-off' | 'threading' | 'insert-drilling';
export type Operation = { readonly id: OperationId; readonly slug: string; readonly label: string };
export type OperationFamily = {
  readonly id: OperationFamilyId;
  readonly label: string;
  readonly operations: readonly [Operation, ...Operation[]];
};

// recommendation.model.ts
type IsoDesignatedOperation = Extract<OperationId, `external-${string}` | `internal-${string}`>;
export type IsoInsertDesignation = {
  readonly kind: 'iso-1832';
  readonly fields: readonly [IsoDesignationField, ...IsoDesignationField[]]; // dans l'ordre du code
};
export type IsoDesignationField = Sourced<{ readonly field: string; readonly code: string; readonly meaning: string }>;
export type InsertAspect = 'width' | 'profile' | 'edge-count' | 'clamping';
export type DescribedInsert = {
  readonly kind: 'described';
  readonly aspects: readonly [Sourced<{ readonly aspect: InsertAspect; readonly text: string }>, ...Sourced<{ readonly aspect: InsertAspect; readonly text: string }>[]];
};
export type InsertFor<O extends OperationId> = O extends IsoDesignatedOperation ? IsoInsertDesignation : DescribedInsert;
export type CuttingSpeedRange = { readonly min: number; readonly max: number; readonly unit: 'm/min' };
export type RecommendationEntry = {
  [O in OperationId]: {
    readonly operation: O;
    readonly materials: readonly [string, ...string[]]; // slugs, liste explicite, sans repli par groupe
    readonly insert: InsertFor<O>;
    readonly geometry: Sourced<string>;   // brise-copeaux, préparation d'arête, en mots
    readonly grade: Sourced<string>;      // nuance, en mots, jamais un nom commercial
    readonly cuttingSpeed?: Sourced<CuttingSpeedRange>; // seulement si la source en donne une
    readonly pitfalls: readonly Sourced<string>[];
  };
}[OperationId];
export type GuideState =
  | { readonly status: 'incomplete' }
  | { readonly status: 'unavailable'; readonly material: Material; readonly operation: Operation }
  | { readonly status: 'available'; readonly material: Material; readonly operation: Operation; readonly entry: RecommendationEntry };

// insert-guide-reference.model.ts
export type InsertGuideReference = {
  readonly sources: Readonly<Record<SourceId, Source>>;
  readonly isoGroups: Readonly<Record<IsoGroupLetter, IsoGroup>>;
  readonly families: readonly OperationFamily[];
  readonly materials: readonly Material[];
  readonly recommendations: readonly RecommendationEntry[];
};

// workshop-space.model.ts
export type WorkshopToolId = 'insert-guide';
export type WorkshopTool = { readonly id: WorkshopToolId; readonly overline: string; readonly title: string; readonly path: `/atelier/${string}` };
export type WorkshopSpace = {
  readonly heading: string;                       // « L'atelier »
  readonly intro: readonly [string, ...string[]]; // paragraphes de Julien
  readonly toolsHeading: string;
  readonly tools: readonly WorkshopTool[];
};
```

- **Compile-time d'abord** (contraintes structurelles) : citation absente, source hors catalogue,
  groupe ISO hors des six lettres, matière sans désignation ni comportement, désignation ISO sur une
  opération décrite (et l'inverse), entrée sans matière, opération ou outil inconnus : refusés par
  le compilateur, prouvés par `reference-types.spec.ts` (`// @ts-expect-error: <raison>`, la
  description est exigée par `@typescript-eslint/ban-ts-comment`). `SOURCES` et `ISO_513_GROUPS`
  sont typés `Record<…>` : un membre d'union sans entrée ne compile pas.
- **Runtime** (contraintes qui dépendent des données saisies) : unicité des slugs et format
  `^[a-z0-9]+(?:-[a-z0-9]+)*$` ; format propre à chaque système de désignation (numéro matière,
  UNS…) ; aucune désignation normalisée partagée par deux matières (sinon la recherche serait
  ambiguë) ; chaque slug cité par une recommandation existe ; aucun couple matière × opération
  couvert par deux entrées ; `0 < min ≤ max` ; dates `AAAA-MM-JJ` ; textes non vides ; chaque groupe
  ISO cité par une matière a son entrée.
- **L'ordre des opérations et des familles** est celui du tableau de la spec ; les libellés sont ceux
  de la spec ; les slugs d'URL sont en français, sans accent (`finition-exterieure`…), fixés dans
  `OPERATION_FAMILIES` et figés une fois publiés (URL partagées).
- **Pas de couleur dans le domaine** sous forme CSS : `IsoGroupColor` est un nom de couleur sourcé ;
  l'application le traduit en token (`iso-group-badge.ts`).
- **V3** lira `CuttingSpeedRange` tel quel ; rien n'est construit pour lui ici.
- **Validation aux frontières** : sans objet (aucune I/O). Les paramètres d'URL sont la seule entrée
  externe : `parseGuideSelection` ne retient qu'un slug **présent** dans le référentiel, sinon `''` ;
  une valeur inconnue n'est jamais réécrite dans la page, le titre ni l'URL.

### Fonctions du domaine

- `normalizeDesignation(text)` : NFD, retrait des diacritiques (`\p{Diacritic}`, comme
  `tag-suggestions.ts`), minuscules, retrait des espaces (dont insécables) et des tirets (`-`, `‐`,
  `–`). Les points sont conservés (la spec ne les cite pas). Idempotente.
- `searchMaterials(materials, query)` : une suggestion par matière, avec la désignation qui a trouvé.
  Même règle de classement que `matchingTags` (admin) pour la cohérence : celles dont une désignation
  **commence** par la saisie d'abord, puis celles qui la **contiennent** ; à égalité, ordre du
  référentiel. Requête vide : toutes les matières (liste ouverte par la flèche bas).
- `parseGuideSelection(reference, rawMaterial, rawOperation)` → `{ material: string; operation:
  string }` (slugs connus ou `''`).
- `findRecommendation(recommendations, materialSlug, operationId)` → `RecommendationEntry |
  undefined` ; `resolveGuideState(reference, selection)` → `GuideState` (`incomplete` tant qu'une des
  deux sélections manque).

### Réactivité et état

- **Signals locaux** uniquement. Pas de store (rien de partagé entre composants non liés), pas de
  facade (aucune I/O, aucun use case), pas de gateway (aucune frontière, ADR-0004).
- `InsertGuide` :
  - `materialParam = input<string | undefined>(undefined, { alias: 'matiere' })`,
    `operationParam = input<…>(…, { alias: 'operation' })` (`withComponentInputBinding()` déjà
    câblé) ;
  - `_selection = linkedSignal(() => parseGuideSelection(ref, materialParam(), operationParam()))` ;
    `guideForm = form(this._selection)` ;
  - `material`, `operation`, `state` (`resolveGuideState`), `status` (`insertGuideStatus`) en
    `computed` ;
  - `effect` d'URL : lit `_selection()` et la sélection parsée des inputs ; si elles diffèrent,
    `router.navigate([], { relativeTo, queryParams: { matiere, operation } (clé omise si vide),
    replaceUrl: true })`. `replaceUrl` : une sélection n'empile pas l'historique (même choix que le
    filtre du blog, qui ne pousse pas d'entrée par clic).
- `MaterialCombobox` (`FormValueControl<string>`, `value = model('')`) : `materials` en
  `input.required` ; état interne `_query`, `_open`, `activeIndex` ; `suggestions = computed(() =>
  _open() ? searchMaterials(materials(), _query()) : [])` ; `activeId`, `expanded`, `announcement` en
  `computed`. Choisir une option fait `value.set(slug)`, remet le texte au nom de la matière et ferme
  la liste. Le texte du champ suit `value` (nom affiché de la matière choisie) quand la valeur change
  de l'extérieur (retour arrière) : `linkedSignal` du texte sur `value()`.
- `OperationPicker` (`FormValueControl<string>`) : radios natifs, `[checked]` et `(change)` →
  `value.set(slug)` ; un seul `name` pour toutes les familles (un seul groupe de radios, flèches
  natives).

### Gabarits et composants

- **`Workshop`** : `host: { class: 'block min-h-svh pt-20' }` (précédent `About`). `page-container` ;
  `h1` (`data-testid="workshop-title"`, liste de classes du `h1` de `/blog`) ; intro en `<p>`
  (`max-w-prose`, `text-muted` pour le premier si Julien veut un chapô) ; `<section
  aria-labelledby="workshop-tools">` avec `h2` et une grille de `a[app-link-card]` (`overline`,
  `heading`, `routerLink` = `tool.path`, `data-testid="workshop-tool-card"`), `@for (tool of
  space.tools; track tool.id)`. Pas d'autocollant ni de cartouche obligatoire (un décor par écran au
  plus, DESIGN.md) ; si Julien en veut un, il se choisit en revue UI.
- **`InsertGuide`** : même hôte. `h1` (`insert-guide-title`), chapô court (copie), trois sections :
  - « La matière » : `<app-material-combobox [formField]="guideForm.material" [materials]="…">`,
    puis `@if (material(); as m)` `<app-material-sheet>` ;
  - « L'opération » : `<app-operation-picker [formField]="guideForm.operation" [families]="…">` ;
  - « La plaquette » : `<app-recommendation-panel [state]="state()" [sources]="…" [isoGroups]="…">`,
    puis l'avertissement (toujours visible, `data-testid="insert-guide-disclaimer"`), puis
    `<p role="status" class="sr-only" data-testid="insert-guide-status">{{ status() }}</p>`
    présent dès le HTML serveur (une région live doit exister avant son premier changement).
  - Sur grand écran, deux colonnes (choix à gauche, plaquette à droite) à partir de `lg` ; en mobile,
    l'ordre du DOM (matière, opération, plaquette). Aucun déplacement de focus après un choix.
- **`MaterialCombobox`** : `label for` visible « Matière », indication liée par `aria-describedby`,
  `input role="combobox" aria-autocomplete="list" aria-expanded aria-controls
  aria-activedescendant autocomplete="off"`, classe `form-input` ; `ul role="listbox"` nommé ;
  `li role="option" [attr.aria-selected]` (option active) avec le nom affiché, la désignation qui a
  trouvé si elle diffère (« 4140 · AISI ») et la lettre du groupe ISO **en texte**. Clavier :
  - flèche bas / haut : ouvre la liste si fermée (requête vide comprise), déplace l'option active en
    boucle (même règle que `moveActive` de l'admin) ;
  - Entrée : choisit l'option active, sinon ne fait rien (jamais de choix implicite), `preventDefault`
    toujours ;
  - Échap : ferme la liste si ouverte ; sinon remet le texte au nom de la matière choisie (ou vide) ;
  - Tab : ferme la liste sans choisir (`blur`) ;
  - Annonces : `p role="status" sr-only` « N matières trouvées » / « Aucune matière trouvée » à chaque
    changement de requête ; l'option active est annoncée nativement par `aria-activedescendant`.
    Une saisie sans résultat affiche aussi un texte visible sous le champ (« pas encore dans le
    guide »).
  - Commentaire `eslint-disable-next-line` sur l'option, repris mot pour mot de l'admin (même
    justification ARIA).
- **`OperationPicker`** : `fieldset` + `legend` (« Opération », `sr-only` car le `h2` la dit déjà
  visuellement) contenant un `fieldset` par famille avec sa `legend` visible et ses radios
  (`label for`, cible ≥ 44 px, `accent-primary`).
- **`MaterialSheet`** : `h3` (nom affiché), `app-iso-group-badge`, comportement (paragraphes, chacun
  suivi de sa citation), puis les désignations dans un `dl` propre (système / valeur, citation de
  chaque correspondance en `text-xs`). `FactList` (`shared/ui`) n'est pas réutilisée : elle n'a pas
  de place pour une citation par ligne, et l'y ajouter servirait un seul consommateur.
- **`IsoGroupBadge`** : lettre en texte (`font-mono font-semibold`), nom du groupe, pastille
  `aria-hidden="true"` de la couleur du groupe, bord `foreground` 1 px pour rester visible sur fond
  clair (une couleur claire sur Sable). L'information est dans le texte ; la pastille est un
  complément (exigence 4 : rien par la seule couleur). Contraste de la pastille non exigé (WCAG
  1.4.11 ne vise que les graphiques nécessaires à la compréhension) ; le texte garde les tokens
  existants.
- **`SourceCitation`** : « Source : » + lien externe (`target="_blank" rel="noopener noreferrer"`,
  convention du pied de page, nom du lien = titre du document, mention « nouvel onglet » en `sr-only`)
  + `locator`. `text-xs text-muted`. Entrées : `citation`, `source` (résolue par le parent dans le
  gabarit, `sources()[cite.source]`).
- **`RecommendationPanel`** : `@switch (state().status)` :
  - `incomplete` : invitation à choisir matière et opération ;
  - `unavailable` : « Pas encore de recommandation pour ce cas. » (`data-testid="insert-guide-unavailable"`),
    rien d'autre, aucune valeur voisine proposée ;
  - `available` (PR 6+) : `h3` par bloc (Plaquette, Géométrie, Nuance, Vitesse de coupe si présente,
    Pièges), chacun suivi de sa citation ; plaquette par `@switch (entry.insert.kind)` vers
    `IsoInsertDesignation` (code partiel en `dl` : champ, code en `font-mono`, signification) ou
    `DescribedInsert` (`dl` aspect / texte) ; plage de vitesse « min à max m/min » en `tabular-nums`,
    espace fine insécable dans les nombres ≥ 1 000 (verrou typographique).
- **Tokens** : uniquement ceux de `master` (spec 033 soldée : `rounded-card`, `rounded-field`,
  `border-field`, `text-muted`, `bg-surface`, `page-container`, `section-title`), plus les six
  `--color-iso-*` si la question 7 est validée. Sans validation : badge sans pastille, lettre et nom
  seuls (la spec reste tenue sur l'information, pas sur la couleur).

### SEO

- `/atelier` : `WORKSHOP_TITLE = "L'atelier : outils de tourneur CN | Julien Nédellec"`
  (51 caractères, calculé). Description proposée : « Mon coin de tourneur CN : des outils
  d'usinage, à commencer par un guide pour choisir le type de plaquette selon la matière et
  l'opération. » (139 caractères, calculé ; plafond 160 testé). `BreadcrumbList` Accueil →
  L'atelier.
- `/atelier/plaquettes` : `INSERT_GUIDE_TITLE = 'Guide des plaquettes de tournage | Julien
  Nédellec'` (50 caractères, calculé). Description proposée : « Choisis ta matière et ton opération
  de tournage : le guide indique le type de plaquette, sa géométrie et les pièges à éviter,
  avec la source de chaque donnée. » (158 caractères, calculé). `BreadcrumbList` Accueil →
  L'atelier → Guide des plaquettes.
- **Canonical sans query string** pour le guide (`${siteUrl}/atelier/plaquettes`) : les
  combinaisons matière × opération ne sont pas des pages à indexer (contenu court et répétitif) ;
  elles se partagent, elles ne se référencent pas. Titre statique : un titre par combinaison
  demanderait un `Seo` dynamique pour un gain nul une fois le canonical posé.
- Pas de `keywords` (précédent des pages légales), image de partage par défaut, `type: 'website'`.
  Pas de `WebApplication` ni de `HowTo` : aucun résultat enrichi n'en dépend.
- `<head>` émis au rendu (prérendu ou serveur) par `Seo.applySeoData` sur `data.seo` : aucune API
  navigateur seule.

### Copie d'interface (à valider par Julien, au tutoiement)

Libellés proposés, regroupés dans `INSERT_GUIDE_COPY` : « Matière » ; indication « Tape une
désignation : EN, numéro matière, AISI, UNS, ancienne AFNOR ou nom courant. » ; « N matières
trouvées » / « Aucune matière trouvée » ; « Cette matière n'est pas encore dans le guide. » ;
« Opération » ; « Choisis une matière et une opération. » ; « Pas encore de recommandation pour ce
cas. » (mot pour mot de la spec) ; avertissement « Recommandation indicative : elle ne remplace
ni le catalogue de ton outil ni ton expérience. » ; libellés des systèmes de désignation et des
aspects de plaquette. Aucune phrase sur l'usinage elle-même.

### Tests

- **Verrous existants, portée** : anti-vouvoiement sur fichiers (`PUBLIC_ROOT` lit
  `features/workshop/**` automatiquement, hors `testing/` et specs) ; typographie, formulations
  interdites et vouvoiement sur données via `EDITORIAL_SOURCES` (liste explicite, complétée en PR 3,
  4 et 5) ; routes de premier niveau lues par `ROUTE_TEXTS` sans ajout.
- **Domaine, sans TestBed, fixtures fictives** (`testing/insert-guide-builders.ts`, désignations du
  type `ZZ-FICTIF-1`, source `locator: 'fixture'`) :
  - `normalizeDesignation` en `it.each` (casse, accents, espaces, espace insécable, tirets,
    idempotence `f(f(x)) === f(x)`) ;
  - `searchMaterials` en `it.each` : chaque système de désignation trouve sa matière, préfixe avant
    contenu, une seule suggestion par matière, désignation trouvée exacte, requête vide → tout,
    aucune correspondance → `[]` ;
  - `parseGuideSelection` : slug connu retenu, inconnu ou absent → `''` ;
  - `findRecommendation` / `resolveGuideState` : `incomplete` (chaque manque), `unavailable`,
    `available`, entrée multi-matières ;
  - `reference-types.spec.ts` : chaque garantie de compilation listée ci-dessus ;
  - `reference-integrity.spec.ts` sur les **données réelles** (vraies même vides) : invariants
    runtime ci-dessus ; **aucune source IA** (titre, éditeur ni URL ne correspondent à
    `/gemini|chatgpt|openai|intelligence artificielle|\bIA\b|référentiel des alliages/iu`) ; **aucun
    nom commercial** (`Sandvik` et `/\bCoro[A-Z]/u` interdits partout sauf dans `SOURCES`) ;
    `findConfidentialReferences` sur tout le **texte libre** (comportement, pièges, géométrie,
    nuance, aspects, significations), **pas** sur les valeurs de désignation, contrôlées par leur
    format (un UNS compte cinq chiffres : le motif de la garde le signalerait à tort).
- **Composants (TestBed, `setInput`, `data-testid`, fixture fournie par `INSERT_GUIDE_REFERENCE`)** :
  - `MaterialCombobox` : saisie → options et statut « N matières trouvées » ; flèches en boucle,
    `aria-activedescendant` = id de l'option active, `aria-expanded` ; Entrée choisit l'active et
    met `value`, Entrée sans active ne change rien ; Échap ferme puis restaure ; clic sur une option ;
    valeur posée de l'extérieur → texte du champ ; aucune correspondance → texte visible ;
  - `OperationPicker` : une `legend` par famille, un radio par opération, `value` suit le choix ;
  - `MaterialSheet`, `IsoGroupBadge`, `SourceCitation`, `RecommendationPanel` : chaque donnée rendue
    avec sa citation ; lettre du groupe en texte ; `unavailable` n'affiche aucune donnée ;
  - `InsertGuide` (avec `provideRouter` + `RouterTestingHarness`, précédent `login.spec.ts`) : URL
    `?matiere=…&operation=…` → fiche et panneau rendus ; choix d'une matière → URL mise à jour
    (`replaceUrl`) ; slug inconnu → rien de sélectionné, rien réécrit ; statut annoncé à chaque
    changement d'état ; aucun `main`/`header`/`footer` racine ; un seul `h1` ;
  - `Workshop` : `h1`, autant de cartes que `WORKSHOP_SPACE.tools`, chaque carte pointe vers une route
    déclarée (test qui croise `tool.path` et `routes`).
- **Routes** : `app.routes.workshop.spec.ts` (titres, descriptions ≤ 160, canonical, fil d'Ariane) ;
  `app.routes.server.spec.ts` (modes et liste relayée par nginx) ; `sitemap.spec.ts`.
- **Axe (job `a11y`)**, clair et sombre : `/atelier` (prêt sur `workshop-title`) ;
  `/atelier/plaquettes` (prêt sur `insert-guide-title`) ; état « liste ouverte » (saisie dans le
  champ, prêt sur l'option) ; état « choix fait » `?matiere=<slug>&operation=<slug>` dès qu'une
  matière vérifiée existe (sinon le scénario n'a rien à choisir : il s'ajoute à la première PR de
  données).

### Tranches

Prérequis hors TDD : le texte de Julien (PR 3) et les données vérifiées (PR 5 pour les matières, 6+
pour les recommandations). Chaque tranche n'ajoute au modèle que ce qu'elle rend.

PR 3 (accueil)
- **Tranche 1 — l'accueil de l'atelier existe et se trouve** : `WorkshopSpace` (sans outil),
  `WORKSHOP_SPACE`, page `Workshop` (`h1`, intro), route `atelier` + SEO, `Prerender`, sitemap,
  `EDITORIAL_SOURCES`, scénario axe, gardes CI.
- **Tranche 2 — on y arrive depuis le menu et le pied de page** : `NAV_LINKS`, `FOOTER_COPY`,
  `footer.ts`.
- **Tranche 3 — une référence de pièce ne peut pas partir** : `findConfidentialReferences`,
  `workshop-confidentiality.spec.ts` sur `WORKSHOP_SPACE`.

PR 4 (référentiel et recherche, domaine pur)
- **Tranche 4 — une désignation tapée n'importe comment retrouve sa matière** : modèles source et
  matière, `normalizeDesignation`, `searchMaterials`, builders, `MATERIALS` vide, intégrité des
  matières.
- **Tranche 5 — une donnée sans source ne compile pas** : `SOURCES`, `ISO_513_GROUPS`,
  `reference-types.spec.ts` (partie source et matière), garde « aucune source IA ».
  `ISO_513_GROUPS` reporté à la première PR de données (première source Sandvik Coromant), avec
  sa garantie de type, l'invariant « chaque groupe ISO cité par une matière a son entrée » et son
  ajout à `EDITORIAL_SOURCES`.
- **Tranche 6 — une combinaison sans recommandation le dit** : modèles opération et recommandation,
  `OPERATION_FAMILIES`, `RECOMMENDATIONS` vide, `parseGuideSelection`, `findRecommendation`,
  `resolveGuideState`, garanties de compilation de `InsertFor<O>`, intégrité des recommandations,
  garde des noms commerciaux. L'extension de la garde de confidentialité au texte libre du
  référentiel est renvoyée à la tranche 3, qui crée `findConfidentialReferences`.

PR 5 (interface)
- **Tranche 7 — le guide existe et se trouve** : token, copie, page `InsertGuide` (`h1`, chapô,
  avertissement, statut vide), route `atelier/plaquettes` + SEO, `Server`, location nginx, sitemap,
  carte sur l'accueil (`WorkshopTool`), scénario axe, gardes CI.
- **Tranche 8 — je choisis ma matière au clavier, et l'URL la garde** : `MaterialCombobox`,
  `MaterialSheet`, `IsoGroupBadge`, `SourceCitation`, modèle et `form()`, input `matiere`, effet
  d'URL ; tokens ISO si validés.
- **Tranche 9 — je choisis l'opération, et l'absence se dit franchement** : `OperationPicker`, input
  `operation`, `RecommendationPanel` (`incomplete`, `unavailable`), `insertGuideStatus`, annonce.

PR 6+ (une famille par PR)
- **Tranche 10 — tournage extérieur** : état `available` du panneau (blocs communs, citations,
  vitesse), `IsoInsertDesignation`, données de la famille, scénario axe « choix fait ».
- **Tranche 11 — intérieur (alésage)** : données seules (le rendu ISO existe).
- **Tranche 12 — gorge et tronçonnage** : `DescribedInsert`, données.
- **Tranche 13 — filetage** ; **Tranche 14 — perçage** : données seules.

Chaque tranche passe sans les suivantes : les PR 5 et 6+ ne cassent rien des précédentes, l'état
`unavailable` reste vrai pour tout couple non saisi.

### Vérifications (Verify)

- Gates du Dockerfile (`pnpm install --frozen-lockfile`, `pnpm run build --configuration
  production`), `pnpm lint`, `pnpm test` (lire `$?`), `pnpm run format:check`, job `a11y`.
- `dist/…/browser/atelier/index.html` : `h1`, titre, description, canonical, JSON-LD ; **pas** de
  `atelier/plaquettes/index.html`.
- Image Docker : `curl -I /atelier/` 200 sans `X-Cache-Status` (fichier) ;
  `curl -I '/atelier/plaquettes?matiere=<slug>&operation=<slug>'` 200 avec `X-Cache-Status`, et le
  corps contient la fiche demandée **sans JavaScript** (`curl` puis `grep` du `data-testid` du
  panneau) ; slug inconnu → 200, rien de sélectionné.
- Fonctionnel après hydratation (CLAUDE.md, leçon : un HTML SSR n'est pas une preuve) : taper une
  désignation, flèche bas, Entrée → fiche affichée et URL mise à jour ; retour arrière ne recharge
  pas de sélection fantôme.
- Lecteur d'écran (Orca ou VoiceOver) sur le champ : nombre de suggestions, option active, annonce
  du panneau.
- À l'œil : 375 px (pas de défilement horizontal, cibles 44 px), 1 024 px (menu sur une ligne avec
  quatre liens), clair et sombre, `forced-colors` (pastille ISO bordée, texte lisible).
- Production après merge : `/atelier` et `/atelier/plaquettes` 200, sitemap qui les liste,
  Lighthouse mobile > 95.

### Risques & inconnues

- **Granularité de la source** (hypothèse couplée à valider, question 9) : le modèle suppose que
  Julien accepte de rattacher explicitement une recommandation à chaque matière qu'elle couvre. Si
  Sandvik Coromant recommande par groupe ou sous-groupe de matière sans nommer l'alliage, ce
  rattachement est une lecture de la source, à tracer dans le `locator` ; sinon l'état `unavailable`
  domine longtemps.
- **Signal Forms** : radios et contrôles personnalisés via `FormValueControl` sont couverts par le
  précédent admin pour le combobox, pas pour un groupe de radios dans un contrôle personnalisé ; à
  vérifier en tranche 9 (repli : `(change)` sur des radios natifs, comme un `<select>` de filtre).
- **Verrous typographiques** sur du texte technique (unités, nombres, codes ISO) : faux positifs
  possibles à la première saisie, à régler par la typographie (espace fine) plutôt qu'en relâchant
  le verrou ; ordre de merge à annoncer si une PR de la spec 033 ou de V2 touche `header.ts`,
  `footer.ts` ou le `Dockerfile` en même temps.

### Questions à Julien

1. **Intro de l'accueil** (PR 3, bloquante) : deux à quatre phrases sur le métier et sur ce que tu
   mettras dans l'atelier. Les formulations interdites du verrou s'appliquent (« métallurgie »,
   « 20 ans », « Je suis tourneur CN », « CDI », « missions »…).
2. **Carte du guide** : sur-titre « Outil » et titre « Guide des plaquettes » te vont-ils ? Veux-tu une
   phrase de résumé sur la carte (elle demanderait une entrée `summary` optionnelle à `LinkCard`,
   donc une retouche de `shared/ui`) ?
3. **Ordre de merge** : la PR 3 peut partir avant la PR 5, avec un accueil sans carte pendant
   l'intervalle ; ou tu préfères la garder ouverte jusqu'à ce que la PR 5 soit prête ?
4. **SEO** : valides-tu les deux titres et les deux descriptions proposés, et « L'atelier » en dernier
   dans le menu ?
5. **Chemin** : `/atelier/plaquettes` te va-t-il (plutôt que `/atelier/guide-des-plaquettes`) ? Il
   sera figé une fois partagé.
6. **Copie d'interface** : valides-tu les libellés proposés, dont l'avertissement ?
7. **Couleurs ISO 513** : DESIGN.md n'autorise qu'un accent (One Orange Rule, ADR-0030). Afficher la
   couleur des groupes ajoute une troisième exception bornée (dans le badge de groupe seulement, en
   pastille bordée, jamais seule). D'accord, ou lettre et nom seuls ?
8. **Sources** : pour chaque document Sandvik Coromant cité (classification et correspondances des
   matières, catalogue de tournage, page « désignation » ISO 1832), le titre exact, l'URL et la date
   de consultation. Une version imprimée ou PDF datée te sert-elle de référence ?
9. **Granularité** (hypothèse du modèle) : quand la source donne une recommandation pour un groupe ou
   sous-groupe de matières, acceptes-tu de la rattacher nommément à chaque matière vérifiée de ce
   groupe, en le disant dans la citation ? Ou ne publie-t-on que ce que la source nomme alliage par
   alliage ?
10. **Vitesse de coupe** : quand la source donne plusieurs plages (selon la nuance, l'avance ou la
    profondeur), laquelle affiche-t-on, et faut-il dire la condition à côté ?
11. **Matières de la PR 5** : la PR 5 part-elle avec les matières déjà vérifiées (même peu), ou
    attend-elle la liste complète du référentiel ?

## Plan de test

Domaine pur, sans TestBed, fixtures manifestement fictives (`ZZ-FICTIF-1`, `TEST-002`, « Alliage
essai Alpha », source fictive, `locator: 'fixture'`). `fast-check` absent du dépôt : pas de test par
propriétés, idempotence en `it.each`.

### Tranche 4 — une désignation tapée n'importe comment retrouve sa matière

Builders : `src/app/features/workshop/testing/insert-guide-builders.ts` — `aCitation()`,
`aSourced(value)`, `aDesignation(value, system)`, `aMaterial(overrides)`. `aRecommendation()` et
`aReference()` viendront avec leurs modèles (tranche 6), pas avant.

`domain/normalize-designation.spec.ts` (16 tests)
- `it.each` « Given <cas> When the designation is normalized Then it gives <attendu> » : majuscules,
  accents (`Éprouvette fîctive ç` → `eprouvettefictivec`), espaces, espace insécable U+00A0, espace
  fine insécable U+202F, tiret `-`, trait d'union U+2010, demi-cadratin U+2013, points conservés
  (`9.99.01`), tout combiné (`zzfictif1.0`), texte blanc → `''`. Égalité stricte `toBe`.
- `it.each` idempotence sur 5 entrées : `f(f(x)) === f(x)`.

`domain/search-materials.spec.ts` (15 tests)
- Un système de désignation par cas (`common-name`, `en-symbol`, `material-number`, `aisi`, `uns`,
  `afnor-legacy`), saisie volontairement salie (casse, insécable, tiret, espaces) → exactement
  `[{ material, matched }]`, la désignation trouvée étant celle du système.
- Plusieurs désignations correspondent → une seule suggestion, la première qui a trouvé.
- Classement : préfixe avant contenu, chaque groupe dans l'ordre du référentiel (ordre choisi pour
  différer de l'ordre alphabétique) ; une matière dont une désignation contient et une autre commence
  est classée en préfixe, avec la désignation préfixe ; deux désignations qui contiennent → la
  première.
- Saisie accentuée, en majuscules et avec tiret (`BLÔC-D`) → mêmes résultats que la saisie nue.
- Requête vide ou blanche (`''`, espaces, insécable, ` - `) → toutes les matières, ordre du
  référentiel, `matched` = première désignation (nom affiché).
- Aucune correspondance → `[]` ; référentiel vide → `[]`.

`domain/reference-integrity.spec.ts`, bloc `MATERIALS` (3 tests, sur les données réelles, vides à ce
stade donc verts dès que le module existe)
- Slugs uniques et au format `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
- Aucune désignation normalisée partagée par deux matières.
- Aucun texte blanc (valeurs de désignation et de comportement, `locator` de chaque citation).

Non couverts dans cette tranche, à trancher : le format propre à chaque système de désignation
(motifs non fixés par le plan, à valider par Julien avant d'écrire une regex) ; « chaque groupe ISO
cité a son entrée » (dépend de `ISO_513_GROUPS`, tranche 5) ; l'ajout de `MATERIALS` à
`EDITORIAL_SOURCES` (même tranche que la garde de texte libre).

Scaffold dû au GREEN (code applicatif, hors mandat `qa`) : `domain/models/source.model.ts`
(`SourceId`, `SourceCitation`, `Sourced<T>`), `domain/models/material.model.ts` (`IsoGroupLetter`,
`DesignationSystem`, `Designation`, `Material`, `MaterialSuggestion`), `domain/materials.static-data.ts`
(`MATERIALS: readonly Material[]`), `domain/normalize-designation.ts`, `domain/search-materials.ts`.

RED, commande du profil `pnpm test`, cache invalidé (`ng cache clean`, `node_modules/.vite`) :
- état livré (modules absents) : le build échoue sur `TS2307 Cannot find module` pour les cinq
  fichiers ci-dessus, et seulement sur eux (plus les `any` implicites qui en découlent), code de
  sortie 1 ;
- mesure des assertions, avec des stubs temporaires typés selon le plan (identité, `[]`, `MATERIALS`
  vide), retirés ensuite : RED confirmé via la commande test du profil le 2026-10-25 21:12,
  23 failed / 4447 total (Test Files 2 failed | 229 passed), code de sortie 1. Les 23 échecs sont
  des `AssertionError` (`toBe` / `toEqual`), aucune erreur de harnais. Les 11 autres tests de la
  tranche passent face aux stubs par construction (idempotence de l'identité, intégrité d'un
  référentiel vide, référentiel vide → `[]`) ; les 4413 tests des suites existantes restent verts.

### Tranche 5 — une donnée sans source ne compile pas

Builders étendus (`testing/insert-guide-builders.ts`) : `aSource(overrides)` (titre, éditeur,
URL `https://exemple.invalid/…`, date `2001-01-01`, tous fictifs) et `anIsoGroup(letter, overrides)`
(nom et couleur sourcés, couleur fictive convertie comme l'identifiant de source fictif).

`domain/reference-types.spec.ts` (18 tests, garanties de compilation, `// @ts-expect-error: <raison>`)
- Catalogue : `SOURCES` a exactement le type `Readonly<Record<SourceId, Source>>`
  (`expectTypeOf`), donc un identifiant sans entrée ne compile pas. **RED** (module absent).
- Source : URL `http://` refusée, date de consultation absente refusée, éditeur absent refusé.
  **RED** (`Source` absent).
- Groupe ISO : lettre hors des six, nom non sourcé, couleur hors de l'union fermée, couleur non
  sourcée : refusés. **RED** (`IsoGroup`, `IsoGroupColor` absents).
- Verts d'emblée, ne comptent pas comme RED (types de la tranche 4 qui refusent déjà) : valeur sans
  citation, source hors catalogue (vrai tant que `SourceId` vaut `never`, et après la saisie pour
  tout identifiant non catalogué), citation sans `locator`, matière sans désignation, sans
  comportement, groupe hors des six lettres, groupe non sourcé, désignation non sourcée, système de
  désignation inconnu, ligne de comportement non sourcée.

`domain/reference-integrity.spec.ts`, bloc `SOURCES` (17 tests)
- Données réelles : aucune source du catalogue n'a de défaut (vrai sur le catalogue vide, il protège
  la saisie).
- Contrôle sur fixtures, pour prouver que la garde mord : une source fictive bien formée n'a aucun
  défaut ; `it.each` de 9 sources fictives qui citent une IA (titre Gemini, ChatGPT, Claude,
  Copilot, « Référentiel des alliages » ; éditeur « Intelligence artificielle », « … IA … »,
  OpenAI ; URL `gemini.google.com`) → exactement `['ai']` ; `it.each` de 6 défauts de format
  (titre blanc, éditeur insécable seul, URL sans hôte, URL qui ne se lit pas, date `01/01/2001`,
  date inexistante `2001-02-30`) → exactement le défaut attendu. Ces 16 tests passent par
  construction dès que `Source` existe : le contrôle vit dans la spec, il n'y a pas de code
  applicatif à juger.

Non couvert, **bloqué** : `ISO_513_GROUPS` réel et l'invariant « chaque groupe ISO cité par une
matière a son entrée ». Le nom et la couleur d'un groupe sont des `Sourced<…>` et `SourceId` vaut
`never` : aucune entrée ne se construit sans inventer une source ni sans conversion de type, et
`IsoGroupColor` (union remplie à la saisie) est vide aussi. Aucun test n'importe donc
`ISO_513_GROUPS` dans cette tranche ; décision demandée à la session principale.

Scaffold dû au GREEN (code applicatif) : `Source` dans `domain/models/source.model.ts` ;
`IsoGroupColor` et `IsoGroup` dans `domain/models/material.model.ts` ;
`domain/sources.static-data.ts` (`SOURCES`).

RED, commande du profil `pnpm test`, cache invalidé (`ng cache clean`, `node_modules/.vite`) :
- état livré : RED confirmé via la commande test du profil le 2026-10-25 21:33, 8 failed / 18 total
  sur les garanties de compilation de la tranche (7 directives `@ts-expect-error` inutilisées,
  TS2578, et l'`expectTypeOf` du catalogue, TS2307), code de sortie 1. Les seules autres erreurs du
  build sont les symboles du scaffold (TS2305, TS2724, TS2307) ; aucune erreur de format ni de
  lint (`prettier --check`, `eslint` verts sur `features/workshop`).
- discriminance, avec des stubs plus lâches que le plan (`url: string`, `publisher` et
  `consultedOn` optionnels, `letter: string`, nom et couleur `string` acceptés,
  `Record<string, Source>`), retirés ensuite : les mêmes 8 garanties tombent, une par contrainte.
- non-régression, avec des stubs typés selon le plan (`IsoGroupColor = never`, `SOURCES = {}`),
  retirés ensuite : 4483 passed / 4483 total, code de sortie 0. Les 10 garanties vertes d'emblée et
  les 17 tests d'intégrité passent, les tests de la tranche 4 restent verts.

### Tranche 6 — une combinaison sans recommandation le dit

Builders étendus (`testing/insert-guide-builders.ts`) : `anOperation(id, overrides)`,
`anOperationFamily(overrides)`, `anIsoInsert()`, `aDescribedInsert()`,
`aRecommendation(operation, overrides)` (type `RecommendationFor<O>` : l'opération garde son type
littéral, donc la forme de plaquette qu'impose `InsertFor<O>`), `aReference(overrides)` (six groupes
fictifs, une famille, une matière, aucune entrée).

Proposés dans les tests, à valider par Julien : slugs d'opération `ebauche-exterieure`,
`semi-finition-exterieure`, `finition-exterieure`, `ebauche-interieure`, `finition-interieure`,
`gorge`, `tronconnage`, `filetage`, `percage` ; libellés d'opération de la spec avec une majuscule
initiale (« Ébauche », « Perçage au foret à plaquettes »), puisqu'ils s'affichent seuls à côté d'un
bouton radio.

`domain/operations.static-data.spec.ts` (2 tests)
- Type exact `readonly OperationFamily[]` (`expectTypeOf`).
- Golden `toEqual` : cinq familles et neuf opérations dans l'ordre du tableau du Parcours, avec
  identifiant, slug et libellé. **RED**.

`domain/guide-selection.spec.ts` (17 tests, fixture de deux matières et trois opérations fictives)
- `it.each` de 3 couples connus → les deux slugs retenus tels quels. **RED**.
- `it.each` de 6 matières non retenues (absente, vide, inconnue, autre casse, entourée d'espaces,
  slug d'opération) → `material: ''`, l'opération connue gardée. **RED**.
- `it.each` de 7 opérations non retenues (mêmes cas, plus un slug de matière et l'identifiant
  `external-roughing` au lieu du slug) → `operation: ''`, la matière gardée. **RED**.
- Référentiel vide → les deux à `''`. Passe face au stub par construction.

`domain/find-recommendation.spec.ts` (20 tests ; Alpha et Beta du groupe P, Gamma du groupe S ;
entrées Alpha × finition, Alpha + Gamma × gorge, Gamma × finition)
- `findRecommendation`, `it.each` de 4 couples couverts → l'entrée exacte (`toBe`), y compris les
  deux matières d'une entrée multi-matières. **RED**.
- `findRecommendation`, `it.each` de 4 couples non couverts (opération sans entrée, matière
  inconnue, Beta du même groupe P qu'Alpha, matière vide) et la liste vide → `undefined`. Passent
  face au stub par construction.
- `resolveGuideState`, `it.each` de 5 cas `incomplete` (rien, matière seule, opération seule, matière
  ou opération hors du référentiel) → exactement `{ status: 'incomplete' }`. Passent face au stub par
  construction.
- `unavailable` : Beta × gorge ; référentiel sans entrée ; Beta × finition, voisine d'Alpha dans le
  groupe P, sans rien lui emprunter → `{ status: 'unavailable', material, operation }` exact. **RED**.
- `available`, `it.each` de 3 couples → `{ status: 'available', material, operation, entry }` exact.
  **RED**.

`domain/reference-types.spec.ts` (13 garanties ajoutées, `// @ts-expect-error: <raison>` ou
`expectTypeOf`) : opération d'identifiant inconnu, famille sans opération, famille d'identifiant
inconnu ; `RECOMMENDATIONS` de type exact `readonly RecommendationEntry[]` ; `InsertFor<…>` des cinq
opérations de tournage = `IsoInsertDesignation`, des quatre autres = `DescribedInsert` ; désignation
ISO refusée pour une gorge ; description refusée pour une finition extérieure ; entrée sans matière ;
entrée d'opération inconnue ; géométrie non sourcée ; vitesse dans une autre unité que `m/min` ; état
`available` sans entrée. **RED** à la compilation (types absents).

`domain/reference-integrity.spec.ts`
- Bloc `RECOMMENDATIONS` (19 tests). Données réelles : aucune entrée n'a de défaut (matière inconnue,
  couple couvert deux fois, vitesse hors de `0 < min ≤ max` ou non finie, texte blanc, `locator`
  compris). Contrôles sur fixtures : 4 jeux sains (aucune entrée, entrée sans vitesse, plage d'une
  seule valeur, une matière dans deux opérations et deux matières dans une) → `[]` ; 14 jeux fautifs
  → exactement le défaut attendu.
- Bloc `commercial names` (9 tests) : `/sandvik/iu` et `/\bCoro\p{Lu}/u` sur tout le texte de
  `MATERIALS`, `OPERATION_FAMILIES` et `RECOMMENDATIONS`, identifiants de source cités (`cite.source`)
  exceptés ; contrôles : signalé dans une valeur, en capitales, sur un nom de produit, dans un
  `locator` ; non signalé : « Corrosion », « Coromandel », un identifiant de source.
- Ces 28 tests passent dès que les modules existent : le contrôle vit dans la spec, il n'y a pas de
  code applicatif à juger.

`src/app/testing/editorial-sources.ts` : `MATERIALS`, `OPERATION_FAMILIES`, `RECOMMENDATIONS`
ajoutés à `EDITORIAL_SOURCES`, soit 75 lignes de plus dans les verrous (typographie 3, identité et
vouvoiement 72), vertes face aux données de la spec. `editorial-identity.spec.ts` lit en plus chaque
fichier applicatif non-spec de `features/workshop` : 7 lignes de plus pour les 7 fichiers du scaffold.

Non couvert, **en attente de décision** : la garde de confidentialité sur le texte libre du
référentiel. `findConfidentialReferences` n'existe pas dans le dépôt (tranche 3, PR 3, non
commencée).

Scaffold dû au GREEN (code applicatif) : `domain/models/operation.model.ts` (`OperationFamilyId`,
`OperationId`, `Operation`, `OperationFamily`) ; `domain/models/recommendation.model.ts`
(`IsoInsertDesignation`, `DescribedInsert`, `InsertFor`, `CuttingSpeedRange`,
`RecommendationEntry`, `GuideState`) ; `domain/models/insert-guide-reference.model.ts`
(`InsertGuideReference`) ; `domain/operations.static-data.ts` ; `domain/recommendations.static-data.ts`
(vide) ; `domain/guide-selection.ts` ; `domain/find-recommendation.ts`.

RED, commande du profil `pnpm test`, cache invalidé (`ng cache clean`, `node_modules/.vite`) :
- état livré : le build échoue sur `TS2307 Cannot find module` pour les sept fichiers du scaffold, et
  seulement sur eux (plus les `TS2578` et `TS7006` qui en découlent), code de sortie 1 ;
  `prettier --check` et `eslint` verts sur `features/workshop` et `editorial-sources.ts`.
- mesure des assertions, avec des stubs temporaires typés selon le plan (`{ material: '',
  operation: '' }`, `undefined`, `{ status: 'incomplete' }`, `OPERATION_FAMILIES` et
  `RECOMMENDATIONS` vides), retirés ensuite : RED confirmé via la commande test du profil le
  2026-10-25 21:47, 27 failed / 4645 total (Test Files 3 failed | 232 passed), code de sortie 1.
  Les 27 échecs sont des `AssertionError` (`toEqual` / `toBe`), aucune erreur de harnais. Les 13
  garanties de compilation passent face à ces stubs ; les 4483 tests des tranches 4 et 5 et des
  suites existantes restent verts.
- discriminance des garanties de compilation : dix relâchements des types stubés, un à la fois
  (`InsertFor` non conditionnel, matières en tableau simple, opération ou identifiants ouverts à
  `string`, géométrie non sourcée, unité libre, `entry` optionnelle, famille vide permise,
  `RECOMMENDATIONS` typé `unknown[]`) : chaque garantie tombe sous le sien (`TS2578`, `TS2344`).

## Journal des tranches

- **Tranche 4 — une désignation tapée n'importe comment retrouve sa matière** : GREEN 4447 passed / 4447 total (au premier cycle), code de sortie 0 · refactor : retrait d'un échappement redondant dans `normalizeDesignation` (`\s` couvre déjà U+00A0 et U+202F en JavaScript) ; diff relu, aucune autre simplification trouvée. Verify reportée : domaine pur, aucune surface atteignable restructurée. Écart : `SourceId` vaut `never` (union fermée sans membre tant qu'aucune source n'est saisie), `Source` non créé (aucun test ne l'exige, il arrive avec `SOURCES` en tranche 5).
- **Tranche 5 — une donnée sans source ne compile pas** : GREEN 4483 passed / 4483 total (au premier cycle), code de sortie 0 · refactor : aucun (diff de trois types et d'un catalogue vide relu, rien à simplifier). Verify reportée : domaine pur, aucune surface atteignable restructurée. Décision : `ISO_513_GROUPS` n'est pas créé ; avec `SourceId` à `never`, il n'existerait qu'avec une source inventée ou un type affaibli. Reporté à la première PR de données (première source Sandvik Coromant), avec sa garantie de type, le test « chaque groupe ISO cité par une matière a son entrée » et son ajout à `EDITORIAL_SOURCES`. `IsoGroupColor` vaut `never` et `SOURCES` est vide tant qu'aucune source n'est saisie.
- **Tranche 6 — une combinaison sans recommandation le dit** : GREEN 4645 passed / 4645 total (au premier cycle), code de sortie 0 · refactor : aucun (diff de la PR 4 relu en entier, rien à simplifier sans toucher aux tests). Verify reportée : domaine pur, aucune surface atteignable restructurée. Écarts : `InsertGuideReference` garde `isoGroups` (typé `Readonly<Record<IsoGroupLetter, IsoGroup>>`), parce que le builder `aReference` le remplit ; `IsoDesignationField` et `InsertAspect` restent privés au modèle (aucun consommateur hors du fichier) ; le type de la sélection, `GuideSelection`, est déclaré dans `guide-selection.ts` et repris par `resolveGuideState`. Décision : l'extension de `findConfidentialReferences` au texte libre du référentiel n'est pas faite dans la PR 4, parce que le référentiel est vide. Elle arrive avec la PR 3 (tranche 3), qui crée la fonction, et doit être en place avant la première donnée ; la PR 5 dépend donc de la PR 3.

## Review code

PR 4 (tranches 4 à 6), `git diff origin/master...HEAD` (`35ef862`, `294b178`, `ed89943`), revue du 2026-10-25.

**Verdict** : REJECTED
**Gates CI locaux** : `pnpm install --frozen-lockfile` 0 / `pnpm run build --configuration production` 0 / `pnpm test` 0 (235 fichiers, 4645 passed / 4645) / `pnpm lint` 0 / `pnpm run format:check` 0
**Checks mécaniques** : checker non vendoré (`.claude/checks/` absent) : auto-checks joués à la main. Archéologie 0 hit ; import Angular/RxJS dans `features/workshop/domain` 0 ; `fakeAsync`/`.only`/`.skip`/snapshot/`getByTestId`/`innerHTML`/`console` 0 ; Gemini, Sandvik, `Coro[A-Z]` hors `reference-integrity.spec.ts` 0 ; données réelles (désignations du Constat) 0.
**Warnings de gate** : (b) pré-existant hors diff : `pnpm install`, « Ignored build scripts: @parcel/watcher, @sentry/cli, lmdb, msgpackr-extract » (lockfile non touché). Build, test, lint : aucun.
**Rendu compilé** : N/A
**Preuve de verify runtime** : N/A (exception : code non atteint par le bundle ; aucune route, aucun `app.routes*`, aucun `package.json` modifié ; `dist/angular-portfolio-app` ne contient aucune chaîne du référentiel ; seul consommateur hors domaine : `src/app/testing/editorial-sources.ts`, test-only)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ❌
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ✅

**Tests notables** :
- ✨ `reference-integrity.spec.ts:74-103`, `:204-338`, `:363-396` : chaque garde sur les données réelles (vides) est doublée de contrôles sur fixtures qui prouvent qu'elle mord ; sans eux, ces tests seraient verts par construction.
- ✨ `find-recommendation.spec.ts:158-165` : l'absence de repli par groupe ISO est épinglée par un voisin du même groupe.

**Points à corriger** :
1. `src/app/features/workshop/testing/insert-guide-builders.ts:97` : `export type RecommendationFor<O>` n'a aucun consommateur hors du fichier (seul usage : type de retour de `aRecommendation`, l. 107) et le projet n'émet pas de déclarations. Retirer l'`export`.

**Suite (2026-10-25)** : point 1 corrigé (`export` retiré, session principale) ; gates rejouées avant la PR.
