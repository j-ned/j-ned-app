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
  `INSERT_GUIDE_REFERENCE` reporté à la tranche 8 (décision du 2026-10-26) : rien dans cette tranche
  ne lit le référentiel, et le token ne se construit pas tant qu'`isoGroups` est vide.
- **Tranche 8 — je choisis ma matière au clavier, et l'URL la garde** : `MaterialCombobox`,
  `MaterialSheet`, `IsoGroupBadge`, `SourceCitation`, modèle et `form()`, input `matiere`, effet
  d'URL ; tokens ISO si validés.
  Décision du 2026-10-26 (option A) : `isoGroups` sort d'`InsertGuideReference` et du builder
  `aReference` jusqu'à la première PR de données, qui crée `ISO_513_GROUPS` avec sa source Sandvik
  Coromant et le remet ; `INSERT_GUIDE_REFERENCE` est créé ici, sans cast. `IsoGroupBadge` affiche la
  lettre (`material.isoGroup.value`) en pastille neutre, précédée de « Groupe ISO » ; le nom du groupe
  viendra avec `ISO_513_GROUPS`. Aucun token ISO (réponse 5).
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

### Réponses de Julien (2026-10-25)

1. **Intro de l'accueil** (question 1), texte retenu mot pour mot (la typographie du site, espaces
   fines et apostrophes, s'applique) :
   > À l'atelier comme dans le code, une règle tient tout : une pièce hors tolérance ne part pas.
   > Cet espace rassemble ce que j'apprends derrière mon tour CN, mis en forme en outils et en fiches
   > que tu peux utiliser. Que tu sois dev curieux ou usineur qui débute, prends ce qui te sert.
2. **Ordre de merge** (question 3) : la PR 3 reste ouverte en brouillon jusqu'à ce que la PR 5 soit
   prête ; l'atelier apparaît en ligne avec son guide. Au merge, la PR 3 passe d'abord, la PR 5 est
   re-ciblée sur `master` avant le sien (jamais de PR empilée au moment du merge).
3. **SEO de l'accueil** (question 4, partie accueil) : titre, description et « L'atelier » en dernier
   dans le menu validés tels quels.
4. **Slugs d'URL des opérations** (arbitré pour Julien, à sa demande) : ceux de `OPERATION_FAMILIES`
   sont retenus, sauf `percage`, qui devient **`percage-plaquettes`** pour laisser la place à un
   perçage au foret monobloc sans changer une URL déjà partagée. À appliquer en PR 5 (constante et
   test golden), avant toute mise en ligne du guide.
5. **Couleurs ISO 513** (question 7, arbitré pour Julien) : **lettre et nom seuls, sans couleur**.
   La couleur du groupe S se confondrait avec l'accent orange (ADR-0030), une couleur ne porte
   jamais seule l'information, et chaque couleur demanderait une source. En PR 5 : `IsoGroupColor`
   et le champ `color` d'`IsoGroup` sont retirés, aucun token `--color-iso-*`, aucune exception à la
   One Orange Rule. `IsoGroupBadge` affiche la lettre en pastille neutre et le nom.
6. **Carte du guide** (question 2, arbitré pour Julien) : sur-titre « Outil », titre « Guide des
   plaquettes », et un résumé : « Choisis ta matière et ton opération : le guide t'indique le type
   de plaquette à prendre. » (typographie du site appliquée). `LinkCard` gagne une entrée `summary`
   optionnelle (`text-muted`, sous le titre), documentée dans `DESIGN.md` § 5 ; sans `summary`, la
   carte reste inchangée pour ses usages actuels.

### Décisions de Julien (2026-10-26) : données du tournage

Après lecture du site Sandvik Coromant et d'une recherche sourcée sur les fabricants
(`specs/assets/034/referentiel-plaquettes-tournage.md`) :

7. **Ce que fait le guide** : à partir de la matière saisie, proposer des **types de plaquettes en code
   ISO** (CNMG, WNMG, CCGT, VBMT…), sans marque.
8. **Périmètre de la première mise en ligne** : tournage extérieur (ébauche, semi-finition, finition) et
   intérieur (ébauche, finition). Gorge, tronçonnage, filetage et perçage plus tard, après lecture des
   pages Sandvik dédiées. Fraisage hors périmètre.
9. **Publication sans relecture de Julien** : chaque donnée part avec sa source, sans validation ligne
   par ligne. Remplace la case « vérifiée par Julien » d'ADR-0033 décision 4 pour les données du guide
   (amendement d'ADR-0033).
10. **Codes déduits, dits déduits** : aucun fabricant ne publie de code par matière et par opération.
    Un code peut s'afficher s'il est **déduit d'un principe écrit par le fabricant** ; il porte alors la
    mention visible « déduit des principes du fabricant » et cite la page du principe. Un code écrit
    explicitement par une source s'affiche sans cette mention.
11. **Conseil de groupe** : un conseil écrit pour un groupe ou sous-groupe ISO est rattaché à chaque
    matière de ce groupe, avec la mention « conseil du groupe » dans la citation.
12. **Matières et désignations** : la liste de Julien est reprise telle quelle ; ses correspondances
    (EN, numéro, AISI, AFNOR) sont affichées comme **correspondances indicatives**, non vérifiées sur
    une norme. Le groupe ISO de chaque matière est rattaché aux définitions de groupe de Sandvik.
13. **Aucune vitesse de coupe affichée** : le guide renvoie au calculateur du fabricant.
14. **Plusieurs codes par opération, selon la situation** (2026-10-26, après la première saisie) : un
    même code pour l'ébauche, la semi-finition et la finition est fidèle aux sources mais pauvre. Le
    fabricant écrit la **forme** par type de situation (chariotage avec ou sans épaulement, copiage,
    copiage à forte plongée, dressage ; intérieur avec épaulement, arête plus robuste, copiage) : chaque
    opération propose 2 ou 3 codes selon la situation, la lettre de forme citée comme écrite, le reste
    du code comme déduit.
15. **Liste de travail de Julien** : source **sans lien** (pas d'URL publique) ; jamais pointée sur le
    site lui-même.
16. **Classement des matières** : quand la liste de Julien et Sandvik divergent, le classement de Sandvik
    (« Matériaux de pièce ») l'emporte, par exemple Stellite 6 en H et X20Cr13 en P (inox ferritiques et
    martensitiques, sous-groupe P5 : l'exemple « X20Cr13 en M » donné le 2026-10-26 lisait mal la
    page, corrigé après la revue).
17. **Conseils par sous-groupe** (2026-10-26, après la revue) : une recommandation couvre le
    sous-groupe que la page du fabricant traite (inox austénitiques, duplex, ferritiques et
    martensitiques, aciers trempés…), jamais le groupe entier par extension. Un sous-groupe cite **une
    seule** section de « Tournage de différentes matières » : les aciers non alliés et les aciers
    faiblement alliés sont deux sous-groupes (re-revue). Une matière dont le sous-groupe n'a pas de
    section (aciers de décolletage, 17-4 PH, Stellite 6) affiche « pas encore de recommandation ».

## Plan de test

Domaine pur, sans TestBed, fixtures manifestement fictives (`ZZ-FICTIF-1`, `TEST-002`, « Alliage
essai Alpha », source fictive, `locator: 'fixture'`). `fast-check` absent du dépôt : pas de test par
propriétés, idempotence en `it.each`.

### Tranche 1 — l'accueil de l'atelier existe et se trouve

Le texte de l'intro n'est réécrit dans aucun test : la page est comparée à `WORKSHOP_SPACE.intro`,
et la constante est jugée par les verrous éditoriaux (typographie, formulations interdites,
vouvoiement) via `EDITORIAL_SOURCES`. Seuls le titre et la description SEO, validés par Julien,
sont épinglés mot pour mot.

`features/workshop/domain/workshop-space.static-data.spec.ts` (3 tests)
- Type exact `WorkshopSpace` (`expectTypeOf`). Vert d'emblée dès que le module existe.
- `heading` vaut « L'atelier » (apostrophe droite, norme du site). **RED**.
- Aucun paragraphe d'intro vide ni entouré d'espaces. Vert d'emblée dès que le module existe.

`features/workshop/pages/workshop/workshop.spec.ts` (3 tests, TestBed, `provideRouter([])`,
`await fixture.whenStable()`)
- Un seul `h1`, porteur de `data-testid="workshop-title"`, de texte `WORKSHOP_SPACE.heading`. **RED**.
- Chaque `[data-testid="workshop-intro"]` est un `<p>` ; leurs textes valent `WORKSHOP_SPACE.intro`,
  dans l'ordre. **RED**.
- Aucun `main`, `header` ni `footer` dans la page ; classes de l'hôte exactement `block min-h-svh
  pt-20`. **RED**.

`src/app/app.routes.workshop.spec.ts` (6 tests)
- Navigation vers `/atelier` avec les routes réelles → URL `/atelier`, feuille `atelier`, composant
  `Workshop` (pas la 404). **RED**.
- Route de premier niveau chargée à la demande : ni `component` ni `loadChildren`,
  `loadComponent()` rend `Workshop`. **RED**.
- Titre d'onglet `L'atelier : outils de tourneur CN | Julien Nédellec`. **RED**.
- `data` exacte (`toEqual`) : `preload: true` et `seo` = titre, description validée, `url`
  canonique `${siteUrl}/atelier`, `type: 'website'`, `BreadcrumbList` Accueil → L'atelier ; donc
  ni `keywords` ni image propre. **RED**.
- Description de 1 à 160 caractères. **RED**.
- `ROUTE_TEXTS['/atelier']` porte le titre et le SEO : les verrous éditoriaux lisent la route.
  **RED**.

Suites existantes adaptées (même RED)
- `app.routes.server.spec.ts` : `atelier` ajouté au `it.each` des pages prérendues. **RED**. Le test
  « exactly the content routes » reste tel quel : `atelier` n'est pas en `Server`.
- `src/server/feeds/sitemap.spec.ts` : `/atelier` inséré après `/about` dans l'ordre attendu, sept
  pages statiques au lieu de six, et un test neuf pour son entrée (`monthly`, `0.8`, datée du
  démarrage). **RED** (3 tests).
- `src/app/testing/editorial-sources.ts` : `['WORKSHOP_SPACE', WORKSHOP_SPACE]`, soit 25 lignes de
  plus dans les verrous (typographie 1, formulations interdites 23, vouvoiement 1), plus 3 lignes du
  verrou de vouvoiement sur fichiers, qui lit d'office les trois fichiers du scaffold. Elles jugent
  le texte de Julien au GREEN ; face à un stub, elles passent par construction.
- `e2e/a11y/scenarios.ts` : `{ path: '/atelier', ready: 'workshop-title' }` dans `PUBLIC_PAGES`
  (clair et sombre, Playwright, hors `pnpm test` ; `pnpm a11y:typecheck` vert).

Sweep : `confidentialite`, `mentions-legales`, `sitemap`, `Prerender`, `atelier`, `workshop`
cherchés dans `src/`, `e2e/`, `ci/` ; seuls `sitemap.spec.ts` et `app.routes.server.spec.ts`
encodent la liste des pages statiques. `feed-handler.spec.ts` ne vérifie que des URL de contenu, il
reste vert.

Non couvert, à trancher : la section « Les outils » (`toolsHeading`, grille de cartes). Avec
`tools` vide, une section titrée sans contenu n'a pas de sens ; aucun test ne l'exige ni ne
l'interdit dans cette tranche. Proposition : ne pas la rendre avant la tranche 7, qui l'ajoute avec
la carte du guide et ses tests (autant de cartes que `tools`, chaque `path` déclaré dans `routes`).

Scaffold dû au GREEN (code applicatif) : `domain/models/workshop-space.model.ts` (`WorkshopSpace`,
`WorkshopTool`, `WorkshopToolId`) ; `domain/workshop-space.static-data.ts` (`WORKSHOP_SPACE`, intro
de Julien, `tools: []`) ; `pages/workshop/workshop.ts` (`Workshop`, `app-workshop`) ; route
`atelier` dans `app.routes.ts` ; `atelier` en `Prerender` dans `app.routes.server.ts` ; `/atelier`
dans `STATIC_URLS` de `sitemap.ts`. Hors tests, au GREEN : job `verify` de `ci.yml`, `test -f
$browser/atelier/index.html` ; job `docker`, `/atelier/` en 200 avec `data-testid="workshop-title"`
dans le corps et sans `X-Cache-Status`.

RED, commande du profil `pnpm test`, cache invalidé (`ng cache clean`, `node_modules/.vite`) :
- état livré : le build échoue sur `TS2307 Cannot find module` pour les trois modules du scaffold,
  et seulement sur eux (plus les `TS7006` qui en découlent), code de sortie 1 ; `prettier --check`
  et `eslint` verts sur les fichiers touchés.
- mesure des assertions, avec des stubs temporaires typés selon le plan (`heading: ''`, une intro
  provisoire, `tools: []`, composant au gabarit vide, routes et sitemap inchangés), retirés ensuite :
  RED confirmé via la commande test du profil le 2026-10-25 22:30, 14 failed / 4687 total (Test
  Files 5 failed | 233 passed), code de sortie 1. Les 14 échecs sont des `AssertionError`, aucune
  erreur de harnais. Verts d'emblée face aux stubs : le type exact, l'intro non vide et les 28
  lignes des verrous ; les 4645 tests des suites existantes et des tranches 4 à 6 restent verts.

### Tranche 2 — on y arrive depuis le menu et le pied de page

Icône vérifiée : `lucide-wrench` → `{ id: 'wrench', style: 'solid' }` dans `icon-map.ts`, symbole
`solid-wrench` présent dans `public/icons/sprite.svg` ; pas de `pnpm icons:build`.

`src/app/layout/components/header/header.spec.ts` (suite existante adaptée, 2 tests recalibrés, 3
neufs)
- Ordre du menu : `NAV_LINKS` vaut exactement (`toEqual`, icônes comprises) Blog, Réalisations,
  Parcours, puis `{ label: "L'atelier", href: '/atelier', icons: 'lucide-wrench' }`. Recalibré
  (l'ancien n'épinglait que libellé et lien de trois entrées). **RED**.
- État actif en `it.each` sur `/blog` et `/atelier` : la nav desktop rend quatre liens, seul celui
  de l'URL courante porte `aria-current="page"` et la pilule `rounded-full bg-primary/8`. Le cas
  `/blog` est le test existant recalibré à quatre lignes ; le cas `/atelier` est neuf. **RED** (2).
- Drawer ouvert : la nav mobile compte quatre liens, le dernier pointe vers `/atelier`, libellé
  « L'atelier », icône dont le `use` vise `#solid-wrench`. **RED**.
- Drawer ouvert, clic sur « L'atelier » : le routeur atterrit sur `/atelier` et le drawer se ferme.
  **RED**.
- Le harnais de routes des tests d'état actif et de clic déclare ses destinations
  (`blog`, `projects`, `about`, `atelier`) au lieu de les dériver de `NAV_LINKS` : dérivées, la
  route `/atelier` manquait et l'échec était un `NG04002` du routeur, pas une assertion.
- Inchangé et vert : « dessert chaque destination de NAV_LINKS par un lien routé », dérivé de la
  constante.

`src/app/layout/components/footer/footer.spec.ts` (suite existante adaptée, 2 tests recalibrés, 1
cas neuf)
- Golden de `FOOTER_COPY` : `resources` gagne `workshop: "L'atelier"`. **RED**.
- Colonne Ressources : liens `/projects`, `/blog`, `/about`, `/atelier`, libellés Réalisations,
  Blog, Parcours, « L'atelier », rien d'autre. Libellés attendus écrits en clair : la constante est
  déjà épinglée par le golden, et `FOOTER_COPY.resources.workshop` n'existe pas avant le GREEN.
  **RED**.
- `it.each` d'atterrissage du routeur : cas `/atelier` ajouté. **RED**.

Sweep : `NAV_LINKS`, `FOOTER_COPY`, `nav-items`, `footer-resource-link`, `Navigation principale`
cherchés dans `src/`, `e2e/`, `ci/`. `editorial-sources.ts` porte déjà `NAV_LINKS` et `FOOTER_COPY` :
les verrous éditoriaux jugeront « L'atelier » au GREEN sans ajout. `editorial-identity.spec.ts` ne
lit que la tagline. `project-detail.spec.ts` (`navLinks`) parle d'une autre nav. Le scénario axe
`open mobile menu` couvre la nouvelle entrée du drawer sans changement.

Scaffold dû au GREEN : entrée `{ label: "L'atelier", href: '/atelier', icons: 'lucide-wrench' }` en
fin de `NAV_LINKS` ; `FOOTER_COPY.resources.workshop = "L'atelier"` ; lien `/atelier` après
`/about` dans `RESOURCE_LINKS` de `footer.ts`. À l'œil en Verify : menu desktop sur une ligne à
1 024 px.

RED confirmé via la commande test du profil le 2026-10-25 22:46, 8 failed / 4691 total (Test Files
2 failed | 236 passed), code de sortie 1, cache invalidé (`ng cache clean`, `node_modules/.vite`).
Les 8 échecs sont des `AssertionError` (5 dans `header.spec.ts`, 3 dans `footer.spec.ts`), aucune
erreur de harnais ni de type ; `eslint` et `prettier --check` verts sur les deux specs. Les 4683
autres tests restent verts, tranche 1 comprise. Un premier passage avait aussi fait tomber
`admin-post-editor.spec.ts` sur un délai de 5 s ; il passe au second, sans rapport avec ce diff.

### Tranche 3 — une référence de pièce ne peut pas partir

Exemples d'ADR-0032 §3 et du plan V1 de la spec 032 repris tels quels ; les ajouts sont fictifs.
Aucun nom d'employeur ni de client, dans aucun fichier.

`features/workshop/domain/confidential-references.spec.ts` (27 tests, sans TestBed)
- `it.each` de 13 textes signalés → exactement un fragment, non blanc, contenu dans le texte :
  `P/N 4521-07`, `PN: 88-123`, `réf. pièce`, `réf. plan`, `réf. client`, `plan n° 12`, `n° de plan`,
  `OF n° 3`, `indice C`, `indice 3`, `D23456789`, `12345` (borne des cinq chiffres), et une phrase
  qui contient `plan n° 12`. **RED** (13).
- `it.each` de 13 textes non signalés → `[]` : `AS9100`, `EN 9100`, `ISO 2768`, `Inconel 718`,
  `Ti-6Al-4V`, `7075-T6`, `Ø20 ±0,02`, `G71`, `M30`, `10 000 tr/min` avec U+202F, `1234` (borne),
  « L'indice de rugosité… » (« indice » suivi d'un mot, pas d'une lettre seule : proposé, l'ADR ne
  le tranche pas), texte vide. Verts face au stub par construction.
- Deux références dans un texte → deux fragments, non blancs, contenus, dans l'ordre du texte.
  **RED**.

`src/app/workshop-confidentiality.spec.ts` (16 tests). La garde lit chaque chaîne par
`editorialTexts` (même parcours que la garde des noms commerciaux) et n'exclut qu'un chemin :
`.designations[n].value`, contrôlée par son format (un UNS compte cinq chiffres). Tout le reste est
lu, `locator` des désignations compris : un champ de texte ajouté plus tard est gardé d'office.
- Données réelles, `it.each` sur `WORKSHOP_SPACE`, `MATERIALS`, `OPERATION_FAMILIES` (libellés de
  famille et d'opération), `RECOMMENDATIONS` → aucun chemin signalé. Verts par construction
  (référentiel vide, intro sans référence) ; ils jugeront la première donnée de la PR 5.
- Preuve que la garde mord, `it.each` de 11 fixtures fictives (builders du guide) → exactement le
  chemin attendu : paragraphe d'intro, comportement de matière, `locator` d'une désignation,
  géométrie, nuance, piège (le second d'une liste), aspect décrit, signification d'un champ ISO,
  `locator` d'une citation, libellé de famille, libellé d'opération. **RED** (11).
- Désignation UNS fictive à cinq chiffres (`X99999`) → non signalée. Vert face au stub par
  construction ; prouvé discriminant avec l'implémentation de contrôle ci-dessous.

Conséquence à connaître : un slug de matière ou un identifiant de source qui porterait cinq chiffres
consécutifs serait signalé ; il s'écrit avec un tiret.

Sweep : `findConfidentialReferences`, `confidential`, `EDITORIAL_SOURCES`, `editorialTexts` cherchés
dans `src/` ; aucune suite existante n'encode la garde, rien à adapter. `EDITORIAL_SOURCES` porte déjà
les quatre constantes ; aucun builder étendu.

Scaffold dû au GREEN (code applicatif) : `domain/confidential-references.ts`,
`findConfidentialReferences(text: string): readonly string[]`.

RED, commande du profil `pnpm test`, cache invalidé (`ng cache clean`, `node_modules/.vite`) :
- état livré : le build échoue sur `TS2307 Cannot find module` pour `confidential-references`
  (deux imports), plus un `TS7006` qui en découle, code de sortie 1 ; `prettier --check` et `eslint`
  verts sur les deux specs ; grep d'archéologie sans résultat.
- mesure des assertions, avec un stub temporaire typé selon le plan (retourne toujours `[]`), retiré
  ensuite : RED confirmé via la commande test du profil le 2026-10-25 22:56, 25 failed / 4735 total
  (Test Files 2 failed | 238 passed), code de sortie 1. Les 25 échecs sont des `AssertionError`
  (`toHaveLength`, `toEqual`), aucune erreur de harnais ni de type. Verts d'emblée face au stub : les
  13 textes non signalés, les 4 gardes sur données réelles et la désignation à cinq chiffres ; les
  4692 tests des suites existantes et des tranches 1, 2, 4 à 6 restent verts.
- contrôle de cohérence des fixtures : avec une implémentation jetable d'une seule expression
  régulière (cinq chiffres ou plus et les motifs de l'ADR), retirée ensuite, les 43 tests de la
  tranche passent au runner ciblé : le contrat est tenable et chaque fixture ne signale que son
  chemin.

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

### Tranche 7 — le guide existe et se trouve

Joué dans la même session, RED puis GREEN par le même agent (exception validée le 2026-10-25).
`INSERT_GUIDE_REFERENCE` n'en fait pas partie (décision du 2026-10-26, cf. journal) : aucun test de
la tranche ne lit le référentiel. Le titre et la description SEO du guide, l'avertissement et le
résumé de la carte sont épinglés mot pour mot ; le chapô reprend le résumé validé de la carte.

`features/workshop/domain/workshop-space.static-data.spec.ts` (2 tests ajoutés)
- `toolsHeading` vaut « Les outils ». **RED**.
- Golden de `tools` : une carte `insert-guide`, sur-titre « Outil », titre « Guide des plaquettes »,
  résumé validé (U+00A0 avant le deux-points), `path` `/atelier/plaquettes`. **RED**.

`features/workshop/pages/workshop/workshop.spec.ts` (2 tests ajoutés)
- `[data-testid="workshop-tools"]` est une `SECTION` dont l'`aria-labelledby` désigne un `H2` de
  texte `toolsHeading`. **RED**.
- Chaque `[data-testid="workshop-tool-card"]` est un `A` dont le `href` vaut `tool.path`, et dont les
  enfants portent, dans l'ordre, sur-titre, titre et résumé. Vert face au stub (`tools: []`) par
  construction ; le nombre de cartes est tenu par le golden ci-dessus.

`features/workshop/application/insert-guide-copy.spec.ts` (1 test) : golden de
`INSERT_GUIDE_COPY` (`heading`, `lead`, `disclaimer`). **RED**.

`features/workshop/pages/insert-guide/insert-guide.spec.ts` (5 tests, TestBed, `whenStable`)
- Un seul `h1`, `data-testid="insert-guide-title"`, texte `INSERT_GUIDE_COPY.heading`. **RED**.
- `insert-guide-lead` est un `P` de texte `lead`. **RED**.
- `insert-guide-disclaimer` est un `P` de texte `disclaimer`. **RED**.
- `insert-guide-status` porte `role="status"` et est vide. **RED**.
- Aucun `main`, `header` ni `footer` ; classes de l'hôte exactement `block min-h-svh pt-20`. **RED**.

`src/app/app.routes.workshop.spec.ts` (7 tests ajoutés)
- `/atelier/plaquettes?matiere=inconnue` avec les routes réelles → feuille `atelier/plaquettes`,
  composant `InsertGuide`. **RED**.
- Route de premier niveau, ni `component` ni `loadChildren`, `loadComponent()` rend `InsertGuide`.
  **RED**.
- Titre d'onglet `Guide des plaquettes de tournage | Julien Nédellec`. **RED**.
- `data` exacte : `seo` seul (pas de `preload`), description proposée, canonical
  `${siteUrl}/atelier/plaquettes` sans query string, `type: 'website'`, `BreadcrumbList` Accueil →
  L'atelier → Guide des plaquettes. **RED**.
- Description de 1 à 160 caractères. **RED**.
- `ROUTE_TEXTS['/atelier/plaquettes']` porte titre et SEO. **RED**.
- Chaque `path` de `WORKSHOP_SPACE.tools` mène à une route déclarée (URL gardée, feuille = chemin).
  Vert face au stub par construction (aucun outil) ; il juge la carte au GREEN.

Suites existantes adaptées
- `app.routes.server.spec.ts` : `atelier/plaquettes` en `Server` (test neuf) ; « exactly the content
  routes » devient « exactly the routes nginx relays to Node » et inclut le guide. **RED** (2).
- `src/server/nginx-config.spec.ts` : la regex de la location SSR, lue dans le `Dockerfile`, relaie
  `/`, `/about`, un projet, un article, `/atelier/plaquettes` et `/atelier/plaquettes/` ; elle
  écarte `/atelier`, `/atelier/`, `/atelier/autre`, `/atelier/plaquettes/autre`, `/wp-login.php`.
  **RED** (2, les deux chemins du guide) ; les 9 autres passent dès l'état actuel.
- `src/server/feeds/sitemap.spec.ts` : `/atelier/plaquettes` après `/atelier`, huit pages statiques,
  et un test neuf pour son entrée (`monthly`, `0.7`, sans query string). **RED** (3).
- `src/app/workshop-confidentiality.spec.ts` : `INSERT_GUIDE_COPY` et
  `ROUTE_TEXTS['/atelier/plaquettes']` ajoutés aux données réelles gardées. Verts face au stub.
- `src/app/testing/editorial-sources.ts` : `INSERT_GUIDE_COPY` ajouté aux verrous éditoriaux.
- `e2e/a11y/scenarios.ts` : `{ path: '/atelier/plaquettes', ready: 'insert-guide-title' }`.

Scaffold dû au GREEN : `WorkshopTool` (avec `summary`), `toolsHeading` et `tools` dans
`WorkshopSpace` ; `application/insert-guide-copy.ts` ; `pages/insert-guide/insert-guide.ts` ; route
`atelier/plaquettes` ; `Server` dans `app.routes.server.ts` ; location SSR du `Dockerfile` ; entrée du
sitemap ; section « Les outils » de `Workshop`. Hors tests : job `verify` (`test ! -f
$browser/atelier/plaquettes/index.html`) ; job `docker` (`/atelier/plaquettes?matiere=inconnue` en
200 avec `insert-guide-title` et un `X-Cache-Status`, et le guide dans la boucle CSP des pages
rendues à la requête).

RED, commande du profil `pnpm test`, cache invalidé (`ng cache clean`, `node_modules/.vite`), avec
des stubs typés selon le plan (`toolsHeading: ''`, `tools: []`, copie à chaînes vides, composant au
gabarit vide, routes, sitemap et `Dockerfile` inchangés) : RED confirmé le 2026-10-26 17:55,
22 failed / 4797 total (Test Files 8 failed | 234 passed), code de sortie 1. Les 22 échecs sont des
`AssertionError`, aucune erreur de harnais ni de type. Un premier passage avait fait tomber la suite
`workshop tools` sur « No test found » (`it.each` d'une liste vide) : réécrite en un seul test qui
parcourt les outils.

### Tranche 8 — je choisis ma matière au clavier, et l'URL la garde

Jouée dans la même session, RED puis GREEN par le même agent (exception validée le 2026-10-25).
Décision du 2026-10-26 (option A, cf. journal) : `isoGroups` sort d'`InsertGuideReference` et du
builder `aReference` jusqu'à la première PR de données ; `INSERT_GUIDE_REFERENCE` est créé ici. Les
tests de composants lisent la fixture fictive `aMaterialCatalogue()` (trois alliages « essai »,
désignations `ZZ-FICTIF-n` et `TEST-00n`) au travers du token ; le comportement réel (référentiel
vide) est testé à part. PageModel commun : `testing/insert-guide.page-model.ts` (son accès au champ
est une assertion, pour qu'un champ absent échoue en `AssertionError` et non en `TypeError`).

`application/insert-guide-reference.spec.ts` (1 test) : sans fournisseur, le token rend
`{ sources, families, materials, recommendations }`, chacun **identique** à la constante réelle. **RED**.

`application/insert-guide-copy.spec.ts` (1 test, golden étendu) : libellés du champ (section, label,
indication, nom de la liste, « matière trouvée » / « matières trouvées », « Aucune matière trouvée »,
« Cette matière n'est pas encore dans le guide. »), « Groupe ISO », « Source : », « (nouvel onglet) »,
libellés des six systèmes de désignation. **RED**.

`application/material-combobox.spec.ts` (24 tests)
- Structure : `role="combobox"`, `aria-autocomplete="list"`, `autocomplete="off"`,
  `aria-expanded="false"`, label visible « Matière », indication par `aria-describedby`, listbox
  nommée par `aria-controls` ; statut `role="status"` présent et muet. **RED** (2).
- Recherche (`it.each`, 3 cas) : fragment commun, désignation AISI, numéro matière tapé sans tiret →
  options et statut « 2 matières trouvées » / « 1 matière trouvée ». **RED** (3).
- L'option dit la désignation trouvée et son système (« TEST-001 · AISI ») et le groupe en texte
  (« Groupe ISO P ») ; rien de répété quand le nom affiché a trouvé ; aucune correspondance →
  aucune option, `aria-expanded="false"`, statut « Aucune matière trouvée » et texte visible. **RED** (3).
- Clavier : flèche bas sur champ vide → toutes les matières, la première active
  (`aria-activedescendant`, `aria-selected`), `preventDefault` ; flèches en boucle ; flèche haut
  ouvre sur la dernière ; Entrée choisit l'active (`value` = slug, texte = nom, liste fermée) ;
  Entrée sans active ne choisit rien (`preventDefault` toujours) ; Échap ferme et garde la saisie ;
  second Échap remet le nom choisi, ou vide ; perte du focus ferme sans choisir. **RED** (9).
- Pointeur : `mousedown` empêché (le focus reste au champ), clic choisit. **RED**.
- Valeur posée de l'extérieur → texte du champ, puis vide. **RED**.
- Référentiel vide (cas réel) : flèche bas → aucune liste, statut « Aucune matière trouvée »,
  Entrée sans effet ; saisie → texte « pas encore dans le guide ». **RED** (2).
- Lié par `[formField]` : affiche le slug du modèle, un choix au clavier met le modèle à jour, un
  modèle remplacé met le champ à jour. **RED** (3).

`application/material-sheet.spec.ts` (4 tests) : `h3` = nom affiché et lettre du groupe ; chaque trait
de comportement suivi de sa citation ; chaque désignation dans un `dl` (système, valeur, citation) ;
le groupe ISO cité aussi (6 citations pour la fixture Alpha). **RED** (4).

`application/iso-group-badge.spec.ts` (3 tests) : « Groupe ISO P » / « Groupe ISO S » en texte, lettre
dans sa pastille ; aucun `style` en ligne ni pastille `aria-hidden` (pas de couleur, réponse 5). **RED** (3).

`application/source-citation.spec.ts` (2 tests) : « Source : titre (nouvel onglet), repère » ; lien
`target="_blank" rel="noopener noreferrer"` vers l'URL, mention `sr-only`. **RED** (2).

`pages/insert-guide/insert-guide.spec.ts` (8 tests ajoutés, `provideRouter` +
`withComponentInputBinding` + `provideLocationMocks` + `RouterTestingHarness`)
- Section « La matière » nommée par son `h2`, qui contient le champ ; un seul `h1`. **RED**.
- `?matiere=<slug connu>` → champ et fiche de la matière. **RED**.
- `?matiere=<slug connu>` → aucune navigation après la première. Vert face au stub par construction
  (il ne navigue jamais) ; il juge l'effet au GREEN.
- `?matiere=<inconnu>` → champ vide, aucune fiche, slug absent de la page, URL inchangée, aucune
  navigation. **RED**.
- Choix au clavier → `?matiere=<slug>`, `replaceUrl: true`, fiche affichée. **RED**.
- Un autre paramètre de la query (`operation`) est gardé au choix. **RED**.
- Retour arrière : champ et fiche suivent l'URL, une seule navigation (le retour lui-même). **RED**.
- Token réel (référentiel vide) : flèche bas puis Entrée → statut « Aucune matière trouvée », rien
  choisi, URL inchangée. **RED**.

Suites adaptées : `testing/insert-guide-builders.ts` (`aReference` sans `isoGroups`, avec la source
fictive dans `sources` ; `aMaterialCatalogue()`).

RED, `pnpm test`, cache invalidé (`ng cache clean` équivalent : `.angular/cache` et
`node_modules/.vite` supprimés), stubs typés (token rendant un référentiel vide, copie à chaînes
vides, composants au gabarit vide, page inchangée) : RED confirmé le 2026-10-26, 42 failed / 4844
total (Test Files 7 failed | 240 passed), code de sortie 1. Les 42 échecs sont des
`AssertionError` (27 « the material field: expected null to be an instance of HTMLInputElement »,
15 sur les valeurs attendues), aucune erreur de harnais ni de type. Un premier passage échouait en
`TypeError` (champ `null`) : le PageModel affirme désormais la présence du champ.

Corrections du harnais au GREEN, signalées (même exigence, mesure possible) : le test du retour
arrière branche l'écoute du `popstate` (`router.setUpLocationChangeListener()`, faite d'ordinaire
par la navigation initiale, que `RouterTestingHarness` ne joue pas) et attend une macro-tâche après
`Location.back()` (le routeur rejoue un `popstate` dans un `setTimeout`). Aucune valeur attendue n'a
changé. Mutation à la main : sans la garde « ne navigue que si le modèle diffère », le test du slug
inconnu tombe (l'URL perd `?matiere=`) ; le test du slug connu reste vert, la navigation vers la
même URL étant ignorée par le routeur.

### Tranche 9 — je choisis l'opération, et l'absence se dit franchement

Jouée dans la même session, RED puis GREEN par le même agent (exception validée le 2026-10-25).
Les tests de la page lisent désormais `OPERATION_FAMILIES` (structure et libellés de la spec, aucune
donnée d'usinage) en plus de la fixture fictive des matières. PageModel étendu :
`operationRadios()`, `checkedOperations()`, `chooseOperation(slug)` (son accès au radio est une
assertion, pour qu'un radio absent échoue en `AssertionError`).

`application/insert-guide-copy.spec.ts` (golden étendu) : « L'opération », « Opération », « La
plaquette », « Choisis une matière et une opération. », « Pas encore de recommandation pour ce
cas. » (mot pour mot de la spec). **RED**.

`application/insert-guide-status.spec.ts` (4 tests) : `incomplete` → chaîne vide ; `unavailable`
(`it.each`, 3 couples) → « <nom affiché>, <opération>. Pas encore de recommandation pour ce cas. ».
**RED** (3), le cas `incomplete` vert face au stub par construction.

`application/recommendation-panel.spec.ts` (2 tests) : `incomplete` → un `P`
`recommendation-incomplete` avec l'invitation, aucun `insert-guide-unavailable` ; `unavailable` →
un `P` `insert-guide-unavailable`, et le texte entier du panneau est **exactement** la phrase
d'absence (ni nom de matière, ni opération, ni citation). **RED** (2).

`application/operation-picker.spec.ts` (10 tests)
- Un `fieldset` `operation-picker` dont la `legend` « Opération » est `sr-only`, contenant un
  `fieldset` par famille, dans l'ordre, nommé par sa `legend` visible. **RED**.
- Un radio natif par opération, dans l'ordre, `value` = slug, `label for` = libellé, **un seul
  `name`** non vide pour tous. **RED**.
- Rien de choisi → 9 radios, aucun coché. **RED**.
- Choix (`it.each` : `gorge`, `percage-plaquettes`, `finition-interieure`) → `value` = slug, seul
  radio coché. **RED** (3).
- Valeur posée de l'extérieur → radio coché, puis aucun une fois vidée. **RED**.
- Lié par `[formField]` : modèle → radio coché ; choix → modèle ; modèle remplacé → radio. **RED** (3).

`application/material-combobox.spec.ts` (3 tests ajoutés, décision 5 du brief)
- Matière choisie, texte vidé puis perte du focus → `value` vide, champ vide, liste fermée. **RED**.
- Matière choisie, texte vidé puis Échap → `value` vide, champ vide, liste fermée, `preventDefault`.
  **RED**.
- Matière choisie, texte partiel puis perte du focus → la matière reste choisie. Vert par
  construction (garde du comportement de la tranche 8).

`pages/insert-guide/insert-guide.spec.ts` (10 tests ajoutés)
- Sections « L'opération » et « La plaquette », chacune nommée par son `h2`, qui contiennent le
  sélecteur et le panneau ; `h2` dans l'ordre matière, opération, plaquette. **RED**.
- `?operation=gorge` → radio coché, aucune navigation. **RED**.
- `?operation=<inconnue>` → 9 radios, aucun coché, slug absent du HTML, URL inchangée, aucune
  navigation. **RED**.
- Choix d'une opération → `?operation=filetage`, `replaceUrl: true`, une seule navigation. **RED**.
- `?operation=<inconnue>` puis choix d'une matière → `?matiere=<slug>` en **une** navigation : les
  deux clés écrites ensemble, l'inconnue retirée. **RED**.
- `?matiere=<Bêta>&operation=gorge` → panneau « Pas encore de recommandation pour ce cas. », statut
  « Alliage essai Bêta, Gorge. Pas encore… », aucune navigation. **RED**.
- Statut : muet tant que le couple est incomplet, puis suit chaque changement d'opération. **RED**.
- Texte de la matière vidé puis perte du focus / Échap (`it.each`) → URL `?operation=gorge`, plus
  de fiche, panneau `incomplete`, statut muet. **RED** (2).
- Retour arrière après deux opérations → radio de l'URL coché, une seule navigation. **RED**.

Suite adaptée **avant le RED** : le test de la tranche 8 « un autre paramètre est gardé » partait de
`?operation=operation-fictive-zz`, slug inconnu ; l'effet écrivant désormais les deux clés, une clé
inconnue est retirée (brief : « une clé vide est retirée de l'URL »). Il part de `?operation=gorge`,
slug connu, et attend `?operation=gorge&matiere=<slug>` : même exigence (l'opération est gardée).
La référence par défaut d'`openGuide` reçoit `families: OPERATION_FAMILIES`.

RED, `pnpm test`, cache invalidé (`.angular/cache` et `node_modules/.vite` supprimés), stubs typés
(copie à chaînes vides, `insertGuideStatus` rendant `''`, `OperationPicker` et
`RecommendationPanel` au gabarit vide, page et combobox inchangés) : RED confirmé le 2026-10-26,
28 failed / 4876 total (Test Files 6 failed | 244 passed), code de sortie 1. Les 28 échecs sont des
`AssertionError` (7 « the operation radio <slug>: expected undefined to be an instance of
HTMLInputElement », 21 sur les valeurs attendues), aucune erreur de harnais ni de type.

Retouche après le RED, signalée : `pnpm lint` a demandé le type de retour des deux fonctions du
`it.each` de la désélection (`(page): Promise<unknown> => …`). Aucune valeur attendue n'a changé.

### Tranche 10 — une recommandation s'affiche, et dit si elle est déduite

Jouée dans la même session, RED puis GREEN par le même agent (exception validée le 2026-10-25).
Révisée par les décisions de Julien du 2026-10-26 (points 7 à 13) et l'amendement d'ADR-0033.
**Aucune donnée réelle** : les tests lisent des fixtures fictives (codes `Z`, `Q`, `X`, champs
« Forme fictive »…, vitesse `123` à `456` pour prouver qu'elle ne s'affiche pas). Builder ajouté :
`anIsoInsertField(field, code, meaning, cite?)`. `aCitation()` porte `basis: 'stated'` par défaut.

`domain/reference-types.spec.ts` (3 tests ajoutés) : une citation sans `basis` ne compile pas ; une
`basis` hors `stated` / `deduced` ne compile pas ; une `scope` autre que `group` ne compile pas.
**RED** (1) : TS2578 « Unused '@ts-expect-error' directive » sur la citation sans `basis`
(`tsc -p tsconfig.spec.json`, code 2). Les deux autres étaient satisfaits avant le modèle par
l'erreur de propriété inconnue : ils jugent depuis l'ajout du champ.

`domain/iso-insert-code.spec.ts` (3 tests, `it.each`) : un champ, quatre champs, un code sur deux
caractères → les codes joints dans l'ordre. **RED** (3).

`application/insert-guide-copy.spec.ts` (golden étendu) : « déduit des principes du fabricant »,
« conseil du groupe », « Correspondances indicatives », « Plaquette », « Géométrie », « Nuance »,
« Pièges », « Plaquette proposée : ». **RED**.

`application/source-citation.spec.ts` (4 tests ajoutés) : `it.each` déduit / conseil du groupe / les
deux → mention visible (pas `sr-only`), juste avant le lien, texte entier « <mention> Source : titre
(nouvel onglet), repère ». **RED** (3). Base écrite → aucune mention : vert face au stub par
construction (garde).

`application/material-sheet.spec.ts` (1 test ajouté) : le `dl` des désignations suit un `h4`
« Correspondances indicatives ». **RED**.

`application/iso-insert-designation.spec.ts` (3 tests) : le code entier d'abord (`ZQX`) ; un `dl` lu
champ par champ, dans l'ordre, `dt` = champ, code, sens, une citation chacun ; seul le champ déduit
porte la mention. **RED** (3).

`application/recommendation-panel.spec.ts` (4 tests ajoutés) : état `available` → quatre `h3`
Plaquette, Géométrie, Nuance, Pièges, ni absence ni invitation ; chaque valeur suivie de sa citation,
mention « déduit » ou « conseil du groupe » là où la base ou la portée le disent, code `ZQ` dans le
bloc Plaquette ; vitesse donnée par la source → ni `123`, ni `456`, ni `m/min` ; aucun piège → pas de
bloc Pièges. **RED** (4).

`application/insert-guide-status.spec.ts` (2 tests ajoutés) : `available` (`it.each`, extérieur et
intérieur) → « <matière>, <opération> (<famille> si libellé partagé). Plaquette proposée : ZQ. ».
**RED** (2).

`pages/insert-guide/insert-guide.spec.ts` (2 tests ajoutés) : URL d'un couple couvert → code `ZQ`,
mention « déduit » dans le panneau, aucune vitesse, statut « Alliage essai Alpha, Finition (Tournage
extérieur). Plaquette proposée : ZQ. », une seule navigation ; passage de « Gorge » à « Finition »
extérieure → le statut passe de l'absence au code. **RED** (2).

RED, `pnpm test`, cache invalidé (`.angular/cache` et `node_modules/.vite` supprimés), stubs typés
(modèle et builders complétés, copie à chaînes vides, `isoInsertCode` rendant `''`,
`IsoInsertDesignation` au gabarit vide, `RecommendationPanel` avec l'entrée `sources` et le gabarit de
la tranche 9, page qui la lui passe, `insertGuideStatus` inchangé) : RED confirmé le 2026-10-26,
19 failed / 4901 total (Test Files 8 failed | 244 passed), code de sortie 1. Les 19 échecs sont des
`AssertionError` sur les valeurs attendues (code vide, `h3` absents, mention vide, statut vide),
aucune erreur de harnais ni de type.

Ajouté au GREEN, signalé (vert par construction) : `insertGuideStatus` sur une plaquette décrite
(gorge) nomme le cas sans code ; la tranche 12 précisera l'annonce. Mutation à la main : rendre `''`
dans cette branche fait tomber le test.

### Tranches 10 et 11, données — tournage extérieur et intérieur

Jouée dans la même session, RED puis GREEN par le même agent (exception validée le 2026-10-25), selon
les décisions de Julien du 2026-10-26 et l'amendement d'ADR-0033. Table récapitulative :
`specs/assets/034/donnees-tournage.md`.

Deux choix de modèle, pour que l'écran dise vrai :

- **Le choix du code est une liste de citations de l'`IsoInsertDesignation`** (`choice`, non vide),
  rendue juste après le code, avant la lecture champ par champ. Chaque champ garde sa citation, qui
  porte désormais son **sens** (table de lecture, base écrite). Retenu contre une seconde citation par
  champ (huit citations par code) et contre une citation de choix par champ affichée sous le sens (le
  lecteur croirait le sens « déduit »). La section citée dit entre parenthèses la lettre qu'elle fonde.
- **`geometry` devient une liste non vide**, comme `behaviour` : la géométrie de l'étape et la règle du
  rayon (S1, écrites, propres à l'opération) ne viennent pas de la même page que le conseil de groupe
  (S4, « conseil du groupe ») ; une seule citation ne pouvait pas porter les deux.

`domain/reference-types.spec.ts` (5 tests ajoutés) : `ISO_513_GROUPS` et `InsertGuideReference['isoGroups']`
typés `Record` des six lettres ; une géométrie vide, un code sans `choice` ou avec un `choice` vide ne
compilent pas. Ces garanties sont satisfaites dès le modèle (posé avec les stubs du RED).

`domain/reference-integrity.spec.ts`, sur les **données réelles** : les six groupes sous leur lettre,
nommés par une page Sandvik Coromant (base écrite) ; chaque groupe cité par une matière a son entrée ;
la citation du groupe d'une matière est la page qui nomme le groupe ; au moins une matière par groupe ;
chaque désignation écrite sur la liste de travail ; numéros matière et UNS à leur format ; un à trois
comportements, conseil de groupe d'une page Sandvik ; une finition extérieure par groupe ; chaque entrée
couvre exactement toutes les matières d'un groupe (décision 11) ; aucune vitesse ; toute citation
`deduced` pointe une page Sandvik ; chaque code se lit Forme, Dépouille, Tolérance, Fixation et
brise-copeaux, chaque sens écrit hors Sandvik. Nouvelle garde des noms commerciaux sur
`RECOMMENDATIONS` (fabricants, systèmes d'outils, nuances, brise-copeaux), avec ses cas fictifs.

Composants : `IsoGroupBadge` prend le groupe et dit « Groupe ISO <lettre> <nom> » ; `MaterialSheet`
reçoit `isoGroups` et affiche le nom ; `IsoInsertDesignation` rend les citations du choix entre le code
et le `dl` ; `RecommendationPanel` rend chaque ligne de géométrie suivie de sa citation.
`INSERT_GUIDE_REFERENCE` rend `isoGroups: ISO_513_GROUPS`. `ISO_513_GROUPS` entre dans
`EDITORIAL_SOURCES` et dans la garde de confidentialité. Scénario axe « choix fait » :
`/atelier/plaquettes?matiere=42crmo4&operation=ebauche-exterieure`, prêt sur `iso-insert-code`.

**RED** (`pnpm test`, cache invalidé, stubs typés : modèle complété, `SOURCES` et `ISO_513_GROUPS`
vides, badge sans nom, panneau limité à la première ligne de géométrie, aucune citation de choix
rendue) : 8 failed / 4960 total (Test Files 5 failed | 247 passed), code de sortie 1, que des
`AssertionError` :

```
× Given an available recommendation When the panel renders Then every value is followed by its citation, the insert code by the principles it is deduced from, …
× Given a material When its sheet renders Then the h3 is its displayed name and its ISO group letter and name follow in text
× Given an ISO designation When it renders Then the code is followed by the citations of the principles it comes from, before the fields are read
× Given the six groups When they are read Then each one sits under its own letter
× Given the reference When materials are grouped Then every ISO group has at least one
× Given the reference When external finishing is read Then every ISO group has a recommendation
× Given the group P / S When the badge renders Then its letter then its name are said in text, after its label
```

Les autres invariants de contenu étaient verts sur un référentiel vide (vrais par construction) : ils
jugent depuis la saisie.

### Codes par situation (décisions 14 à 16)

Joué dans la même session, RED puis GREEN par le même agent (exception validée le 2026-10-25). Table
récapitulative : `specs/assets/034/donnees-tournage.md`. Builders ajoutés : `anIsoInsertProposal()`,
`anIsoInsert(...proposals)`.

`domain/reference-types.spec.ts` (8 tests ajoutés ou déplacés) : `InsertFor` donne une désignation aux
situations extérieures pour l'extérieur, intérieures pour l'intérieur ; une situation de l'autre famille,
hors liste ou absente ne compile pas ; une désignation sans proposition ne compile pas ; le choix vide
ou absent ne compile pas, au niveau de la proposition ; une source sans URL compile. Satisfaits dès le
modèle, posé avec les stubs (vrais par construction, ils jugent depuis).

`domain/iso-insert-code.spec.ts` : le code se lit sur une proposition. Vert par construction (la
fonction ne change que de type d'entrée).

`domain/reference-integrity.spec.ts`, sur les **données réelles** : seule la liste de travail est sans
URL, rien ne pointe vers le site ; une source sans URL n'a pas de défaut ; une à trois situations
distinctes par entrée, moins de deux seulement en M et S ; chaque proposition cite sa lettre de forme ;
en P, K, N et H cette citation est écrite par la page de la famille (S2, S3) ; en M et S la forme est
R ou S (M), R (S), et le choix le dit par une citation de groupe (« angle d'attaque » ou « ronde ») ;
N toujours positive à arête vive (dépouille ≠ N, tolérance G) ; l'alu en finition est écrit en entier
par Kyocera, rien de déduit ; H cite CBN, profondeur de coupe et wiper ; hors forme et hors code écrit
en entier, toute citation de choix propre à la matière est déduite ; Stellite 6 en H et X20Cr13 en M
(décision 16, verts par construction).

`application/insert-guide-copy.spec.ts` (golden) : `proposedInserts` et les neuf libellés de situation.

`application/iso-insert-designation.spec.ts` (réécrit, 4 tests) : une liste, un `li` par situation dans
l'ordre, `h4` du libellé puis le code ; un `dl` par code ; la mention « déduit » sur le seul champ
déduit ; les citations du choix de chaque code entre son code et son `dl`.

`application/recommendation-panel.spec.ts`, `application/insert-guide-status.spec.ts`,
`pages/insert-guide/insert-guide.spec.ts` : deux ou trois propositions ; statut « Plaquettes
proposées : ZQ (chariotage avec épaulement), YQ (profilage). », singulier pour une seule.

`application/source-citation.spec.ts` (1 test) : une source sans URL → titre en texte simple, aucun
lien, aucune mention « nouvel onglet ».

**RED** (`pnpm test`, cache invalidé, stubs typés : modèle complet, données d'avant enveloppées en une
proposition par entrée, copie à chaînes vides, composant et statut lisant la seule première
proposition, `SourceCitation` inchangé, URL de la liste encore présente) : 19 failed / 4981 total
(Test Files 7 failed | 245 passed), code de sortie 1, que des `AssertionError` :

```
× Given the catalogue When URLs are read Then only the working list has none, and nothing points to the site itself
× Given the turning entries When their situations are counted Then each proposes one to three distinct situations, …
× Given each proposal When its choice is read Then one citation names its shape letter for its situation
× Given groups P, K, N and H When a shape is proposed Then it is written for the situation by the Sandvik page of its turning family
× Given groups M and S When a code is proposed Then its shape keeps the entering angle the group asks for, and its choice says so …
× Given aluminium finishing When a code is proposed Then the source writes it whole, so nothing in its choice is deduced
× Given group H When a code is proposed Then its choice cites hard turning: CBN, small depth of cut and wiper
× Given several situations When the designation renders Then each one is an item of a list, in order, headed by its h4 label then its code
× Given several situations When the designation renders Then each code is read in its own dl, field by field, …
× Given several situations When the designation renders Then each code is followed by the citations of its own choice, …
× Given a field deduced from the maker principles When the designation renders Then only that field says it is deduced
× Given an available recommendation When the panel renders Then every value is followed by its citation, each insert code under its situation, …
× Given 0 / 1 / 2: an available recommendation When the status is derived Then it names … each proposed code with its situation
× Given a source without public URL When its citation renders Then the title is plain text, with no link nor new-tab notice
× Given a covered material and operation in the URL When the guide renders Then the panel shows each proposed insert under its situation, …
× Given a chosen material When a covered operation is chosen after an uncovered one Then the status moves …
× Given the guide copy When it is read Then every interface text is the proposed one
```

Les gardes « hors forme, déduit » et « N positive à arête vive » étaient vertes sur les données
d'avant : elles jugent depuis la saisie. Corrigé au GREEN dans deux tests de ce RED (signalé) : le
filtre « alu en finition » prenait la semi-finition (`endsWith('-finishing')`, remplacé par les deux
opérations nommées), et la garde « hors forme, déduit » ne retirait que la citation de la forme
proposée : elle retire désormais toute citation qui nomme une forme, pour laisser la page de la
situation citée quand la matière impose une autre forme (M ronde, S ronde). Même exigence sur
dépouille, tolérance et fixation.

### Correctifs de revue : X20Cr13 en P, conseils par sous-groupe, mots de la page (décisions 16 et 17)

Joué dans la même session, RED puis GREEN par le même agent (exception validée le 2026-10-25), après la
revue REJECTED du 2026-10-26. Pages Sandvik `fr-fr` S1 à S5 relues le 2026-10-26 (intitulés de section,
mots de forme, sous-groupes). Table récapitulative : `specs/assets/034/donnees-tournage.md`.

**Modèle** : `Material.subgroup` (union fermée `IsoSubgroup` : aciers, inox ferritiques et
martensitiques, austénitiques, duplex, durcis par précipitation, fontes, aluminium, superalliages et
titane, aciers trempés, stellites), obligatoire ; la citation du groupe nomme la section de S5 qui
classe la famille. `SourceCitation.scope` accepte `'subgroup'`, affiché « conseil du sous-groupe ».

`domain/reference-types.spec.ts` (2 tests ajoutés, 1 renommé) : un sous-groupe hors liste ou absent ne
compile pas ; une portée autre que groupe ou sous-groupe ne compile pas.

`domain/reference-integrity.spec.ts`, sur les **données réelles** : X20Cr13 en P (le test qui
l'épinglait en M est ré-ancré) et rattaché aux inox ferritiques et martensitiques par la section P5 de
S5 ; chaque sous-groupe appartient au groupe de sa matière ; **une entrée ne couvre que les matières du
sous-groupe dont elle cite la section** (remplace « une entrée couvre tout le groupe »), doublé de cinq
fixtures (un sous-groupe propre, deux sous-groupes, sous-groupe sans section, section d'un autre
sous-groupe, aucune section) ; les matières sans recommandation sont exactement celles d'un sous-groupe
sans section (17-4 PH, Stellite 6) ; toute citation écrite de S4 est un conseil de sous-groupe ; la
garde de forme lit une **table « mot de la page → lettre »** (doublée de dix cas : chaque mot, et
« forme S » qui ne donne rien) ; **aucune citation écrite ne porte « forme <lettre> »** ; dans les
sous-groupes qui règlent l'angle d'attaque (austénitiques, duplex, superalliages et titane), la forme
respecte la règle, le conseil est cité écrit, et la forme qu'il impose est citée **déduite**.

`application/insert-guide-copy.spec.ts` (golden) : `subgroupAdvice`. `application/source-citation.spec.ts`
(2 cas) : « conseil du sous-groupe », seul et avec « déduit ».

**RED** (`pnpm test`, stubs typés : `IsoSubgroup`, `subgroup` saisi sur chaque matière, `scope` élargi ;
données d'avant sinon) : 14 failed / 4996 total (Test Files 3 failed | 249 passed), code de sortie 1, que
des `AssertionError` :

```
× INSERT_GUIDE_COPY > Given the guide copy When it is read Then every interface text is the proposed one
× SourceCitation > Given a value given for its subgroup When its citation renders Then it says so visibly, …
× SourceCitation > Given a value given for its subgroup and deduced When its citation renders Then …
× Given x20cr13-x30cr13 When its group is read Then the Sandvik classification wins over the working list
× Given X20Cr13 / X30Cr13 When its subgroup is read Then it sits with the ferritic and martensitic stainless steels, …
× Given the reference When subgroups are read Then each material sits in a subgroup of its own ISO group
× Given the reference When an entry is read Then it covers only materials of the subgroup whose section it cites
× Given the reference When coverage is read Then the materials of a subgroup without section are the ones left without recommendation
× Given the reference When the turning page is cited as written advice Then it is the advice of a subgroup
× Given each proposal When its choice is read Then one citation names its shape letter for its situation
× Given the reference When a citation says what the page writes Then it never writes an ISO letter the page does not
× Given subgroups without shape rule When a shape is proposed Then it is written for the situation by the Sandvik page …
× Given subgroups whose page rules the entering angle When a code is proposed Then its shape keeps that angle, …
× Given each proposal When its clearance, tolerance and fixing are chosen Then they are deduced from a principle …
```

Ajusté avant le GREEN (signalé) : les aciers non alliés et faiblement alliés forment **un** sous-groupe
« aciers » à trois sections S4 (non alliés, faiblement alliés, fortement alliés), comme la liste de la
décision 17 ; la table des sous-groupes du test porte une liste de sections par sous-groupe.

## Journal des tranches

- **Tranche 1 — l'accueil de l'atelier existe et se trouve** : GREEN 4687 passed / 4687 total (au premier cycle), code de sortie 0 · refactor : aucun (diff relu : un modèle à deux champs, une constante, une page sans état, une route ; rien à simplifier). Verify faite (§ Verify) : la route `/atelier` devient atteignable. Décision : `WorkshopSpace` se limite à `heading` et `intro` ; `tools`, `toolsHeading` et `WorkshopTool` arrivent en tranche 7 avec la carte du guide, et la page ne rend aucune section « Les outils » vide d'ici là. Intro de Julien découpée en deux paragraphes (la règle, puis l'espace et à qui il s'adresse), texte inchangé, seule l'espace avant le deux-points devient insécable. Gardes CI : job `verify`, `atelier/index.html` présent ; job `docker`, `/atelier/` en 200 avec `data-testid="workshop-title"` et sans `X-Cache-Status`.
- **Tranche 2 — on y arrive depuis le menu et le pied de page** : GREEN 4691 passed / 4691 total (au premier cycle), code de sortie 0 · refactor : aucun (diff de trois lignes de données relu, rien à simplifier). Verify faite (§ Verify) : le menu et le pied de page, déjà atteignables sur tout le site, changent. `admin-post-editor.spec.ts` n'a pas dépassé son délai sur ce passage.
- **Tranche 3 — une référence de pièce ne peut pas partir** : GREEN 4735 passed / 4735 total (au premier cycle), code de sortie 0 · GREEN fait en session (règle du 2026-10-25 : petites tranches en session) · refactor : l'expression régulière unique est découpée en motifs nommés (`REFERENCE_PATTERNS`), tests inchangés et verts. Verify reportée : fonction pure et garde de test, aucune surface atteignable modifiée. Décisions retenues du RED : « L'indice de rugosité » n'est pas signalé (« indice » suivi d'un mot) ; la garde lit tout le texte du référentiel sauf les valeurs de désignation, donc un slug ou un identifiant à cinq chiffres consécutifs serait signalé (l'écrire avec un tiret) ; `SOURCES` n'est pas lu (une URL peut porter un long numéro de document). L'extension au référentiel, renvoyée ici par la tranche 6, est faite.
- **Tranche 4 — une désignation tapée n'importe comment retrouve sa matière** : GREEN 4447 passed / 4447 total (au premier cycle), code de sortie 0 · refactor : retrait d'un échappement redondant dans `normalizeDesignation` (`\s` couvre déjà U+00A0 et U+202F en JavaScript) ; diff relu, aucune autre simplification trouvée. Verify reportée : domaine pur, aucune surface atteignable restructurée. Écart : `SourceId` vaut `never` (union fermée sans membre tant qu'aucune source n'est saisie), `Source` non créé (aucun test ne l'exige, il arrive avec `SOURCES` en tranche 5).
- **Tranche 5 — une donnée sans source ne compile pas** : GREEN 4483 passed / 4483 total (au premier cycle), code de sortie 0 · refactor : aucun (diff de trois types et d'un catalogue vide relu, rien à simplifier). Verify reportée : domaine pur, aucune surface atteignable restructurée. Décision : `ISO_513_GROUPS` n'est pas créé ; avec `SourceId` à `never`, il n'existerait qu'avec une source inventée ou un type affaibli. Reporté à la première PR de données (première source Sandvik Coromant), avec sa garantie de type, le test « chaque groupe ISO cité par une matière a son entrée » et son ajout à `EDITORIAL_SOURCES`. `IsoGroupColor` vaut `never` et `SOURCES` est vide tant qu'aucune source n'est saisie.
- **Tranche 6 — une combinaison sans recommandation le dit** : GREEN 4645 passed / 4645 total (au premier cycle), code de sortie 0 · refactor : aucun (diff de la PR 4 relu en entier, rien à simplifier sans toucher aux tests). Verify reportée : domaine pur, aucune surface atteignable restructurée. Écarts : `InsertGuideReference` garde `isoGroups` (typé `Readonly<Record<IsoGroupLetter, IsoGroup>>`), parce que le builder `aReference` le remplit ; `IsoDesignationField` et `InsertAspect` restent privés au modèle (aucun consommateur hors du fichier) ; le type de la sélection, `GuideSelection`, est déclaré dans `guide-selection.ts` et repris par `resolveGuideState`. Décision : l'extension de `findConfidentialReferences` au texte libre du référentiel n'est pas faite dans la PR 4, parce que le référentiel est vide. Elle arrive avec la PR 3 (tranche 3), qui crée la fonction, et doit être en place avant la première donnée ; la PR 5 dépend donc de la PR 3.
- **Tranche 7 — le guide existe et se trouve** : GREEN 4797 passed / 4797 total (au deuxième cycle), code de sortie 0 · RED et GREEN dans la même invocation (exception du 2026-10-25) · refactor : aucun (la liste de classes du `h1` est la même que sur l'accueil de l'atelier, le blog et les réalisations ; la sortir en `@utility` toucherait trois fichiers hors de la tranche). Verify faite (§ Verify) : `/atelier` gagne sa carte et `/atelier/plaquettes` devient atteignable. Décision du 2026-10-26 (session principale, option E) : `INSERT_GUIDE_REFERENCE` n'est pas créé dans cette tranche. Sa `factory` devrait rendre un `InsertGuideReference`, dont `isoGroups` (`Record` des six lettres, chaque nom `Sourced<string>`) ne se construit pas tant que `SourceId` vaut `never` : il faudrait inventer une source ou affaiblir le type. Aucun élément de la tranche ne lit le référentiel. Le choix entre retirer `isoGroups` jusqu'à la PR de données (A) et avancer `ISO_513_GROUPS` avec une source réelle (C) se fait à la tranche 8, premier consommateur. Correction du contrat au GREEN : le test des cartes comparait le texte de la carte en une chaîne jointe par des espaces ; les trois `span` de `LinkCard` n'ont pas d'espace entre eux, il compare désormais le texte de chaque enfant (même exigence, mesure juste). Écarts : `INSERT_GUIDE_COPY` ne porte que ce que la page rend (titre, chapô, avertissement), les autres libellés arrivent avec leurs composants (tranches 8 et 9) ; le chapô reprend le résumé validé de la carte ; `WorkshopTool` gagne `summary` (réponse 6 de Julien) ; le guide entre aussi dans la boucle CSP du job `docker` ; `DESIGN.md` § 5 : « Les outils » et « Guide des plaquettes ».
- **Tranche 8 — je choisis ma matière au clavier, et l'URL la garde** : GREEN 4844 passed / 4844 total (au deuxième cycle), code de sortie 0 · RED et GREEN dans la même invocation (exception du 2026-10-25) · refactor : la constante `FIELD_ID` à un seul site est inlinée dans le champ `fieldId` du combobox ; tests inchangés et verts. Verify faite (§ Verify) : `/atelier/plaquettes`, déjà atteignable, gagne la section « La matière ». Décision du 2026-10-26 (session principale, option A) : `isoGroups` sort d'`InsertGuideReference` et d'`aReference` jusqu'à la première PR de données ; le type décrit ce qui existe, le champ reviendra avec `ISO_513_GROUPS` et sa source. `IsoGroup` et `anIsoGroup` restent (garanties de compilation de `reference-types.spec.ts`). `INSERT_GUIDE_REFERENCE` est créé, sa `factory` rend les quatre constantes réelles sans cast ; `aReference` porte désormais la source fictive dans `sources` (cast confiné à `testing/`). Écarts : le cycle 1 a fait tomber deux tests, la garde des rayons nommés (`rounded-lg` sur la liste, remplacé par `rounded-field`) et le retour arrière (harnais, cf. Plan de test) ; la règle `@angular-eslint/no-input-rename` est désactivée sur l'input `matiere`, avec sa raison (clé figée des URL partagées, code en anglais), plutôt qu'un input nommé en français ; la navigation garde les autres paramètres (`queryParamsHandling: 'merge'`, `matiere` retiré quand le choix est vide) au lieu d'écrire `operation`, qui arrive en tranche 9 ; le scénario axe « liste ouverte » n'est pas ajouté (référentiel vide : rien à ouvrir), il rejoint la première PR de données avec « choix fait » ; `DESIGN.md` § 5 : section « La matière », champ à suggestions, badge de groupe ISO, citation. Effacer le texte du champ ne retire pas la matière choisie (Échap la réaffiche) : comportement non spécifié, laissé tel quel.
- **Tranche 9 — je choisis l'opération, et l'absence se dit franchement** : GREEN 4876 passed / 4876 total (au premier cycle), code de sortie 0 · RED et GREEN dans la même invocation (exception du 2026-10-25) · refactor : imports de la page remis dans l'ordre, diff relu (pas de presenter : la page ne fait que câbler, la phrase d'annonce est une fonction pure) ; tests inchangés et verts. Verify faite (§ Verify) : `/atelier/plaquettes`, déjà atteignable, gagne les sections « L'opération » et « La plaquette ». Décision du brief (signalée en tranche 8) : vider le texte du champ matière puis le quitter, ou appuyer sur Échap champ vide, désélectionne la matière ; l'URL perd `matiere`. Un texte partiel laissé en quittant le champ garde la matière choisie. Écarts : l'input d'URL s'appelle `operation`, sans alias (le nom public est déjà la clé de l'URL : aucune règle `no-input-rename` à désactiver), quand celui de la matière reste `materialParam` aliasé `matiere` ; `RecommendationPanel` ne prend que `state` (`sources` arrive avec l'état `available` en tranche 10, `isoGroups` avec `ISO_513_GROUPS`) ; la phrase annoncée est « <matière>, <opération>. Pas encore de recommandation pour ce cas. », muette tant que le couple est incomplet ; une clé d'URL inconnue est retirée à la première navigation de l'utilisateur, jamais réécrite ; l'avertissement passe dans la section « La plaquette » (colonne de droite en `lg`). `DESIGN.md` § 5 : trois sections, deux colonnes, choix de l'opération, panneau. Risque : deux opérations de même libellé dans deux familles (« Ébauche », « Finition ») donnent la même phrase d'annonce ; le radio lui-même est annoncé avec la `legend` de sa famille.
- **Correctif après la tranche 9 (session principale)** : la phrase annoncée nomme la famille quand le libellé de l'opération est partagé (« Ébauche (Tournage extérieur) » / « Ébauche (Intérieur (alésage)) »), pour que le passage de l'une à l'autre change la phrase et soit réannoncé. `insertGuideStatus(state, families)` ; RED par signature (TS2554), puis GREEN 4877/4877, lint et format en code 0.
- **Tranche 10 — une recommandation s'affiche, et dit si elle est déduite** : GREEN 4901 passed / 4901 total (au deuxième cycle), puis 4902 / 4902 avec le test de la plaquette décrite, code de sortie 0 · RED et GREEN dans la même invocation (exception du 2026-10-25) · refactor : aucun (diff relu ; le couple « valeur puis citation » revient trois fois dans le panneau et une fois dans la fiche matière, l'extraire toucherait la fiche de la tranche 8 : à faire avec la tranche 12, qui ajoute `DescribedInsert` et un quatrième site). Verify faite (§ Verify) : `/atelier/plaquettes`, déjà atteignable, change de fiche (intitulé « Correspondances indicatives ») et de panneau. Écarts : le cycle 1 a fait tomber la garde « aucune capitale » (`first-letter:uppercase` sur la mention) ; la mention reste en minuscules, mot pour mot de la décision 10, sur sa propre ligne (à valider en revue UI) ; `scope?: 'group'` optionnel plutôt qu'un `scope: 'material' | 'group'` obligatoire, pour ne pas imposer un champ aux citations propres à la matière, majoritaires ; `cuttingSpeed` reste dans le modèle (V3, plan) mais n'est pas affiché (décision 13) ; le code ISO est une fonction pure du domaine, `isoInsertCode`, lue par le composant et par l'annonce ; l'intitulé des correspondances est un `h4` sous le `h3` de la matière ; `insertGuideStatus` annonce « Plaquette proposée : <code>. » (copie à valider), et seulement la matière et l'opération pour une plaquette décrite ; une plaquette décrite n'a pas encore de rendu (tranche 12). Scénario axe « choix fait » non ajouté : aucun état `available` n'est atteignable sans donnée réelle ; il rejoint la tranche de données. Joué en vérification sur l'image fixture (non commité) : 6 passed.

- **Tranches 10 et 11, données — tournage extérieur et intérieur** : GREEN 4960 passed / 4960 total (au deuxième cycle), code de sortie 0 · RED et GREEN dans la même invocation (exception du 2026-10-25) · refactor : les espaces insécables littérales des gabarits de locator passées en `\u00a0` (lint `no-irregular-whitespace`), `letter` retiré d'un type de saisie où il n'était lu nulle part ; tests inchangés et verts. Verify faite (§ Verify) : `/atelier/plaquettes`, atteignable, affiche désormais de vraies fiches et recommandations. Le cycle 1 a fait tomber quatre tests : espace absente entre lettre et nom du badge (`&ngsp;`), la garde des noms commerciaux lisait les identifiants de source des citations de choix (exemption étendue de `.cite.source` à `.choice[n].source`, même règle : un identifiant de source n'est pas du texte affiché), et le test « référentiel réel encore sans matière » de la page, dont la prémisse a disparu (repointé sur une fixture sans matière ; l'option `null` d'`openGuide` retirée). Décisions de saisie : une ligne de la liste qui accole deux alliages devient deux matières quand chaque système leur donne une valeur distincte (304 et 304L, 625 et C276…), une seule quand une valeur est partagée (X20Cr13 / X30Cr13 partagent AISI 420, EN AW-2011 / 2030 partagent AU5PbBi) ; **100Cr6** : la matière recuite (P) garde toutes les désignations normalisées, la trempée (H) n'a que le nom courant « 100Cr6 trempé » (idem « 16MnCr5 trempé »), la recherche « 100cr6 » propose les deux ; **Stellite 6 en H** (S5 range les stellites en H, la liste la mettait en S), Haynes 25 reste en S (base cobalt) ; X20Cr13 en M d'après S5, alors que S4 range les martensitiques en P5 ; F51 (duplex) omis, ni AISI ni UNS ; « US (AISI) » de la liste repris en `aisi` même pour A36 et A572 Gr.50 (ASTM). La liste de travail n'a pas d'URL publique : sa source pointe `https://nedellec-julien.fr/atelier` (à confirmer par Julien). Cases vides : H ébauche et semi-finition extérieures, H intérieur, S intérieur (S3 « toujours supérieur à 75° » contre S4 « moins de 45° »).
- **Codes par situation (décisions 14 à 16)** : GREEN 4981 passed / 4981 total (au deuxième cycle), code de sortie 0 · RED et GREEN dans la même invocation (exception du 2026-10-25) · refactor : `satisfies` redondant retiré du constructeur de proposition (le type de retour le garantit déjà), type `Principle` devenu inutile supprimé ; tests inchangés et verts. Verify faite (§ Verify) : `/atelier/plaquettes`, atteignable, change de panneau et de statut. **Modèle** : `IsoInsertDesignation` porte une liste non vide de `proposals`, chacune `{ situation, choice, fields }` : la citation de choix existante reste l'endroit où une lettre se justifie, la forme y entre écrite (page de la situation) et les autres lettres déduites ; retenu contre une citation de choix par champ, qui aurait doublé les citations du `dl` et fait lire le sens comme « déduit ». `InsertFor<O>` donne `IsoInsertDesignation<ExternalSituation>` à l'extérieur et `IsoInsertDesignation<InternalSituation>` à l'intérieur : une situation de l'autre famille ne compile pas. **Situations** ajustées aux pages `fr-fr` relues ce jour : « Profilage » (Sandvik n'écrit pas « copiage »), « Profilage à forte rampe » (« angle de ramping plus grand », forme V), « Dressage » avec la forme W (la page écrit « trigone », la table MMC donne W = trigone) ; à l'intérieur, « Chariotage sans épaulement » (carrée à 75°) ajouté, seule situation compatible avec l'inox à l'intérieur. **Source sans lien** : `url` optionnel plutôt qu'une variante de `Source` ; la sûreté tient par la garde « seule la liste de travail est sans URL, rien ne pointe vers le site » et par `https` vérifié quand l'URL existe. **Classement** : le classement de Sandvik (S5, « Matériaux de pièce ») l'emporte sur la liste de travail : Stellite 6 en H, X20Cr13 en M, gardés par un test. **Situations omises** : M extérieur, tout ce qui travaille à 91–95° ou 93° (épaulement, profilage D et V, dressage) ; M intérieur, tout sauf la carrée à 75° (la ronde passe sous 75°, que S3 interdit) ; S extérieur, tout sauf la ronde (S4 : moins de 45°), le chariotage sans épaulement et le profilage passant à la ronde en le disant. Écarts : une seule situation en M intérieur ; RCGT proposé deux fois en S (deux situations, même code) ; la forme R du groupe S reste déduite (S4 écrit « moins de 45° », pas « ronde ») ; wiper cité dans la citation du tournage dur sans lettre ISO (aucune position 1 à 4 ne le porte) ; `DESIGN.md` § 5 : géométrie en liste, désignation par situation, citations du choix, citation sans lien (écart 7 de la saisie précédente soldé).
- **Correctifs de revue (décisions 16 et 17)** : GREEN 4996 passed / 4996 total (au deuxième cycle), code de sortie 0 · RED et GREEN dans la même invocation (exception du 2026-10-25) · refactor : le constructeur de proposition `imposed` sert les deux formes imposées par un sous-groupe (ronde des austénitiques, ronde des superalliages) sans citer la plaquette de la situation ; `groupRule` et `GroupAdvice` renommés `subgroupRule` et `SubgroupAdvice` ; tests inchangés et verts. Verify faite (§ Verify) : `/atelier/plaquettes`, atteignable, change de fiches et de panneaux. Le cycle 1 a fait tomber la garde typographique (`;` après une espace insécable normale, passée en fine). **X20Cr13 / X30Cr13 en P**, sous-groupe P5, conseils de la section S4 « Tournage des aciers inoxydables ferritiques et martensitiques » et codes de l'acier (S4 n'y règle pas la forme). **Conseils par sous-groupe** : l'entrée « inox » se scinde en austénitiques (conseils d'avant, inchangés) et **duplex**, qui reçoit sa section (petits angles d'attaque, nuances CVD et PVD, arrosage par l'intérieur, super et hyper duplex) et la seule carrée à 75° (SNMG dehors, SCMT dedans) ; les aciers trempés perdent la Stellite 6 ; **17-4 PH et Stellite 6 sans recommandation**. Mention « conseil du sous-groupe » retenue plutôt que de renommer « conseil du groupe » : les comportements de la fiche matière restent des textes de groupe (S5, « Groupes de matières usinées »), le mot doit dire lequel des deux. **Mots de la page** : chaque locator de forme reprend « type C (80°) », « carrée », « trigone », « triangulaire », « type D (55°) », « type V (35°) », « rondes » ; la carrée à 75° des austénitiques et du duplex, la ronde des austénitiques et des superalliages passent en citation **déduite** derrière le conseil écrit ; RCGT une seule fois en S (profilage), sans la carrée au-dessus. Locators corrigés : comportement inox cité à « ISO M aciers inoxydables », « Usinabilité en général » (« contrôle des copeaux correct », plus « se coupent plus facilement ») ; piège intérieur cité à l'introduction de S3. Positive des austénitiques fondée sur S1 (angle de dépouille de 7° par exemple), la face de dépouille positive de S4 citée comme principe déduit ; rayon de bec : les mots de S1 (« grandes profondeurs de coupe », « idéal pour les petites profondeurs ») sans affirmer le lien à l'étape ; « un peu plus petit » au lieu de « un peu moins ». Titre de source Kyocera : « Plaquettes positives pour la finition de l'aluminium » (le sous-titre de la page), sans nom de brise-copeaux. ADR-0033 amendé (URL facultative, conseil de sous-groupe). Écarts : 17-4 PH reste en M par la liste de travail, rattaché au groupe par la définition de S5 (chrome à 12 % minimum, base déduite) ; S5 range les PH martensitiques en P5 et les austénitiques en M sans nommer le 17-4 PH, à trancher par Julien ; les aciers non alliés de décolletage (11SMn30, 11SMnPb30, P1.4 chez S5) reçoivent le conseil « Tournage des aciers non alliés », dont S4 n'affiche que la classification P1.1 ; le duplex n'a qu'une situation (carrée à 75°), la ronde n'étant pas écrite pour lui.

- **Re-revue (un sous-groupe par section, comportements fidèles à la page)** : GREEN 5015 passed / 5015 total (au deuxième cycle), code de sortie 0 · RED et GREEN dans la même invocation (exception du 2026-10-25) · refactor : le paramètre `basis` de `classedIn`, sans plus aucun appelant déduit, retiré ; la ligne de la liste de travail sert à la fois aux désignations et au groupe du 17-4 PH (`onWorkingList`) ; prettier sur le test ; tests inchangés et verts. RED : d'abord par le type (TS2322/TS2353, `'non-alloyed-steel'` hors d'`IsoSubgroup`, une seule `section` par sous-groupe), puis, la clé `steel` remise le temps d'une mesure non commitée, 21 failed / 4994 passed (sous-groupes et sections S5 des neuf aciers, 17-4 PH cité par la liste, couverture, locators de comportement de huit matières, entrées d'un seul sous-groupe). Verify faite (§ Verify) : `/atelier/plaquettes`, atteignable, change de fiches et de panneaux. Le cycle 1 a fait tomber la garde typographique (espaces ordinaires devant `;`, `:` et `%` dans les nouveaux textes). **Aciers** : `non-alloyed-steel` (S235JR, S355J2, C45 ; S4 « Tournage des aciers non alliés », carbone inférieur ou égal à 0,55 %), `low-alloyed-steel` (42CrMo4, 16MnCr5, 20NiCrMo2-2, 100Cr6 ; S4 « Tournage des aciers faiblement alliés », P2.x ; S5 : moins de 5 % d'éléments d'alliage), `free-cutting-steel` (11SMn30, 11SMnPb30 ; P1.4 chez S5, aucune section S4) sans recommandation. Aucune matière ne relève des fortement alliés (X153CrMoV12 est en H) : pas de sous-groupe. Garde : `SUBGROUPS` porte `section: string | undefined`, une seule section par construction, et une fixture prouve qu'une entrée d'aciers non alliés citant la section des faiblement alliés est refusée. **17-4 PH** : groupe M cité par la liste de travail (page 2, ISO M, ligne « Précipitation (PH) », écrit) ; la garde « le groupe d'une fiche est cité par la page qui nomme le groupe » épingle cette seule exception en littéral. **Comportements** (S5 relue le 2026-10-26 dans le navigateur, texte affiché) : supprimés « usinabilité en général bonne » (fontes), « souvent facile à usiner » (alu), « le groupe le plus difficile » (S) ; recités à la section qui les écrit : copeaux longs et collants (« Aciers ISO P », « Usinabilité en général »), écrouissage et efforts (« ISO M aciers inoxydables », « Usinabilité en général »), copeaux courts et bon contrôle (« ISO K fontes », « Usinabilité en général »), copeaux longs (« ISO N - Matières non ferreuses », « Usinabilité de l'aluminium »), contrôle des copeaux et efforts (« ISO S, superalliages réfractaires et titane », « Usinabilité en général »), titane (« Titane– S 4.1-4.4 », « Usinabilité »), plus petit groupe, finition, efforts (« ISO H aciers trempés », « Usinabilité ») ; gardés à « Groupes de matières usinées » seulement ce que ce paragraphe écrit (P : usinabilité qui varie ; M : chaleur, entaille, arêtes rapportées ; K : grises et malléables assez faciles, nodulaires, compactes et bainitiques plus difficiles, SiC ; N : métal tendre, arêtes vives, 13 % de Si ; S : collants, écrouissage, chaleur, beaucoup plus difficiles à couper que les inox ; H : chaleur, abrasion). Un test épingle les locators de comportement d'une matière par groupe. Non bloquantes : « à l'état trempé » appliqué après la troisième revue (session principale) ; la carrée à 75° intérieure cite « si les conditions sont stables ». Écarts : la section S4 des non alliés n'écrit aucune nuance, la nuance des non alliés cite donc S5 « Aciers non alliés – P 1.1-1.5 », « Usinabilité » (« nuances à revêtement mince », aciers bas carbone), seule citation hors S4 d'une entrée ; la section S4 des faiblement alliés écrit « Pour les aciers non alliés non trempés, le premier choix est la série de nuances et géométries pour les aciers » : repris « sur matière non trempée », sans « non alliés », qui contredirait le titre de la section ; les aciers de décolletage reçoivent un comportement propre (S5, « Eléments d'alliage », « Effet positif » : soufre et plomb améliorent la fragmentation) à la place de « copeaux longs et collants », que S5 contredit pour eux.

## Verify

Tranche 1, 2026-10-25, worktree `034-pr3`.

- Steps : `pnpm run build --configuration production` (code de sortie 0, « Prerendered 3 static routes »),
  puis lecture de `dist/angular-portfolio-app/browser/atelier/index.html` ; ce dossier servi en statique
  (`python3 -m http.server`), `/atelier/` ouvert dans le navigateur, en thème sombre.
- Extrait du HTML prérendu :
  ```html
  <title>L'atelier&nbsp;: outils de tourneur CN | Julien Nédellec</title>
  <meta name="description" content="Mon coin de tourneur CN&nbsp;: des outils d'usinage, à commencer par un guide pour choisir le type de plaquette selon la matière et l'opération.">
  <link rel="canonical" href="https://nedellec-julien.fr/atelier">
  <meta name="robots" content="index, follow">
  <app-workshop class="block min-h-svh pt-20" ngh="3">
  <h1 data-testid="workshop-title" class="…"> L'atelier </h1>
  <p data-testid="workshop-intro">À l'atelier comme dans le code, une règle tient tout&nbsp;: une pièce hors tolérance ne part pas.</p>
  <p data-testid="workshop-intro">Cet espace rassemble ce que j'apprends derrière mon tour CN, mis en forme en outils et en fiches que tu peux utiliser. Que tu sois dev curieux ou usineur qui débute, prends ce qui te sert.</p>
  "@type":"BreadcrumbList","itemListElement":[{…"name":"Accueil"…},{…"name":"L'atelier","item":"https://nedellec-julien.fr/atelier"}]
  ```
  Aucune CSP `unsafe-inline` dans le fichier.
- Capture : rendu après hydratation, en-tête du site, `h1` « L'atelier », deux paragraphes d'intro
  en `text-muted` (capture prise dans la session, non versionnée).
- Console : aucune erreur de l'application ni d'hydratation. Deux erreurs réseau propres au serveur
  statique de la vérification, sans API : `GET /api/config` 404 et `POST /api/analytics/track` 501.
- Verdict : **PASS**.

Tranche 2, 2026-10-25, worktree `034-pr3`.

- Steps : `pnpm run build --configuration production` (code de sortie 0), dossier
  `dist/angular-portfolio-app/browser` servi en statique (`python3 -m http.server`), `/atelier/`
  ouvert dans le navigateur, thème clair.
- Menu desktop à 1 024 × 768 : les quatre liens Blog, Réalisations, Parcours, « L'atelier » sont
  sur **une ligne** (même `top` 18 px, hauteur 44 px, de 352 à 718 px en abscisse), en-tête de
  81 px, aucun défilement horizontal (`scrollWidth` 1 009 px, barre de défilement déduite).
  « L'atelier » porte `aria-current="page"` et la pilule.
- Menu mobile à 375 × 812, drawer ouvert : quatre liens de 48 px de haut, le dernier est
  `/atelier`, « L'atelier », icône `#solid-wrench`, pilule active ; `scrollWidth` 375 px.
- Pied de page : colonne Ressources `/projects`, `/blog`, `/about`, `/atelier` dans cet ordre.
- Captures : en-tête à 1 024 px et drawer ouvert à 375 px (prises dans la session, non versionnées).
- Console : aucune erreur de l'application ni d'hydratation. Erreurs réseau propres au serveur
  statique sans API : `GET /api/config` 404 et `POST /api/analytics/track` 501.
- Verdict : **PASS**.

Tranche 7, 2026-10-26, worktree `034-pr5`.

- Steps : `pnpm run build --configuration production` (code de sortie 0, « Prerendered 3 static
  routes », `browser/atelier/index.html` présent, `browser/atelier/plaquettes/index.html` absent) ;
  `docker build -t ng-portfolio-app:a11y .` (code 0) puis `ci/a11y-stack.sh up` (image derrière
  nginx, doublure de l'API). Le serveur Node seul (`server.mjs`) écoute sur 127.0.0.1:4000 et
  répond 400 hors de nginx : la vérification passe par l'image, comme en production.
- `curl -D - '/atelier/plaquettes?matiere=inconnue'` : 200, `X-Cache-Status: MISS` (rendu par Node),
  `cache-control: no-cache`, une seule meta CSP, aucun `'unsafe-inline'` ; corps :
  `<title>Guide des plaquettes de tournage | Julien Nédellec</title>`, canonical
  `https://nedellec-julien.fr/atelier/plaquettes`, `h1` « Guide des plaquettes », chapô,
  avertissement, `p role="status"` vide. `/atelier/` : 200 sans `X-Cache-Status` (fichier).
  `/atelier/autre` : 404. `/sitemap.xml` liste `/atelier` puis `/atelier/plaquettes`.
- Navigateur : `/atelier/` en thème sombre, section « Les outils » et carte « Outil · Guide des
  plaquettes · résumé » ; clic sur la carte → `/atelier/plaquettes` sans rechargement (une seule
  entrée de navigation), titre, canonical et `BreadcrumbList` à trois niveaux suivent. Chargement
  direct de `/atelier/plaquettes?matiere=inconnue&operation=gorge` : page rendue, statut vide (rien
  de sélectionné), URL gardée ; la bascule de thème réagit après hydratation (`app-dark` retiré).
- Captures : carte de l'accueil et page du guide, sombre puis claire (prises dans la session, non
  versionnées).
- Console : aucune erreur de l'application ni d'hydratation ; seule erreur, `GET /api/config` 404,
  absent de la doublure de l'API.
- Axe : `pnpm a11y -g atelier`, 4 passed (`/atelier` et `/atelier/plaquettes`, clair et sombre),
  code de sortie 0.
- Verdict : **PASS**.

Tranche 8, 2026-10-26, worktree `034-pr5`.

- Steps (image réelle) : `pnpm run build --configuration production` (code 0, « Prerendered 3
  static routes ») ; `docker build -t ng-portfolio-app:a11y .` (code 0) puis `ci/a11y-stack.sh up`.
  `curl -D - '/atelier/plaquettes?matiere=inconnue-zz'` : 200, `X-Cache-Status: MISS`, aucun
  `'unsafe-inline'` ; le corps contient la section « La matière » (`h2`), le champ
  `role="combobox" aria-expanded="false" value=""`, la région `material-status` vide, et **zéro**
  occurrence de `inconnue-zz` (ni page, ni titre, ni canonical).
- Navigateur, image réelle (référentiel vide), clavier réel : clic dans le champ, flèche bas → aucune
  liste (`aria-expanded="false"`, pas d'`aria-activedescendant`), statut « Aucune matière trouvée » ;
  Entrée → rien choisi, URL inchangée (`?matiere=inconnue-zz` gardée telle quelle, jamais réaffichée) ;
  saisie d'une désignation absente → statut « Aucune matière trouvée » et phrase visible « Cette
  matière n'est pas encore dans le guide. », focus resté dans le champ.
- Navigateur, image de vérification **non commitée** (`ng-portfolio-app:verify-fixture`, `factory` du
  token complétée par `aMaterialCatalogue()` et la source fictive le temps du `docker build`, fichier
  restauré aussitôt, `git status` le montre identique, image supprimée ensuite) :
  - rendu serveur de `?matiere=alliage-essai-beta` (`curl`, sans JavaScript) : champ
    `value="Alliage essai Bêta"`, fiche `h3` « Alliage essai Bêta », citations liées au document fictif ;
  - clavier réel sur `/atelier/plaquettes` : saisie « zz fictif » → deux options, statut « 2 matières
    trouvées » ; flèche bas deux fois → `aria-activedescendant="material-option-1"`,
    `aria-selected="true"` sur Bêta, focus dans le champ ; Entrée → URL
    `?matiere=alliage-essai-beta`, `history.length` inchangé (5 → 5, `replaceUrl`), champ et fiche
    Bêta (4 citations) ; saisie « zz », Échap → liste fermée, texte gardé ; second Échap → « Alliage
    essai Bêta » réaffiché, URL inchangée ;
  - retour arrière : menu « L'atelier » puis carte du guide (deux navigations client), deux
    `history.back()` → `/atelier/plaquettes?matiere=alliage-essai-beta`, **même document** (marqueur
    `window` conservé), champ et fiche Bêta, URL non réécrite, `history.length` inchangé.
- Captures : champ sur l'état vide avec la phrase d'absence ; liste ouverte, option active ; fiche
  Bêta après Entrée (prises dans la session, non versionnées).
- Console : aucune erreur de l'application ni d'hydratation ; seules erreurs, `GET /api/config` 404
  (absent de la doublure) et un `POST /api/analytics/track` refusé pendant le redémarrage de la pile.
- Axe : `pnpm a11y -g atelier` sur l'image réelle, 4 passed (`/atelier` et `/atelier/plaquettes`,
  clair et sombre), code de sortie 0. Aucun axe sur l'image de vérification (liste ouverte et fiche :
  scénarios de la première PR de données).
- Verdict : **PASS**.

Tranche 9, 2026-10-26, worktree `034-pr5`.

- Steps (image réelle, référentiel sans matière) : `pnpm run build --configuration production`
  (code 0, « Prerendered 3 static routes ») ; `docker build -t ng-portfolio-app:a11y .` (code 0)
  puis `ci/a11y-stack.sh up`.
- `checked` dans le HTML servi (`curl`, sans JavaScript) : `?operation=gorge` → 200,
  `X-Cache-Status: MISS`, `<input … id="operation-gorge" value="gorge" checked="" …>`, les huit
  autres radios sans `checked`, aucun `'unsafe-inline'` ; `?operation=percage-plaquettes` →
  `checked=""` sur ce seul radio ; `?operation=inconnue-zz` → zéro `checked`, zéro occurrence du
  slug. `[checked]` suffit : pas de `[attr.checked]`. Après hydratation, même radio coché, même
  document (marqueur `window`), URL inchangée : l'hydratation ne change pas le contenu.
- Clavier réel, image réelle : clic sur « Gorge » (déjà coché), flèche bas → focus et choix sur
  « Tronçonnage », URL `?operation=tronconnage` par **une** navigation `replace`
  (`navigation.navigate`), `history.length` inchangé (2) ; trois flèches bas → « Filetage »,
  « Perçage au foret à plaquettes », puis retour en tête sur « Ébauche » (tournage extérieur) :
  les flèches traversent les familles et bouclent ; flèche haut → « Perçage au foret à
  plaquettes ». Toujours en `replace`, `history.length` inchangé.
- Retour arrière : menu « L'atelier » (navigation client), `history.back()` → guide avec
  `?operation=percage-plaquettes`, même document, radio coché ; seule navigation après le
  `traverse` : un `replace` vers la **même** URL, que le routeur émet aussi sur
  `/atelier/plaquettes` sans query string (comparé dans la même session) : il ne vient pas de
  l'effet.
- Image de vérification **non commitée** (`ng-portfolio-app:verify-fixture` : `factory` du token
  complétée par `aMaterialCatalogue()` et la source fictive le temps du `docker build`, fichier
  restauré aussitôt, `git status` le montre identique, image supprimée ensuite) :
  - rendu serveur de `?matiere=alliage-essai-beta&operation=gorge` (`curl`) : panneau
    `insert-guide-unavailable` « Pas encore de recommandation pour ce cas. » et rien d'autre, statut
    « Alliage essai Bêta, Gorge. Pas encore de recommandation pour ce cas. », radio `gorge`
    `checked=""` ;
  - clavier réel : flèche bas sur « Gorge » → URL `?matiere=alliage-essai-beta&operation=tronconnage`
    en une navigation, statut « Alliage essai Bêta, Tronçonnage. Pas encore… » ;
  - désélection : texte du champ sélectionné, Suppr, Tab → URL `?operation=tronconnage` en une
    navigation, fiche retirée, panneau « Choisis une matière et une opération. », statut vide ;
    saisie « gamma », flèche bas, Entrée → `?operation=tronconnage&matiere=alliage-essai-gamma` en
    une navigation (les deux clés), statut « Alliage essai Gamma, Tronçonnage. Pas encore… » ;
    Ctrl+A, Suppr, Échap → liste fermée, champ vide, focus gardé, URL `?operation=tronconnage`,
    statut vide. `history.length` inchangé sur toute la séquence (3).
- Captures : sélecteur au clavier sur l'image réelle ; panneau « Pas encore de recommandation pour
  ce cas. » à côté de la fiche Bêta (prises dans la session, non versionnées).
- Console : aucune erreur de l'application ni d'hydratation ; seule erreur, `GET /api/config` 404
  (absent de la doublure), une fois par chargement.
- Axe : `pnpm a11y -g atelier` sur l'image réelle, 4 passed (`/atelier` et `/atelier/plaquettes`,
  clair et sombre), code de sortie 0.
- Lecteur d'écran : non joué (Orca indisponible dans la session) ; l'annonce repose sur la région
  `role="status"` présente dès le HTML serveur, dont le texte change à chaque couple.
- Verdict : **PASS**.

Tranche 10, 2026-10-26, worktree `034-pr5`.

- Steps (image réelle, référentiel sans matière) : `pnpm run build --configuration production`
  (code 0, « Prerendered 3 static routes ») ; `docker build -t ng-portfolio-app:a11y .` (code 0) puis
  `ci/a11y-stack.sh up` ; `curl '/atelier/plaquettes?operation=finition-exterieure'` : 200,
  `X-Cache-Status: MISS`, aucun `'unsafe-inline'`, panneau « Choisis une matière et une opération. ».
  `pnpm a11y -g atelier` : 4 passed, code 0.
- Image de vérification **non commitée** (`ng-portfolio-app:verify-fixture` : `factory` du token
  remplacée le temps du `docker build` par `aReference` avec `OPERATION_FAMILIES`,
  `aMaterialCatalogue()` et une entrée fictive « finition extérieure » pour Alpha : code `ZQX`, champ
  `Q` déduit, géométrie déduite et de groupe, piège de groupe, vitesse `123` à `456 m/min` ; fichier
  restauré aussitôt, `git diff --quiet HEAD` le confirme ; image supprimée ensuite) :
  - rendu serveur (`curl`, sans JavaScript) de
    `?matiere=alliage-essai-alpha&operation=finition-exterieure` : 200, `X-Cache-Status: MISS`,
    aucun `'unsafe-inline'` ; panneau `h3` Plaquette, Géométrie, Nuance, Pièges ; « ZQX » puis un seul
    `dl` de trois champs (« Forme fictive Z Losange fictif », « Dépouille fictive Q Angle fictif
    **déduit des principes du fabricant** », « Tolérance fictive X Classe fictive »), chacun suivi de
    « Source : Document fictif de test (nouvel onglet), fixture » ; géométrie « conseil du groupe,
    déduit des principes du fabricant » ; piège « conseil du groupe » ; **aucune** occurrence de
    `123`, `456`, `m/min` ni « Vitesse » ; statut « Alliage essai Alpha, Finition (Tournage
    extérieur). Plaquette proposée : ZQX. » ; fiche : `h4` « Correspondances indicatives » ;
  - après hydratation, navigateur, `?matiere=alliage-essai-alpha&operation=gorge` : statut « Alliage
    essai Alpha, Gorge. Pas encore de recommandation pour ce cas. » ; clic réel sur « Finition »
    (tournage extérieur) → URL `?matiere=alliage-essai-alpha&operation=finition-exterieure`, même
    document (marqueur `window`), `history.length` inchangé (2), statut « … Plaquette proposée :
    ZQX. », code `ZQX`, trois champs lus avec la mention sur le seul `Q`, mentions du panneau
    « déduit… », « conseil du groupe, déduit… », « conseil du groupe », aucune vitesse ;
  - axe sur cette image, scénario « choix fait » ajouté le temps du passage
    (`e2e/a11y/scenarios.ts` restauré, `git diff --quiet HEAD`) : 6 passed (`/atelier`,
    `/atelier/plaquettes` et le couple couvert, clair et sombre), code 0.
- Capture : panneau « Plaquette », code `ZQX`, champs et mention « déduit des principes du fabricant »
  sous « Angle fictif » (prise dans la session, non versionnée).
- Console : aucune erreur de l'application ni d'hydratation ; seule erreur, `GET /api/config` 404
  (absent de la doublure).
- Verdict : **PASS**.

Tranches 10 et 11, données, 2026-10-26, worktree `034-pr5`.

- Steps (image réelle) : `pnpm run build --configuration production` (code 0, « Prerendered 3
  static routes ») ; `docker build -t ng-portfolio-app:a11y .` (code 0) ; `ci/a11y-stack.sh up`.
- Rendu serveur, sans JavaScript : `curl '/atelier/plaquettes?matiere=inconel-718&operation=finition-exterieure'`
  → 200, `X-Cache-Status: MISS`, aucun `'unsafe-inline'` ; fiche « Inconel 718 », groupe « Super-alliages
  et titane », code `RCGT`, trois citations de choix « déduit des principes du fabricant », statut
  « Inconel 718, Finition (Tournage extérieur). Plaquette proposée : RCGT. », aucune occurrence de `m/min`.
- Navigateur, après hydratation, au clavier : « 42cd4 » tapé → une suggestion « 42CrMo4 · 42CD4 ·
  Ancienne AFNOR · P » ; flèche bas, Entrée → fiche 42CrMo4, « Groupe ISO P Acier », URL
  `?matiere=42crmo4`. Clic sur « Ébauche » (tournage extérieur) → URL
  `?matiere=42crmo4&operation=ebauche-exterieure`, code `CNMG`, trois citations de choix (S1 négative,
  N et G ; S2 chariotage, forme C ; S1 ébauche, classe M), chacune « déduit des principes du
  fabricant » avec son lien Sandvik `fr-fr` ; le `dl` lu champ par champ (« Forme C Losange à 80° »,
  « Dépouille N Dépouille de 0° », « Tolérance M Classe M, tolérance large », « Fixation et
  brise-copeaux G Trou cylindrique, brise-copeaux sur les deux faces »), chaque sens cité sur la table
  (Mitsubishi Materials, Kyocera p. B1) ; statut « 42CrMo4, Ébauche (Tournage extérieur). Plaquette
  proposée : CNMG. » ; aucune vitesse. Puis « inconel » tapé → « 2 matières trouvées » (Inconel 718,
  Inconel 625) ; flèche bas, Entrée → `?matiere=inconel-718&operation=ebauche-exterieure`, code
  `RCGT`. Chargement direct `?matiere=en-aw-2017a&operation=finition-exterieure` : `CCGT`, première
  citation de choix **sans** mention (Kyocera, code écrit), seconde « déduit » (S2, forme C).
- Captures : panneau « Plaquette » CNMG (42CrMo4) et CCGT (EN AW-2017A), clair (prises dans la
  session, non versionnées).
- Console : aucune erreur de l'application ni d'hydratation ; seule erreur, `GET /api/config` 404
  (absent de la doublure).
- Axe : `pnpm a11y -g atelier`, 6 passed (`/atelier`, `/atelier/plaquettes`, et le choix fait
  `?matiere=42crmo4&operation=ebauche-exterieure`, clair et sombre), code 0.
- Verdict : **PASS**.

Codes par situation, 2026-10-26, worktree `034-pr5`.

- Steps (image réelle) : `pnpm run build --configuration production` (code 0, « Prerendered 3 static
  routes ») ; `docker build -t ng-portfolio-app:a11y .` (code 0) ; `ci/a11y-stack.sh up`.
- Rendu serveur, sans JavaScript (`curl`, URL partagées) : toutes en 200, aucun `'unsafe-inline'`,
  aucune occurrence de `m/min` :
  - `?matiere=42crmo4&operation=ebauche-exterieure` : Chariotage avec épaulement **CNMG**, Chariotage
    sans épaulement **SNMG**, Dressage **WNMG** ; statut « 42CrMo4, Ébauche (Tournage extérieur).
    Plaquettes proposées : CNMG (chariotage avec épaulement), SNMG (chariotage sans épaulement), WNMG
    (dressage). » ; la forme de chaque code citée sans mention, les autres lettres « déduit » ;
  - inox `?matiere=x2crnimo17-12-2&operation=finition-exterieure` : **SCMT** (chariotage sans
    épaulement), **RCMT** (profilage), rien à 91–95° ; `?matiere=x5crni18-10&operation=finition-interieure` :
    « Plaquette proposée : SCMT (chariotage sans épaulement). » ;
  - Inconel `?matiere=inconel-718&operation=ebauche-exterieure` : **RCGT** en chariotage sans
    épaulement et en profilage, aucune autre forme ;
  - alu `?matiere=en-aw-2017a&operation=finition-exterieure` : **CCGT**, **DCGT**, **VCGT**, **zéro**
    « déduit des principes du fabricant » sur la page (codes écrits par Kyocera, formes par S2) ;
  - liste de Julien : `Source : <span data-testid="source-citation-title">Liste de travail de Julien —
    correspondances indicatives</span>`, aucun lien, aucun `href` vers `nedellec-julien.fr/atelier`.
- Navigateur, après hydratation : `?matiere=42crmo4&operation=ebauche-exterieure`, clic réel sur
  « Finition » (tournage extérieur) → URL `?matiere=42crmo4&operation=finition-exterieure`, même document
  (marqueur `window` conservé), `history.length` inchangé (8), propositions « Chariotage avec épaulement
  CNMG », « Profilage DNMG », « Profilage à forte rampe VNMG », statut mis à jour.
- Capture : panneau « Plaquette », `h4` « Chariotage avec épaulement », `CNMG`, citation de la forme
  (« Tournage extérieur », « Chariotage », forme C en priorité) sans mention, puis deux citations
  « déduit des principes du fabricant » (prise dans la session, non versionnée).
- Console : aucune erreur de l'application ni d'hydratation ; seule erreur, `GET /api/config` 404
  (absent de la doublure).
- Axe : `pnpm a11y -g atelier`, 6 passed (`/atelier`, `/atelier/plaquettes`, et le choix fait
  `?matiere=42crmo4&operation=ebauche-exterieure`, clair et sombre), code 0.
- Verdict : **PASS**.

Correctifs de revue (décisions 16 et 17), 2026-10-26, worktree `034-pr5`.

- Steps (image réelle) : `pnpm run build --configuration production` (code 0, « Prerendered 3 static
  routes ») ; `docker build -t ng-portfolio-app:a11y .` (code 0) ; `ci/a11y-stack.sh up` (code 0).
- Rendu serveur (`curl`, toutes en 200), `?operation=finition-exterieure` et :
  - `matiere=x20cr13-x30cr13` : « Groupe ISO P Acier », citation « Matériaux de pièce, section « Aciers
    inoxydables ferritiques et martensitiques – P5.0-5.1 » » ; statut « Plaquettes proposées : CNMG
    (chariotage avec épaulement), DNMG (profilage), VNMG (profilage à forte rampe). » ; géométrie,
    nuance et piège cités à « Tournage des aciers inoxydables ferritiques et martensitiques », cinq
    mentions « conseil du sous-groupe » ;
  - `matiere=x5crnicunb16-4` (17-4 PH) et `matiere=stellite-6` : « Pas encore de recommandation pour ce
    cas. » ; groupes M et H affichés ;
  - `matiere=x2crnimon22-5-3` (duplex) : « Plaquette proposée : SNMG (chariotage sans épaulement). »,
    conseils de « Tournage des aciers inoxydables duplex (austénitiques/ferritiques) » (petits angles
    d'attaque, nuances CVD et PVD, super et hyper duplex, arrosage) ;
  - `matiere=inconel-718` : « Plaquette proposée : RCGT (profilage). », une seule proposition ;
  - `matiere=en-aw-2024` : source affichée « Plaquettes positives pour la finition de l'aluminium » ;
  - sur les six pages : zéro « AP » isolé dans le texte rendu, zéro « forme <lettre> ».
- Navigateur (pane, image Docker) : `x5crnicunb16-4`, `x20cr13-x30cr13`, `x2crnimon22-5-3`,
  `stellite-6` ouverts après hydratation, panneau conforme au rendu serveur.
- Captures : panneau « La plaquette » pour 17-4 PH et Stellite 6 (« Pas encore de recommandation pour
  ce cas. »), X20Cr13 (« Groupe ISO P Acier », CNMG), duplex (SNMG, « conseil du sous-groupe ») (prises
  dans la session, non versionnées).
- Console : aucune erreur de l'application ni d'hydratation ; `GET /api/config` 404 (absent de la
  doublure) et `POST /api/analytics/track` refusé lors des redémarrages de la pile.
- Axe : `pnpm a11y -g atelier`, 6 passed, code 0.
- Verdict : **PASS**.


Re-revue (un sous-groupe par section, comportements fidèles à la page), 2026-10-26, worktree `034-pr5`.

- Steps (image réelle) : `pnpm run build --configuration production` (code 0, « Prerendered 3 static
  routes ») ; `docker build -t ng-portfolio-app:a11y .` (code 0) ; `ci/a11y-stack.sh up` (code 0).
- Rendu serveur (`curl`, toutes en 200) :
  - `matiere=42crmo4&operation=ebauche-exterieure` : « faiblement alliés » ×4, « L'usure en cratère et
    l'usure en dépouille sont les plus courantes » ; zéro « plaquette wiper », zéro « Sous 0,25 » ;
  - `matiere=s235jr&operation=ebauche-exterieure` : « non alliés » ×4, « plaquette wiper », « Sous
    0,25 » ; zéro « cratère et l'usure » ;
  - `matiere=11smn30&operation=ebauche-exterieure` et `matiere=x5crnicunb16-4&operation=finition-exterieure` :
    « Pas encore de recommandation pour ce cas. » ; 11SMn30 affiche son comportement « décolletage »,
    17-4 PH cite « Précipitation (PH) » pour son groupe ;
  - `matiere=en-gjl-250`, `en-aw-2024`, `ta6v` (`operation=finition-exterieure`) : zéro « usinabilité
    en général bonne », « souvent facile », « le groupe le plus difficile » ; présents « copeaux courts,
    avec un bon contrôle », « copeaux longs, dont le contrôle », « beaucoup plus difficiles à couper ».
- Navigateur (pane, image Docker) : `?matiere=42crmo4&operation=ebauche-exterieure` après hydratation,
  panneau conforme au rendu serveur (nuance et piège cités à « Tournage des aciers faiblement alliés »,
  « conseil du sous-groupe »).
- Capture : panneau « La plaquette » de 42CrMo4, sections « Nuance » et « Pièges » (prise dans la
  session, non versionnée).
- Console : aucune erreur de l'application ni d'hydratation sur l'origine `127.0.0.1:3000` ; `GET
  /api/config` 404 (absent de la doublure).
- Axe : `pnpm a11y -g atelier`, 6 passed, code 0.
- Verdict : **PASS**.

## Review code

PR 5, troisième revue, `git diff bbbb23e...HEAD` (`1d16e73`), lu avec `git diff feat/034-accueil...HEAD` ; revue du 2026-10-26.

**Verdict** : APPROVED
**Gates CI locaux** : `pnpm install --frozen-lockfile` 0 / `pnpm run build --configuration production` 0 (« Prerendered 3 static routes ») / `pnpm test` 0 (252 fichiers, 5015 passed / 5015) / `pnpm lint` 0 / `pnpm run format:check` 0 / `docker build -t ng-portfolio-app:a11y .` 0, `ci/a11y-stack.sh up` 0, `pnpm a11y -g atelier` 0 (6 passed), `ci/a11y-stack.sh down` 0
**Checks mécaniques** : checker non vendoré (`.claude/checks/` absent) : auto-checks joués à la main. Sur les lignes ajoutées : archéologie (ADR, §, n° de spec) 0 ; `fakeAsync`/`.only`/`.skip`/snapshot/`innerHTML`/`console.`/`export default` 0 ; « forme <lettre> », Gemini, `nedellec-julien.fr` 0.
**Warnings de gate** : (b) pré-existant hors diff : `pnpm install`, « Ignored build scripts » (lockfile non touché). Build, test, lint, format, axe : aucun.
**Rendu compilé** : N/A (aucun composant à sélecteur attribut ni `shared/ui` touché)
**Preuve de verify runtime** : ✅ (preuve « Re-revue (un sous-groupe par section…) » complète et cohérente avec le diff ; rejouée sur l'image de cette revue par `curl`, toutes en 200 : `11smn30` et `x5crnicunb16-4` « Pas encore de recommandation pour ce cas. », 11SMn30 avec son comportement de décolletage, 17-4 PH cité par « Précipitation (PH) » ; `s235jr` et `c45` avec wiper, « Sous 0,25 % » et « revêtement mince » ; `42crmo4` sans aucun des trois, avec « usure en cratère et l'usure en dépouille » ; axe 6 passed)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ✅
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ✅

Suivi de la re-revue : point 1 corrigé (`non-alloyed-steel`, `low-alloyed-steel`, `free-cutting-steel` sans section ; deux entrées qui ne citent que leur section S4 ; `SUBGROUPS` à `section: string | undefined` ; fixture « deux sections d'aciers » refusée ; décision 17, `donnees-tournage.md` et journal à jour) ; point 2 corrigé (17-4 PH en M cité par la liste de travail, `stated`, citation épinglée en test, `donnees-tournage.md` corrigé) ; point 3 corrigé sur les sept lignes (chaque phrase recitée à la section qui l'écrit, phrases absentes de la page supprimées, locators épinglés pour une matière par groupe). Non bloquantes : « si les conditions sont stables » ajouté ; « à 55 HRC ou plus, nuances CBN » **inchangé** (`recommendations.static-data.ts:374`), alors que le journal le range parmi les remarques traitées ; la ligne sur la contradiction Stellite de S5 n'est pas écrite dans `donnees-tournage.md`.

Vérité des données, pages Sandvik `fr-fr` S5 et S4 relues le 2026-10-26 dans le navigateur (texte rendu), 21 citations contrôlées, toutes exactes :

- S5, comportements recités : P (« Groupes de matières usinées » : usinabilité qui varie avec dureté et carbone ; « Aciers ISO P », « Usinabilité en général » : bas carbone, copeaux plus longs et collants, arêtes vives ; « Eléments d'alliage », « Effet positif » : soufre et plomb, frottement réduit, fragmentation améliorée) ; M (paragraphe du groupe : chaleur, entaille, arêtes rapportées ; « ISO M aciers inoxydables », « Usinabilité en général » : efforts élevés et surfaces écrouies, contrôle des copeaux selon la structure) ; K (« ISO K fontes », « Usinabilité en général » : copeaux courts, bon contrôle ; paragraphe du groupe : grises et malléables assez faciles, nodulaires, compactes et ADI plus difficiles, SiC abrasif) ; N (« Usinabilité de l'aluminium » : copeaux longs, contrôle facile si allié ; paragraphe du groupe : métal tendre, arêtes vives à longue durée de vie, 13 % de Si) ; S (paragraphe du groupe : collants, arêtes rapportées, écrouissage, chaleur, « beaucoup plus difficiles à couper » que les ISO M ; « Usinabilité en général » : copeaux difficiles, efforts et puissance élevés ; « Titane– S 4.1-4.4 », « Usinabilité » : mauvaise conductivité, réaction chimique à vitesse trop élevée) ; H (« ISO H aciers trempés », « Usinabilité » : plus petit groupe, finition, efforts et puissance ; paragraphe du groupe : chaleur et abrasion).
- S5, nuance des non alliés (« Aciers non alliés – P 1.1-1.5 », « Usinabilité » : nuances à revêtement mince contre le collage sous 0,25 % de carbone) ; S4 « Tournage des aciers non alliés » (arêtes vives, géométries légères, wiper ; fragmentation et collage sous 0,25 %, grande avance, vitesse élevée) ; S4 « Tournage des aciers faiblement alliés » (cratère et dépouille, déformation plastique sur matière trempée ; premier choix aciers, nuances plus dures sur trempé : céramique, CBN, fonte).

Écarts de l'implémenteur :
- **Nuance des non alliés citée à S5** : acceptable. S4 n'écrit aucune nuance pour ce sous-groupe, la section S5 est celle qui classe ces trois matières, le texte est fidèle et conditionné aux bas carbone. Limite : la garde `subgroupDefects` ne filtre que les citations S4, et aucun test n'épingle celle-ci (observation 1).
- **« non alliés » retiré de la géométrie des faiblement alliés** : acceptable. S4 écrit « Pour les aciers non alliés non trempés » dans la section des faiblement alliés, contradiction interne de la page ; « sur matière non trempée » garde la condition sans attribuer aux faiblement alliés un conseil nommé pour une autre famille.
- **Comportement propre aux aciers de décolletage** : acceptable et juste. S5 écrit l'effet du plomb (frottement, fragmentation) et du soufre (couche lubrifiante de MnS, fragmentation) ; le comportement « bas carbone, copeaux longs et collants » n'est plus affiché pour eux.
- **17-4 PH épinglé en littéral** : acceptable. L'exception est unique, exacte (`['x5crnicunb16-4']`), et sa citation complète est épinglée par un second test ; toute autre fiche citée hors de la page du groupe fait toujours tomber la garde.

Gardes : aucune affaiblie. « Une section par sous-groupe » est structurelle (le type n'admet qu'une `section`, ou `undefined` qui produit `subgroup-without-section`) ; la couverture exacte est épinglée (`11smn30`, `11smnpb30`, `x5crnicunb16-4`, `stellite-6`) ; « citation S4 écrite ⇒ conseil de sous-groupe » intacte.

**Tests notables** :
- ✨ `reference-integrity.spec.ts`, `it.each` des neuf aciers (sous-groupe et section S5 de classement) et des locators de comportement d'une matière par groupe : la correspondance phrase → section est désormais épinglée, plus seulement relue.
- ✨ `reference-integrity.spec.ts`, fixture « an entry citing the sections of two steel subgroups » : la nouvelle garde est prouvée mordante.

**Observations non bloquantes** :
1. `src/app/features/workshop/domain/recommendations.static-data.ts:331-339` : la citation S5 de la nuance des non alliés échappe à `subgroupDefects` (`reference-integrity.spec.ts:517`, filtre `TURNING_MATERIALS`). Une citation S5 d'une autre section passerait sans test. Étendre la garde (une citation S5 `scope: 'subgroup'` d'une entrée doit nommer la section qui classe ses matières), ou épingler celle-ci en littéral.
2. `src/app/features/workshop/domain/materials.static-data.ts:166-170` : la phrase du titane, citée à « Titane– S 4.1-4.4 », porte `scope: 'group'` et s'affiche « conseil du groupe » sur Inconel 718, Hastelloy, Haynes 25. Le texte se qualifie lui-même (« Le titane… ») et n'est pas faux, mais c'est une section de sous-groupe.
3. `recommendations.static-data.ts:374` et `specs/assets/034/donnees-tournage.md` : les deux remarques non appliquées ci-dessus (« à l'état trempé », contradiction Stellite) ; corriger aussi la phrase du journal qui les donne pour traitées.

**Risque résiduel** :
- réversibilité : profil muet · monitoring : Sentry (profil)
- non couvert par les gates : la vérité des données reste prouvée par la lecture humaine des pages ; la citation S5 d'une entrée n'est gardée par aucun test (observation 1).

PR 5, re-revue après correctifs, `git diff 067cda3...HEAD` (`6962363`, `bbbb23e`), lu avec `git diff feat/034-accueil...HEAD` ; revue du 2026-10-26.

**Verdict** : REJECTED
**Gates CI locaux** : `pnpm install --frozen-lockfile` 0 / `pnpm run build --configuration production` 0 (« Prerendered 3 static routes », CSP hachée sur 4 pages) / `pnpm test` 0 (252 fichiers, 4996 passed / 4996) / `pnpm lint` 0 / `pnpm run format:check` 0 / `docker build -t ng-portfolio-app:a11y .` 0, `ci/a11y-stack.sh up` 0, `pnpm a11y -g atelier` 0 (6 passed), `ci/a11y-stack.sh down` 0
**Checks mécaniques** : checker non vendoré (`.claude/checks/` absent) : auto-checks joués à la main. Archéologie (motif du profil) 0 hit sur les lignes ajoutées ; `fakeAsync`/`waitForAsync`/`.only`/`.skip`/snapshot/`innerHTML`/`console.`/`export default`/`ngModel`/`changeDetection`/`styles:` 0 ; `nedellec-julien.fr`, Gemini, `Coro[A-Z]` 0 ; « forme <lettre> » une fois, dans la fixture qui prouve que la garde mord (`reference-integrity.spec.ts`, cas `'forme S, forme W, forme T'`).
**Warnings de gate** : (b) pré-existant hors diff : `pnpm install`, « Ignored build scripts » (lockfile non touché). Build, test, lint, format, axe : aucun.
**Rendu compilé** : N/A (aucun composant à sélecteur attribut ni `shared/ui` touché)
**Preuve de verify runtime** : ✅ (preuve « Correctifs de revue (décisions 16 et 17) » complète et cohérente avec le diff ; rejouée sur l'image de cette revue par `curl` : `?matiere=x5crnicunb16-4` affiche « Pas encore de recommandation pour ce cas. », `?matiere=42crmo4` et `?matiere=s235jr` en 200 avec leurs conseils ; axe 6 passed)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ✅
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ❌

Suivi de la revue précédente : point 1 corrigé (X20Cr13 en P, section P5 exacte, test ré-ancré) ; point 2 corrigé pour M, S et H (austénitiques, duplex et sa section, ferritiques et martensitiques avec la seule section P5, Stellite 6 et 17-4 PH sans recommandation), **pas pour P** (point 1 ci-dessous) ; point 3 corrigé (mots de la page, formes imposées en `deduced`) ; point 4 corrigé sur les deux locators cités, **pas sur le reste de la même surface** (point 3 ci-dessous) ; point 5 corrigé (amendement d'ADR-0033). Non bloquantes : RCGT une seule fois, titre Kyocera descriptif, rayon de bec aux mots de S1, positive des austénitiques fondée sur S1, « toujours supérieur à 75° » : soldées.

Vérité des données, pages Sandvik `fr-fr` S1 à S5 relues le 2026-10-26 dans le navigateur (texte rendu, pas un résumé), 40 citations contrôlées :

- **Exactes** : S2 « Chariotage » (type C (80°) à 91–95°, carrée à 75° sans épaulement), « Profilage » (type D (55°) à 93°, type V (35°) pour un angle de ramping plus grand), « Dressage » (trigone à 95° pour la polyvalence) ; S3 « Chariotage » (triangulaire à 91–95°, type C (80°) pour une arête plus résistante, carrée à 75°, angle de pointe faible et petit rayon), « Profilage », introduction (rupture de plaquette, état de surface) ; S1 « Ebauche », « Semi-finition », « Finition », « Rayon de bec des plaquettes de tournage » (égal à la profondeur de coupe ou un peu plus petit), « Plaquette de tournage négative / positive » (0°, 7° par exemple, réversibilité, premier choix) ; S4, toutes les citations `subgroupAdvice` des sections non alliés, faiblement alliés, ferritiques et martensitiques, austénitiques, duplex, fontes, aluminium, superalliages, aciers trempés (texte conforme, section exacte) ; S5, sections « Aciers non alliés – P 1.1-1.5 », « Aciers faiblement alliés – P 2.1-2.6 », « Aciers inoxydables ferritiques et martensitiques – P5.0-5.1 » (classement P et deux comportements), « Acier inoxydable austénitique et super-austénitique – M1.0-2.0 », « Acier inoxydable duplex – M 3.41-3.42 », fontes, « Titane– S 4.1-4.4 », « Matières en superalliages réfractaires – S 1.0-3.0 », ligne H3.0 « Stellites » du tableau « Codification MC pour les aciers trempés », « ISO M aciers inoxydables », « Usinabilité en général ». Aucun mot de page traduit en lettre dans une citation `stated`.
- **Fausses ou étendues** : points 1 à 3.

Contrôles demandés (3), les gardes : aucune n'est affaiblie hors du cas « aciers ». La table mot → lettre (`SHAPE_WORDS`) borne le mot (lookbehind et lookahead sur `\p{L}`, « carrées » et « arrondie » ne donnent rien) et `shapeCitation` exige désormais le mot de la page, plus strict que l'ancienne chaîne « forme <lettre> » ; le refus de « forme <lettre> » porte sur toute citation `stated` ; `imposed` ne passe que pour les sous-groupes de `SHAPE_RULES`, qui exigent le conseil écrit **et** une citation déduite nommant la forme, tout autre sous-groupe retombant sur la garde « forme écrite par la page de la famille » ; la couverture exacte est épinglée en littéral (`x5crnicunb16-4`, `stellite-6`). Seule faiblesse : `SUBGROUPS.steel.sections` liste trois sections S4, ce qui laisse passer une entrée qui mêle les conseils de deux sections (point 1).

Écarts de l'implémenteur (4) :
- **17-4 PH en M** : non retenu tel quel, point 2.
- **11SMn30 / 11SMnPb30 et « aciers non alliés »** : non retenu, point 1. S4 affiche « Classification des matières : P1.1 » ; S5 range les aciers de décolletage en P1.4 et écrit que le soufre et le plomb y **améliorent** la fragmentation des copeaux (« Effet positif »). Le piège affiché (« Sous 0,25 % de carbone, le copeau se fragmente mal ») dit le contraire de S5 pour ces deux matières.
- **Un seul sous-groupe « aciers »** : non retenu, point 1. S4 traite trois sections distinctes ; l'amendement d'ADR-0033 écrit dans ce même diff dit qu'un conseil de section « ne couvre que les matières de ce sous-groupe ».

**Tests notables** :
- ✨ `reference-integrity.spec.ts`, cas de `shapesNamedBy` (dix mots, dont « forme S… » et « arrondie, carrées » qui ne donnent rien) et cinq fixtures de `subgroupDefects` : chaque garde nouvelle est doublée d'une preuve qu'elle mord.
- ⚠️ `reference-integrity.spec.ts`, `SUBGROUPS.steel` : trois sections pour un sous-groupe, c'est l'exception que la garde « une entrée ne couvre que le sous-groupe dont elle cite la section » devait interdire (point 1).

**Observations non bloquantes** :
- `materials.static-data.ts:74-77` : S5 classe les « Stellites » en H (ligne H3.0, citée), mais nomme aussi « Stellite 21, 31 » parmi les alliages à base de cobalt de « Matières en superalliages réfractaires – S 1.0-3.0 ». Stellite 6 reste défendable en H (décision 16), sans recommandation ; la contradiction de la page mérite une ligne dans `donnees-tournage.md`.
- `recommendations.static-data.ts:364-367` : « à 55 HRC ou plus, nuances CBN » ; S4 l'écrit pour les martensitiques usinés **à l'état trempé**. « À l'état trempé, nuances CBN » serait plus proche de la page.
- `recommendations.static-data.ts:150-157` : S3 conditionne la carrée à 75° à des « conditions stables » ; le locator l'omet. Un mot à ajouter.

**Risque résiduel** :
- réversibilité : profil muet · monitoring : Sentry (profil)
- non couvert par les gates : la vérité des données reste prouvée par la seule lecture humaine des pages ; publication sans relecture (décision 9) : les points 1 à 3 partiraient en ligne tels quels.

**Points à corriger** :
1. `src/app/features/workshop/domain/recommendations.static-data.ts:329-359` (entrée `STEEL`), `src/app/features/workshop/domain/reference-integrity.spec.ts` (`SUBGROUPS.steel`, trois sections) et `src/app/features/workshop/domain/materials.static-data.ts:165-271` (`subgroup: 'steel'`) : un sous-groupe « aciers » couvre trois sections S4. Rendu vérifié par `curl` : 42CrMo4 (P2) affiche « Sur l'acier non allié… plaquette wiper » et le piège « Sous 0,25 % de carbone… », S235JR (P1) affiche « Sur l'acier allié, l'usure en cratère… », chacun marqué « conseil du sous-groupe » alors qu'il vient de la section d'un autre. C'est l'extension que la décision 17 et l'amendement d'ADR-0033 (`docs/adr/0033-referentiel-d-usinage-source-par-le-type.md:108-113`) interdisent. Pour 11SMn30 et 11SMnPb30 (P1.4, décolletage), le piège de la section P1.1 contredit S5 (soufre et plomb améliorent la fragmentation). Correction attendue, RED d'abord : deux sous-groupes `non-alloyed-steel` et `low-alloyed-steel`, une section S4 chacun, deux familles d'entrées qui ne citent que leur section ; garde `SUBGROUPS` à une section par sous-groupe. Pour les aciers de décolletage, **décision de Julien** : sous-groupe sans section (sans recommandation, comme 17-4 PH), ou conseils non alliés gardés avec le piège de fragmentation retiré pour eux. Mettre à jour décision 17, `donnees-tournage.md` et le journal.
2. `src/app/features/workshop/domain/materials.static-data.ts:58-62` (`STAINLESS_BY_CHROMIUM`) : 17-4 PH placé en M par une citation **déduite** de S5 « 12 % de chrome minimum ». La déduction ne tient pas sur la page même : S5 écrit que les inox ferritiques et martensitiques, eux aussi à 12 % de chrome ou plus, sont classés en ISO P, et son tableau a une ligne `P5.0.Z.PH` (durcis par précipitation, ferritiques ou martensitiques). Le chrome ne départage donc pas M de P. Tant que Julien n'a pas tranché la structure du 17-4 PH, le groupe M doit citer ce qui le dit : la liste de travail (`julien-working-list`, page 2, ISO M, ligne « Précipitation (PH) », `stated`), affichée comme indicative ; garder en test la citation retenue. Corriger `donnees-tournage.md:87-89`.
3. Locators de comportement de groupe qui citent « Groupes de matières usinées » pour un texte écrit ailleurs sur S5, ou absent : même défaut que le point 4 de la revue précédente, balayé sur deux lignes seulement.
   - `materials.static-data.ts:85` : « copeau long et collant » est sous « Aciers ISO P », « Usinabilité en général » ;
   - `:91` : « Écrouissage » n'est pas dans le paragraphe ISO M de « Groupes de matières usinées » (il est sous « ISO M aciers inoxydables », « Usinabilité en général ») ;
   - `:114` : S5 n'écrit pas « usinabilité en général bonne » pour les fontes ; le paragraphe ISO K dit les nodulaires, compactes et bainitiques « plus difficiles », « ISO K fontes », « Usinabilité en général », écrit « bon contrôle des copeaux » ;
   - `:120-121` : « copeau long » est sous « ISO N », « Usinabilité de l'aluminium » ; « souvent facile à usiner » n'est écrit nulle part ;
   - `:127-130` : « le groupe le plus difficile » n'est pas écrit (S5 : « beaucoup plus difficiles à couper » que les ISO M) ; efforts et contrôle des copeaux sont sous « ISO S… », « Usinabilité en général » ;
   - `:131` : le titane est sous « Titane– S 4.1-4.4 », « Usinabilité » ;
   - `:135-136` : « plus petit groupe », « finition » et « efforts de coupe » sont sous « ISO H aciers trempés », « Usinabilité ».

   Chaque locator doit nommer la section qui écrit la phrase, et chaque phrase ne dire que ce que la section écrit.

PR 5, état complet (tranche 10, données du tournage, codes par situation), `git diff f7813c3...HEAD` (`847b90d` à `067cda3`), lu avec `git diff feat/034-accueil...HEAD` ; revue du 2026-10-26.

**Verdict** : REJECTED
**Gates CI locaux** : `pnpm install --frozen-lockfile` 0 / `pnpm run build --configuration production` 0 (« Prerendered 3 static routes ») / `pnpm test` 0 (252 fichiers, 4981 passed / 4981) / `pnpm lint` 0 / `pnpm run format:check` 0 / `docker build -t ng-portfolio-app:a11y .` 0, `ci/a11y-stack.sh up` 0, `pnpm a11y -g atelier` 0 (6 passed, dont `?matiere=42crmo4&operation=ebauche-exterieure` clair et sombre)
**Checks mécaniques** : checker non vendoré (`.claude/checks/` absent) : auto-checks joués à la main. Archéologie (motif du profil) 0 hit sur les lignes ajoutées (les `@ts-expect-error:` disent la garantie, sans référence) ; `fakeAsync`/`waitForAsync`/`.only`/`.skip`/snapshot/`fireEvent`/`export default`/`ngModel`/`styles:`/`changeDetection` 0 ; `innerHTML` une fois, en lecture dans un test ; IA citée dans les données 0 ; `nedellec-julien.fr` 0 hors de la garde qui l'interdit.
**Warnings de gate** : (b) pré-existant hors diff : `pnpm install`, « Ignored build scripts » (lockfile non touché). Build, test, lint, format, axe : aucun.
**Rendu compilé** : N/A (aucun composant à sélecteur attribut ni `shared/ui` touché)
**Preuve de verify runtime** : ✅ (preuves « Tranche 10 », « Tranches 10 et 11, données » et « Codes par situation » complètes et cohérentes avec le diff ; axe rejoué sur l'image de cette revue, 6 passed)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ✅
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ❌

Vérité des données, pages Sandvik `fr-fr` relues le 2026-10-26 :

- **Exactes** : noms des six groupes (S5, « Groupes de matières usinées ») ; Stellite en H (S5) ; S2 « Chariotage » (« type C (80°) en priorité », carrée à 75°, 91–95°), « Profilage » (« type D (55°) » à 93°, « type V (35°) » pour un angle de ramping plus grand), « Dressage » (carrée à 75°, rhombique 80° ou trigone à 95°) ; S3 « Chariotage » (positive, triangulaire ou type D, type C pour une arête plus résistante, carrée à 75°, petit angle de pointe et petit rayon, porte-à-faux le plus petit possible) ; rupture de plaquette sur copeau mal évacué (introduction de S3) ; S1 (négative premier choix en extérieur, positive en intérieur, sections Ebauche, Semi-finition, Finition, rayon de bec) ; S4 alu (positive à arêtes vives, toujours ; PCD au-delà de 13 % de Si ; arrosage pour les copeaux), superalliages (angle d'attaque inférieur à 45°, valable aussi pour le titane ; arêtes vives ; 0,25 mm ; arrosage), aciers trempés (CBN ; céramique ou carbure sous 55 HRC ; wiper ; profondeur faible ; stabilité), fontes (copeau court, déduction du A correctement marquée). Toutes les bases `deduced` contrôlées découlent du principe cité. La forme R du groupe S est bien marquée déduite.
- **Fausses ou étendues** : points 1 à 4.

Contrôles demandés : (2) aucune vitesse (garde + modèle), aucune IA ; noms d'outils et de nuances absents des recommandations, garde intacte ; exemption limitée aux chemins `.cite.source` et `.choice[n].source` (identifiants, jamais affichés). La liste de Julien est sans lien, la garde interdit toute URL vers le site. Correspondances sous « Correspondances indicatives ». (5) `InsertFor<O>` borne les situations par famille, `choice` et `proposals` non vides au type ; `url?` tenu par deux gardes (seule la liste sans URL, `https` vérifié sinon) ; panneau `h3` puis `h4` par situation, listes, citations après chaque valeur, mention sur sa propre ligne, statut `role="status"` mis à jour (singulier, pluriel) ; aucune API navigateur, rendu serveur vérifié par `curl` dans la preuve. (6) Locators paraphrasés, pas de longue citation.

**Tests notables** :
- ✨ `reference-integrity.spec.ts:591-605` et voisins : chaque invariant de contenu est doublé de fixtures qui prouvent qu'il mord.
- ⚠️ `reference-integrity.spec.ts:567-572` : `shapeCitation` et `NAMES_A_SHAPE` jugent sur la chaîne « forme <lettre> » du locator, pas sur ce que la page écrit. La garde passe dès que le locator contient la lettre, et pousse à l'écrire dans une citation `stated` même quand la page ne l'écrit pas (point 3). Fragilité de l'écart 6 confirmée.
- ⚠️ `reference-integrity.spec.ts:496` : épingle X20Cr13 en M, contraire à S5 (point 1).

**Duplication / dérivation** (advisory) :
- ⚠️ `recommendations.static-data.ts:565-568` : RCGT deux fois en S. Les deux éléments ne diffèrent que par la citation de situation ; celle du chariotage sans épaulement dit « carrée à 75° » au-dessus d'une plaquette ronde. Une seule proposition (profilage, ou situation commune) dirait la même chose sans doublon. À trancher par Julien ; non bloquant.

**Observations non bloquantes** :
- `sources.static-data.ts:52` : le titre « AP Breaker » est affiché dans chaque citation Kyocera, et « AP » figure parmi les brise-copeaux du référentiel (« à ne jamais afficher comme recommandation »). C'est un titre de source, pas une recommandation, mais un titre descriptif (« Plaquettes positives pour la finition de l'aluminium ») éviterait la question. Les noms de matières de la liste (Inconel, Hastelloy, Haynes, Stellite) sont des marques d'alliage, hors de la règle des noms d'outils.
- `recommendations.static-data.ts:255-270` : « grand rayon » en ébauche, « petit rayon » en finition, sous base `stated` : S1 associe le grand rayon aux grandes profondeurs et le petit aux petites, sans le rattacher aux étapes. Le pas est court, mais il est déduit.
- `recommendations.static-data.ts:217-220` : en français, S4 écrit « face de dépouille positive », traduction de *positive rake* (face de coupe) ; la déduction « dépouille C, 7° » porte sur l'angle de dépouille. Elle est marquée déduite, mais elle repose sur une traduction ambiguë.
- `specs/assets/034/donnees-tournage.md` et le journal citent S3 « jamais moins de 75° » ; la page écrit « toujours supérieur à 75° ». Le sens est le même, à reprendre si le texte est cité.

**Risque résiduel** :
- réversibilité : profil muet · monitoring : Sentry (profil)
- non couvert par les gates : la vérité des données n'est prouvée que par la lecture humaine des pages (cette revue en a lu cinq) ; aucun test ne compare un locator au contenu de la page. Publication sans relecture (décision 9) : les points 1 à 3 partiraient en ligne tels quels.

**Points à corriger** :
1. `src/app/features/workshop/domain/materials.static-data.ts:267` : X20Cr13 / X30Cr13 cités en ISO M par S5 en base `stated`. S5 écrit le contraire, sous « Aciers inoxydables ferritiques et martensitiques – P5.0-5.1 » : du point de vue de l'usinabilité, ces aciers sont classés en ISO P, et le paragraphe ISO P les cite. La décision 16 (« le classement de Sandvik l'emporte ») place donc X20Cr13 en P ; son exemple « X20Cr13 en M » repose sur une lecture fausse de S5, reprise au journal. À remonter à Julien avant correction. Ensuite : groupe P (sous-groupe P5), test `reference-integrity.spec.ts:496` ré-ancré, entrées P qui le couvrent, `donnees-tournage.md`, décision 16 et journal corrigés.
2. `src/app/features/workshop/domain/recommendations.static-data.ts:206-220` et `:331-359` (M), `:429-446` (H) : un conseil de **sous-groupe** est appliqué à tout le groupe. S4 a trois sous-sections inox. Les conseils cités (ronde ou faible angle d'attaque, dépouille positive, grand rayon, arrosage toujours, CVD/PVD) sont écrits pour les **austénitiques**. Ils s'affichent pour 17-4 PH, et pour X20Cr13 tant que le point 1 n'est pas corrigé, alors que S4 ne donne pour les ferritiques et martensitiques qu'un conseil de nuance. Pour le duplex, S4 a sa propre sous-section, qui n'est pas citée. Même chose pour Stellite 6, qui reçoit le CBN et le CNGA/WNGA de « Tournage des aciers trempés » (S4 : aciers de 55 à 65 HRC). La décision 11 rattache un conseil « à chaque matière de ce groupe » ; l'étendre d'un sous-groupe aux autres est l'extrapolation qu'ADR-0033 rejette. Le test `reference-integrity.spec.ts:591` (« chaque entrée couvre exactement toutes les matières d'un groupe ») impose aujourd'hui cette extension. Décision de Julien attendue : entrées par sous-groupe (test à revoir), ou matières sans conseil propre laissées en `unavailable`.
3. Citations `stated` qui portent une déduction ou une lettre que la page n'écrit pas :
   - `recommendations.static-data.ts:212-216` : « d'où 75° sans épaulement plutôt que 91–95° » ;
   - `:207-211` : « à la place de la forme D du profilage » (S4 écrit seulement « plaquettes rondes ou angles d'attaque faibles ») ;
   - `:104`, `:128`, `:139` et `:155` : « forme S », « forme W », « forme T » attribuées à S2 ou S3, qui écrivent « carrée », « trigone » et « triangulaire » sans lettre. Seules C, D et V y sont écrites.

   Les locators doivent dire ce que la page écrit (le mot de la page). La correspondance mot ↔ lettre reste portée par la table de lecture (MMC), déjà citée sur le champ, et la sélection de forme imposée par la matière passe en `deduced` (ou en deux citations : le conseil écrit, puis le choix déduit). La garde `shapeCitation` / `NAMES_A_SHAPE` (`reference-integrity.spec.ts:567-572`) est à réécrire en conséquence, par une table mot de la page → lettre, en RED d'abord.
4. Locators inexacts : `materials.static-data.ts:52-57` cite « Groupes de matières usinées » pour une phrase de « ISO M aciers inoxydables > Usinabilité en général ». Elle en élargit aussi le sens : S5 dit que le contrôle des copeaux est correct en ferritique et martensitique, pas que ces aciers « se coupent plus facilement ». `recommendations.static-data.ts:281` : « évacuation des copeaux » n'est pas une section ; c'est l'introduction de S3.
5. `docs/adr/0033-referentiel-d-usinage-source-par-le-type.md:35-37` et `:90-103` : la décision 1 exige une « URL `https` » dans le catalogue, et l'amendement ne couvre que les décisions 9 à 12. La source sans URL (décision 15, `source.model.ts:16`) contredit l'ADR sans qu'il le dise. Ajouter une ligne à l'amendement : URL facultative pour un document sans adresse publique, gardée par test.

PR 5 (tranches 7 à 9 et correctif), `git diff feat/034-accueil...HEAD` (`190be60`, `033c05d`, `d335ca8`, `ecdce69`, `106804e`), revue du 2026-10-26.

**Verdict** : APPROVED
**Gates CI locaux** : `pnpm install --frozen-lockfile` 0 / `pnpm run build --configuration production` 0 (« Prerendered 3 static routes », CSP hachée sur 4 pages) / `pnpm test` 0 (250 fichiers, 4877 passed / 4877) / `pnpm lint` 0 / `pnpm run format:check` 0 / `docker build -t ng-portfolio-app:a11y .` 0 / `pnpm a11y -g atelier` 0 (4 passed : `/atelier` et `/atelier/plaquettes`, clair et sombre)
**Checks mécaniques** : checker non vendoré (`.claude/checks/` absent) : auto-checks joués à la main. Archéologie (motif du profil) 0 hit sur les lignes ajoutées ; `fakeAsync`/`waitForAsync`/`.only`/`.skip`/snapshot/`fireEvent` 0 ; `ngModel`/`FormsModule`/`ReactiveFormsModule`/`styles:`/`changeDetection`/`@Input`/`ngAfterViewInit`/`setTimeout` 0 dans le code applicatif ; import `infra` depuis `application` ou `pages` 0 ; cast hors `testing/` et specs 0 ; ancien slug `percage`, `isoGroups`, `IsoGroupColor`, `--color-iso-*` 0 dans `src/`, `e2e/`, `ci/`, `.github/`, `docs/` ; aucune chaîne de fixture (`ZZ-FICTIF`, `alliage-essai`, `fictif`) dans `dist/…/browser/*.js`.
**Warnings de gate** : (b) pré-existant hors diff : `pnpm install`, « Ignored build scripts » (lockfile non touché). Build, test, lint, format, axe : aucun.
**Rendu compilé** : ✅ (`a[app-link-card]` touché : styles posés par classes Tailwind de `host`, aucun `styles:`, rien d'encapsulé à vérifier dans le bundle)
**Preuve de verify runtime** : ✅ (preuves des tranches 7, 8 et 9 complètes et cohérentes avec le diff ; rejouées sur l'image de cette revue : `curl` de `?operation=gorge` → 200, `X-Cache-Status: MISS`, `checked=""` sur le seul radio `gorge` ; `?operation=inconnue-zz&matiere=inconnue-zz` → aucun `checked`, zéro occurrence du slug ; canonical `https://nedellec-julien.fr/atelier/plaquettes` sans query string sur toutes les variantes ; une seule meta CSP, aucun `'unsafe-inline'` ni dans le corps ni dans les en-têtes ; `/atelier/plaquettes/autre` 404 sans Node, `/atelier/` sans `X-Cache-Status` ; clé du micro-cache par query (`gorge` HIT, `filetage` MISS, radios distincts) ; navigateur, clic réel sur « Filetage » après hydratation → `?operation=filetage`, `history.length` inchangé (5), flèche bas dans le champ → statut « Aucune matière trouvée » ; console : `GET /api/config` 404 de la doublure seulement. Le correctif `106804e` ne touche qu'une fonction pure, couverte par `insert-guide-status.spec.ts`.)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ✅
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ✅

Contrôles demandés : (1) `MATERIALS`, `RECOMMENDATIONS`, `SOURCES` vides, `SourceId` à `never` ; `INSERT_GUIDE_REFERENCE` sans cast ; seul cast, `aReference` dans `testing/insert-guide-builders.ts:119` ; aucune fixture dans le bundle. (2) Combobox au motif d'`admin-tags-selector` (rôles, `aria-activedescendant`, `mousedown.preventDefault`, statut `sr-only`, `FormValueControl`) ; `afterRenderEffect({ write })` à l'identique de l'admin, sans lecture de mise en page ; Signal Forms correct (`form(linkedSignal)`, `[formField]` sur deux contrôles personnalisés, aucun attribut concurrent). (3) Une seule navigation à deux clés, `replaceUrl: true`, garde « modèle ≠ URL » qui empêche toute navigation au rendu serveur et à l'hydratation ; un slug inconnu n'est jamais réécrit, il tombe à la première navigation de l'utilisateur (décision consignée). (4) cf. ligne verify ; regex nginx et `nginx-config.spec.ts` alignés. (5) `label for`, `fieldset` + `legend` imbriqués, deux régions `role="status"` présentes dès le HTML serveur, aucun déplacement de focus, radios dans des `label` de 44 px ; axe vert. (6) Nommage, hôte, Tailwind, `track`, couches : conformes. (7) `insert-guide.ts:102` : conforme. Une ligne, sans référence ni récit, et elle dit pourquoi la garde existe (rendu serveur, retour arrière), ce que la condition seule ne montre pas ; les commentaires du dépôt sont en français.

**Tests notables** :
- ✨ `insert-guide.spec.ts` : la mutation à la main de la garde d'URL (journal, tranche 8) fait tomber le test du slug inconnu ; le contrat de navigation est épinglé par le nombre de navigations et `replaceUrl`, pas par l'implémentation.
- ✨ `material-combobox.spec.ts:163-185` : la boucle des flèches est faite dans un seul `it` et comparée en une liste ; un échec dit quelle touche a dévié.
- ⚠️ `link-card.spec.ts:97` : épingle la classe `text-muted` du résumé, un détail de style qui casse au moindre ajustement visuel. Prescrit, à garder en tête.

**Duplication / dérivation** (advisory) :
- ⚠️ `insert-guide.ts:21-28` : la liste de classes du `h1` et du chapô est la même que sur l'accueil de l'atelier, `/blog`, `/projects` et l'en-tête de projet. Le diff ajoute un cinquième site, et le journal (tranche 7) consigne le report. Pour la suite, un composant `shared/ui` « tête de page » plutôt qu'un `@utility`, parce que la structure couvre deux éléments.

**Observations non bloquantes** :
- `material-sheet.ts:29` : `track $index` sur les traits de comportement. La liste est figée, donc la règle n'est pas enfreinte, mais `track trait.value` serait cohérent avec `workshop.ts` (`track paragraph`).
- `material-combobox.ts:180-183` : un texte partiel laissé en quittant le champ garde la matière choisie, alors que le champ affiche ce texte et que la fiche montre une autre matière. La décision est consignée (tranche 9) et testée. Elle mérite un regard de Julien à la première PR de données, la seule où elle devient visible.
- `material-combobox.ts:60` : une option fait environ 36 px de haut (`py-2`, `text-sm`), contre 44 px pour les radios. WCAG 2.5.8 (24 px) est tenu, et la cote reprend celle de l'admin. À contrôler à 375 px avec le scénario axe « liste ouverte » de la première PR de données.
- `material.model.ts:5` : `IsoGroup` n'a plus de consommateur de production jusqu'au retour d'`ISO_513_GROUPS`. Ce maintien est consigné (tranche 8).

**Risque résiduel** :
- réversibilité : profil muet · monitoring : Sentry (profil)
- non couvert par les gates : la liste ouverte, la fiche et le panneau `unavailable` ne passent sous axe qu'avec des données ; ils ne sont vérifiés que sur une image de fixture non commitée. Le lecteur d'écran n'a pas été joué (tranche 9). L'ordre de merge suit la réponse 2 : PR 3 d'abord, puis PR 5 re-ciblée sur `master` avant son merge.

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

PR 3 (tranches 1 à 3), `git diff origin/master...HEAD` (`7ac26d2`, `42ee751`, `63898df`, `4ab7035`), revue du 2026-10-25.

**Verdict** : REJECTED
**Gates CI locaux** : cache invalidé (`ng cache clean`, `node_modules/.vite`) ; `pnpm install --frozen-lockfile` 0 / `pnpm run build --configuration production` 0 (« Prerendered 3 static routes ») / `pnpm test` 0 (240 fichiers, 4735 passed / 4735) / `pnpm lint` 0 / `pnpm run format:check` 0
**Checks mécaniques** : checker non vendoré (`.claude/checks/` absent) : auto-checks joués à la main. Archéologie (`ADR-`, `spec N`, `§`) 0 hit dans `src/`, `e2e/`, `.github/` ; `fakeAsync`/`.only`/`.skip`/`innerHTML`/`console.`/`export default` 0 ; noms d'employeur ou de client 0 dans le diff et dans tout le dépôt.
**Warnings de gate** : (b) pré-existant hors diff : `pnpm install`, « Ignored build scripts » (lockfile non touché). Build, test, lint, format : aucun. (c) pré-existant, à trancher par la session principale : `.github/workflows/ci.yml:75`, `:80`, `:190` et `:250`, `! grep …` isolés sous `set -e` et suivis d'autres commandes : bash n'arrête jamais le script sur une commande niée, ces quatre gardes (CSP `unsafe-inline` des pages prérendues, `ng-state` dans `index.csr.html`, `X-Cache-Status` de `/healthz`, version de nginx) ne peuvent pas échouer. Les gardes ajoutées par la PR (l. 72, 146-147) échouent bien.
**Rendu compilé** : N/A (aucun composant à sélecteur attribut ni `shared/ui` touché)
**Preuve de verify runtime** : ✅ (preuve tranches 1-2 complète ; rejouée sur le build de cette revue : `dist/…/browser` servi en statique, `/atelier/` hydraté (bascule de thème active), à 1 024 × 768 quatre liens sur une ligne (top 18 px, 352 à 718 px, `scrollWidth` 1 009), `aria-current="page"` sur « L'atelier » seul ; navigation client `/projects` → `/atelier` : titre, canonical et état actif suivent ; console : seules les erreurs réseau du serveur statique sans API, `/api/config` 404 et `/api/analytics/track` 501)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ✅
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ❌
**Alignement spec** : ❌

Contrôles demandés : (1) intro identique mot pour mot à la réponse de Julien (54 mots, comparés après normalisation des espaces ; seule l'espace avant le deux-points devient U+00A0) ; (3) `atelier/index.html` prérendu avec `h1`, deux paragraphes d'intro, titre, description, canonical, `BreadcrumbList`, meta CSP hachée, aucune page prérendue avec `unsafe-inline`, `Dockerfile` non modifié (`/atelier/` servi par `location /`) ; (4) gardes ajoutées correctes (`test -f` arrête le script ; `! grep … || { …; exit 1; }` échoue bien) ; (5) menu contrôlé, cf. ligne verify.

**Tests notables** :
- ✨ `src/app/workshop-confidentiality.spec.ts:38-127` : chaque champ gardé est doublé d'une fixture fictive qui prouve que la garde mord sur son chemin exact.
- ⚠️ `src/app/features/workshop/pages/workshop/workshop.spec.ts:42` : épingle la liste de classes de l'hôte, détail de style qui casse au moindre ajustement visuel ; prescrit par le plan de test, à garder en tête.

**Risque résiduel** :
- réversibilité : profil muet · monitoring : Sentry (profil)
- non couvert par les gates : la confidentialité de fond (un détail qui fait reconnaître un client) reste humaine ; ADR-0032 §4 exige la liste « confidentialité » cochée par Julien dans la description de la PR.

**Points à corriger** :
1. `src/app/features/workshop/domain/confidential-references.ts:7-8` : « plan n° » et « n° de plan » ne sont reconnus qu'en minuscules. « Plan n° 12 repris. » et « N° de plan à part. », soit les deux motifs en début de phrase, ne sont pas signalés (vérifié en exécutant l'expression), alors que `réf.` (l. 6) et `indice` (l. 10) acceptent la majuscule initiale. Accepter la majuscule initiale sur ces deux motifs, et ajouter les deux cas au `it.each` des textes signalés de `confidential-references.spec.ts:5-23` (RED d'abord).
2. `src/app/workshop-confidentiality.spec.ts:29-34` : ADR-0032 §3 applique la garde à tout le contenu publié de l'atelier, mais le titre, la description et le fil d'Ariane de la route `atelier` (`src/app/app.routes.ts:91-119`) ne sont pas lus. Ajouter `ROUTE_TEXTS['/atelier']` à la liste des données réelles gardées.
3. `DESIGN.md` § 5 : le plan technique prévoit une entrée « Accueil de l'atelier » dans la PR 3 (Fichiers à modifier) ; elle est absente, et le journal ne trace pas son report. L'ajouter, ou consigner le report dans `## Journal des tranches`.

**Suite (2026-10-25, session principale)** : point 1 corrigé (majuscule initiale acceptée sur « Plan n° » et « N° de plan », deux cas ajoutés en RED d'abord) ; point 2 corrigé (`ROUTE_TEXTS['/atelier']` gardé) ; point 3 corrigé (entrée « Accueil de l'atelier » dans `DESIGN.md` § 5). Les gardes `! grep` isolées de `ci.yml` sont corrigées sur `master` par la PR #267. Gates rejouées : `pnpm test` 4738/4738, `pnpm lint` et `pnpm run format:check` en code 0.
