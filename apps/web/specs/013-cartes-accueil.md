---
id: 013
title: Cartes projets de la home au style éditorial (rien de tronqué, repères, h3)
type: feat
status: draft
created: 2026-10-06
related: [specs/012-refonte-realisations.md, docs/adr/0010-champs-editoriaux-et-presentation-par-nature.md, DESIGN.md]
---

# 013 — Cartes projets de la home

## Description

### Contexte

La section « Des projets en production » de la home (`features/home/application/home-projects.ts`)
affiche `ProjectCard` (`features/projects/application/components/project-card.ts`), que seule la
home utilise depuis la spec 012. Une bonne partie du contenu y est tronquée :

- la description, coupée à 2 lignes (`line-clamp-2`) ;
- la justification de la « Décision clé », coupée à 3 lignes ;
- jusqu'à 8 étiquettes de tags ;
- trois liens (application, Frontend, Backend).

La carte porte en outre un `h2` sous le `h2` de la section : la hiérarchie des titres est cassée.

### Ce qui est attendu

Le style éditorial de la spec 012 (`ProjectCaseStudy`, `DESIGN.md`) appliqué à la carte de la home :

1. **Rien de tronqué.** Aucun `line-clamp` : le contenu est court par construction.
2. **Couverture** : `ProjectCover` (ratio 16/10, tampon de nature `pointer-events-none`), jamais
   prioritaire (le LCP de la home est le hero).
3. **Surtitre** : la catégorie en mono, puis le nom en **`h3`**.
4. **Accroche** : `projectPitch` (l'accroche, sinon la première phrase de la description), jamais la
   description entière.
5. **Repères** : un `dl` au format de l'étude de cas, dans l'ordre « Décision clé » (titre seul de
   `architectureDecisions[0].decision`, sans la justification), « Point fort », « Périmètre »,
   « Stack » (4 premiers tags joints par ` · `, `projectStack`). Une ligne absente si sa valeur l'est.
   `PROJECT_FACT_LABELS` et les fonctions de domaine existantes sont réutilisés, pas dupliqués.
6. **Liens** :
   - « Voir la fiche » : `routerLink` vers `/projects/:slug`, étiré sur toute la carte
     (`after:absolute after:inset-0`, `min-h-11`), ` : <nom>` en `sr-only` ;
   - « Ouvrir l'application », si `liveUrl` : lien externe au-dessus de l'étirement
     (`relative z-10`), libellé `liveLinkLabel`, nom du projet et « nouvel onglet » en `sr-only`,
     clic suivi par `trackProjectClick` ;
   - les liens dépôt (Code, Frontend, Backend) quittent la carte : ils restent sur la fiche ;
   - plus aucune puce de tag.
7. **Mise en page** : grille `md:grid-cols-2` inchangée, cartes de hauteur égale, liens alignés en bas.

### Hors périmètre

- La fiche détail et la page `/projects` (spec 012).
- Le choix des projets mis en avant (`featuredProjects` du bundle de la home).

## Plan technique

### Décision : une vue pure et un composant dumb, `ProjectCard` supprimé

`ProjectCard` ne garde rien de son contrat : son input `project: Project` devient une vue, ses
inputs `showKeyDecision` (toujours `true` à son unique site d'appel) et `priority` (jamais posé par
la home) perdent leur sens, et il injecte `AnalyticsGateway` alors que les composants de la spec 012
sont dumb. Le faire évoluer reviendrait à le réécrire sous un nom qui ne dit plus ce qu'il montre.
On suit donc le motif de la spec 012 (`projects-view.ts` + composants dumb) :

| Fichier | Rôle |
|---|---|
| `features/projects/application/featured-project-view.ts` | **Créer** : type `FeaturedProjectView` et fonction pure `toFeaturedProjectView(project: Project): FeaturedProjectView` |
| `features/projects/application/components/featured-project-card.ts` | **Créer** : `FeaturedProjectCard` (`app-featured-project-card`), dumb |
| `features/home/application/home-projects.ts` | `featuredProjects = computed(() => projects().map(toFeaturedProjectView))`, rend `app-featured-project-card`, et sur `(liveLinkClicked)` appelle `AnalyticsGateway.trackProjectClick(id, title)` |
| `features/projects/application/components/project-card.ts` | **Supprimer** (plus aucun consommateur) |
| `features/projects/application/project-kind-copy.ts` | Le libellé « Décision clé » rejoint `PROJECT_FACT_LABELS` (au choix du GREEN, la valeur testée est le texte) |

Nom : `FeaturedProject*` car la home montre `featuredProjects` ; `ProjectCardView` est déjà pris par
la carte de grille (spec 012). Le suivi analytics remonte au parent par un `output()`, comme
`ProjectCaseStudy` → `Projects`.

### Contrats

```ts
type FeaturedProjectView = {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly category: string;
  readonly kind: ProjectKind | null;
  readonly image: string;
  readonly pitch: string;                                       // projectPitch(project)
  readonly facts: readonly { readonly label: string; readonly value: string }[];
  readonly liveLink: { readonly url: string; readonly label: string } | null; // liveLinkLabel(kind)
};
```

- `facts`, dans l'ordre : `Décision clé` (`architectureDecisions?.[0]?.decision`), `Point fort`
  (`highlight`), `Périmètre` (`scope`), `Stack` (`projectStack(tags, 4).join(' · ')`, absent si vide).
- `liveLink` : `null` si `liveUrl` est `null`, absent ou `''`.
- `FeaturedProjectCard` : `card = input.required<FeaturedProjectView>()`,
  `liveLinkClicked = output<void>()`, hôte `h-full`.
- Testids : `featured-project-card` (`article`, `relative flex flex-col h-full`),
  `featured-project-card-cover` (hôte `app-project-cover`, premier), `featured-project-card-category`,
  `featured-project-card-title` (`h3`), `featured-project-card-pitch`, `featured-project-card-facts`
  (`dl`, absent sans repère), `featured-project-card-fact-label` (`dt`),
  `featured-project-card-fact-value` (`dd`), `featured-project-card-actions` (`mt-auto`, contient les
  deux liens), `featured-project-card-link`, `featured-project-card-link-context` (texte exact
  `'\u00a0: <nom>'`), `featured-project-card-live-link`.

### Tranches

1. **H1 — la carte de la home montre l'essentiel sans rien tronquer** : vue pure, carte, section de
   la home, suppression de `ProjectCard`.

## Plan de test

### Tranche H1 — la carte de la home montre l'essentiel sans rien tronquer

**`features/projects/application/featured-project-view.spec.ts`** (TS pur, `makeProject`, 23 tests, nouveau)

| Test | Scénario | Assertions clés |
|---|---|---|
| golden | projet complet (6 tags, 2 décisions, 3 liens dépôt, `liveUrl`) | `toEqual` de la vue : 4 repères dans l'ordre, titre de décision seul, stack à 4, lien « Ouvrir l'application », aucun lien dépôt |
| accroche (`it.each` × 3) | accroche ; sans accroche, plusieurs phrases ; une phrase | accroche ; première phrase seule ; phrase entière |
| décision clé | deux décisions | `[{ Décision clé, titre }]` seul, sans justification |
| sans décision (`it.each` × 2) | `[]`, `undefined` | aucun repère |
| repères omis (`it.each` × 5) | point fort seul, périmètre seul, décision + tags, périmètre + tags, rien | libellés exacts et ordonnés |
| stack (`it.each` × 4) | 1, 3, 4, 8 tags | `Bash`, 3 joints, 4 joints, 4 premiers |
| sans lien (`it.each` × 3) | `null`, absent, `''` | `liveLink` `null` |
| libellé (`it.each` × 4) | production, démo, script, `null` | `Ouvrir l'application`, `Voir la démo`, `Voir le site` × 2 |

**`features/projects/application/components/featured-project-card.spec.ts`** (TestBed, `setInput('card')`, 15 tests, nouveau)

| Test | Scénario | Assertions clés |
|---|---|---|
| contenu | carte complète | `ARTICLE` ; catégorie, `H3` nom, accroche, dans cet ordre |
| repères | 4 repères | `DT`/`DD` exacts dans l'ordre |
| sans repère | `facts: []` | pas de `dl` |
| seule liste | carte complète | listes de la carte = `['DL']` (plus de puces de tag) |
| rien de tronqué | accroche longue | aucun `[class*="line-clamp"]` |
| couverture | carte complète | `APP-PROJECT-COVER` avant la catégorie, tampon « En production », `alt` « Aperçu du projet DashFlow » |
| sans nature | `kind: null` | couverture sans tampon |
| jamais prioritaire | image | `src`, `auto`, `lazy` |
| fiche | carte complète | `href` `/projects/dashflow`, nom « Voir la fiche : DashFlow », contexte `sr-only` exact |
| lien étiré | carte complète | `relative` sur l'`article` ; `after:absolute after:inset-0 min-h-11` sur le lien |
| lien externe | `liveLink` | `A`, `href`, `_blank`, `noopener noreferrer`, nom « Ouvrir l'application : DashFlow, nouvel onglet », `relative z-10` |
| liens (avec) | `liveLink` | `a, button` = [fiche, application] (aucun lien dépôt) |
| liens (sans) | `liveLink: null` | `a, button` = [fiche] |
| clic suivi | clic sur l'application | `liveLinkClicked` émis une fois |
| hauteur égale | carte complète | hôte `h-full` ; `article` `flex flex-col h-full` ; actions `mt-auto` contenant les deux liens |

**`features/home/application/home-projects.spec.ts`** (TestBed, `setInput('projects')`, vrai `Router`, 7 tests, nouveau)

| Test | Scénario | Assertions clés |
|---|---|---|
| grille | DashFlow, CandiDash | `ul role=list` `md:grid-cols-2`, une carte par `li`, dans l'ordre |
| titres | idem | `H2` de la section, puis `H3` DashFlow, `H3` CandiDash |
| priorité | deux couvertures | toutes les `img` en `auto`/`lazy` |
| rien de tronqué | description longue, justification longue | aucun `[class*="line-clamp"]` |
| câblage de la vue | sans accroche, décision + 6 tags | première phrase ; repères `Chiffrement côté client`, 4 tags |
| fiche | clic « Voir la fiche » de la 2ᵉ carte | `router.url` = `/projects/candidash` |
| suivi | clic « Ouvrir l'application » | `trackProjectClick` appelé une fois avec `('dashflow-id', 'DashFlow')` |

**Tests existants adaptés ou retirés**

- `features/home/application/home.spec.ts`, « une carte par projet est projetée » : sélecteur
  `project-card-link` → `featured-project-card-link` (le composant change de nom) ; valeur attendue
  (2) inchangée.
- `features/projects/application/components/project-card.spec.ts` **supprimé** (19 tests), le
  composant disparaissant au GREEN. Sort de chaque test :
  - lien vers `/projects/:slug` → repris par « fiche » de la carte et « fiche » de la section
    (qui va jusqu'à la navigation) ;
  - priorité de chargement (2) et animation selon `priority` (`it.each` × 2) → retirés : plus d'input
    `priority`, la carte n'est jamais prioritaire (« jamais prioritaire », « priorité » de la section) ;
  - `nav` nommée « Liens du projet <nom> » → retiré : plus de `nav`, la carte n'a que deux liens ;
  - décision clé affichée avec sa justification → remplacé par « décision clé » de la vue (titre
    seul) ; `showKeyDecision` à `false` → retiré avec l'input ; aucune décision (`[]`, absent) →
    repris par la vue ;
  - tampon par nature (`it.each` × 3), sans nature, tampon hors du titre → repris par « couverture »
    et « sans nature » (le tampon vit dans `ProjectCover`, couvert par `project-cover.spec.ts`) ;
  - libellé du lien externe par nature (`it.each` × 4) → repris par « libellé » de la vue (texte) et
    « lien externe » de la carte (nom accessible).
- Sweep : `grep` de `project-card`, `ProjectCard`, `showKeyDecision`, `line-clamp` sur `src` (hors
  `project-grid-card`) : seuls `home-projects.ts`, `project-card.ts`, `project-card.spec.ts` et
  `home.spec.ts` sont concernés. Aucun dossier `e2e`.

**Preuve RED**

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil le
2026-10-06 23:20, 44 failed / 1495 total). Sur l'arbre réel, `pnpm test` (après `ng cache clean` et
purge de `node_modules/.vite`) s'arrête à la compilation, uniquement sur des symboles applicatifs dus
au GREEN : `TS2307` `./featured-project-view`, `../featured-project-view`, `./featured-project-card`,
et `TS7006` (`fact` implicite) qui en découle. Aucune faute de type propre aux specs ; prettier et
eslint verts sur les 4 fichiers ; le motif d'archéologie ne trouve rien.

Mesure du rouge comportemental : squelette jetable (`FeaturedProjectView` et une
`toFeaturedProjectView` qui renvoie des valeurs vides, `FeaturedProjectCard` sans gabarit,
`home-projects.ts` inchangé), puis retiré. Résultat : 125 fichiers, 44 failed / 1495 total, tous en
`AssertionError` : 23 vue, 14 carte, 6 section, 1 home (adapté). Verts par nature sous le squelette
(2) : « rien de tronqué » de la carte (gabarit vide) et « priorité » de la section (la home n'a
jamais posé `priority`). Harnais vérifié : une implémentation jetable (vue, carte, section) donne
1495 passed / 1495, puis a été retirée (empreinte SHA-1 de `home-projects.ts` identique à l'état
d'avant). Non-régression : base 1469 ; 1495 = 1469 − 19 (`project-card.spec.ts`) + 45 ajoutés ; les
1449 autres tests existants restent verts.

Dû au GREEN : `featured-project-view.ts`, `components/featured-project-card.ts`, `home-projects.ts`
(nouvelle carte, `computed` de la vue, suivi analytics), suppression de `components/project-card.ts`.

## Journal des tranches

- **Tranche H1 — la carte de la home montre l'essentiel sans rien tronquer** : GREEN 1495 passed / 1495 total · refactor : construction des repères sortie de `projects-view.ts` dans `project-facts.ts` (`projectFacts(project, keys)`, 2 consommateurs : `toCaseStudyView` en Stack, Point fort, Périmètre et `toFeaturedProjectView` en Décision clé, Point fort, Périmètre, Stack) ; libellé `keyDecision` ajouté à `PROJECT_FACT_LABELS`
- **Correctifs de la revue** : GREEN 1503 passed / 1503 total · refactor : repères extraits dans le composant dumb `ProjectFactList` (`components/project-fact-list.ts`, `facts = input.required<readonly ProjectFact[]>()`, une seule colonne de `6.5rem`), consommé par `FeaturedProjectCard` et `ProjectCaseStudy` (marge extérieure `mt-5`/`mt-6` posée par le parent sur l'hôte) ; `sheetLinkContext` et `projectCoverAlt` ajoutés à `project-kind-copy.ts` (sur `NBSP`), consommés par `FeaturedProjectCard`, `ProjectGridCard` et `ProjectCaseStudy` ; testids des repères devenus ceux du composant (`project-fact-list`, `project-fact-label`, `project-fact-value`), sélecteurs seuls adaptés dans 4 specs, valeurs attendues inchangées ; lien étiré « Voir la fiche » laissé en place (point 3)

## Verify

Build de production (`pnpm run build --configuration production`, 20 routes prérendues) servi en statique
depuis `dist/angular-portfolio-app/browser` sur `http://localhost:4013/`, piloté par Chromium (playwright-core).

**Steps reproductibles**

1. HTML prérendu de `/` : `grep` de `data-testid="featured-project-card"` → 2 ; `line-clamp` → 0 ; repères
   rendus `Décision clé` + `Stack` pour DashFlow et CandiDash (les données de prod n'ont ni `highlight` ni
   `scope` sur ces deux projets).
2. `/`, défilement jusqu'à `#projects`, en 1280 et 390 px, thème sombre (`app-dark`) puis clair :
   - 2 cartes, hauteurs égales en 1280 (687 / 687 px), actions alignées en bas de cellule (687 / 687) ;
   - aucun débordement horizontal (`scrollWidth <= innerWidth`) ;
   - aucun élément de la section tronqué (aucun texte visible en `overflow` caché ou `ellipsis` qui déborde),
     aucun `line-clamp` ;
   - axe-core 4.13 sur `#projects` : 0 violation, dans les 4 configurations.
3. 1280 sombre : clic « Ouvrir l'application » → nouvel onglet `https://dashflow.nedellec-julien.fr/` ;
   clic « Voir la fiche » de la 2ᵉ carte → `/projects/candidash`, `h1` CandiDash. 390 : clic sur le corps
   de la carte (accroche) → `/projects/dashflow` (lien étiré).

**Verdict : PASS**

**Captures** (scratchpad de session) : `home-cards-1280-dark.jpg`, `home-cards-1280-light.jpg`,
`home-cards-390-dark.jpg`, `home-cards-390-light.jpg`.

**Console** : aucune erreur liée au changement. Seules erreurs, propres à l'environnement local et
antérieures à la tranche : `404 /api/config` (servi par nginx en prod, absent du serveur statique) et
CORS refusé sur `api.nedellec-julien.fr/api/analytics/track` depuis l'origine `localhost:4013`.

### Verify — correctifs de la revue

Build de production (`pnpm run build --configuration production`, 20 routes prérendues) servi en statique
depuis `dist/angular-portfolio-app/browser` sur `http://localhost:4013/`, piloté par Chromium (playwright-core),
axe-core injecté.

**Steps reproductibles**

1. `/`, défilement jusqu'à `#projects`, en 1280 et 390 px : 2 cartes ; chaque bloc de repères est un
   `app-project-fact-list` qui contient le `dl` ; écart accroche → `dl` = 20 px (`mt-5` sur l'hôte, comme
   avant) ; colonne des libellés à `104px` (6,5 rem) ; « Décision clé » et « Stack » sur une ligne ; cartes
   de 687 / 687 px en 1280, identiques à la mesure de la tranche H1 ; aucun débordement horizontal.
2. `/projects`, études de cas, en 1280 et 390 px : écart accroche → `dl` = 24 px (`mt-6`, inchangé) ; colonne
   des libellés passée de `96px` (6 rem) à `104px` (6,5 rem), seul changement visuel voulu ; libellés sur
   une ligne ; aucun débordement.
3. Sur les deux pages : `alt` des couvertures « Aperçu du projet <titre> » et contexte `sr-only` de « Voir la
   fiche » « ` : <titre>` » (espace insécable), inchangés.
4. axe-core 4.14 sur `#projects` (`/`) et sur `main` (`/projects`) : 0 violation dans les 4 configurations.

**Verdict : PASS**

**Captures** (scratchpad de session) : `fix013-home-1280.jpg`, `fix013-home-390.jpg`,
`fix013-projects-1280.jpg`, `fix013-projects-390.jpg`.

**Console** : aucune erreur liée au changement. Seules erreurs, propres à l'environnement local et déjà
relevées : `404 /api/config` et CORS refusé sur `api.nedellec-julien.fr/api/analytics/track` depuis
`localhost:4013`.

## Review code

**Verdict** : REJECTED
**Gates CI locaux** : `pnpm install --frozen-lockfile` exit 0 · `pnpm test` exit 0 (125 fichiers, 1495 passed / 1495, après `ng cache clean` + purge `node_modules/.vite`) · `pnpm lint` exit 0 (« All files pass linting ») · `pnpm run build --configuration production` exit 0 (20 routes prérendues, CSP 21 pages) ; `public/rss.xml` et `public/sitemap.xml` restaurés
**Checks mécaniques** : checker non vendoré (`.claude/checks/` absent) : auto-checks joués à la main (archéologie, sweep `ProjectCard`/`showKeyDecision`/`line-clamp`, export sans consommateur, duplication)
**Warnings de gate** : aucun (output complet des quatre gates relu)
**Rendu compilé** : N/A (aucun composant à sélecteur attribut ni `shared/ui/**` touché)
**Preuve de verify runtime** : ✅ (section `## Verify` complète, rejouée par la revue sur le build servi en statique : 1280/390 × clair/sombre, 2 cartes, 0 `line-clamp`, aucun débordement, axe 0 violation sur `#projects`, lien externe au-dessus de l'étirement, popup vers l'application, `project_click` émis avec `entityTitle` DashFlow, clic sur l'accroche → `/projects/dashflow` ; console de `/` vide ; seule erreur ailleurs : CORS de l'analytics depuis localhost, propre à l'environnement)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ❌
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ✅

**Tests notables** :
- ✨ `home-projects.spec.ts:139` — navigation réelle par le `Router` jusqu'à `/projects/candidash`, pas un simple `href`.
- ✨ `home-projects.spec.ts:151` — le suivi analytics est épinglé au niveau de la section, là où vit le câblage.

**Duplication / dérivation** (§ 2quater, bloquant : même fragment à 3 sites) :
- ⚠️ `components/featured-project-card.ts:88`, `project-grid-card.ts:57`, `project-case-study.ts:93` — `` `\u00a0: ${title}` `` à 3 sites.
- ⚠️ `components/featured-project-card.ts:87`, `project-grid-card.ts:56`, `project-case-study.ts:92` — `` `Aperçu du projet ${title}` `` à 3 sites.

**Points à corriger** :
1. `components/featured-project-card.ts:36-53` — bloquant. Le bloc `dl` des repères recopie celui de `project-case-study.ts:40-57` (même structure `dl > div.grid-cols-subgrid > dt + dd`, mêmes classes à `6.5rem`/`mt-5` près). CLAUDE.md : « Structure réutilisée de plus d'un élément = composant Angular ». Extraire un composant dumb `ProjectFactList` (`facts = input.required<readonly ProjectFact[]>()`, à côté de `ProjectCover`) consommé par les deux cartes, avec une seule largeur de colonne (celle qui loge « Décision clé »). Adapter les sélecteurs de test des deux specs sans changer les valeurs attendues.
2. `components/featured-project-card.ts:87-88` — bloquant (§ 2quater). Le contexte `sr-only` « Voir la fiche » et l'`alt` de couverture sont recalculés en littéral dans trois composants. Les sortir dans `project-kind-copy.ts` à côté de `liveLinkContext` (réutiliser la constante `NBSP` du fichier) et les consommer dans `FeaturedProjectCard`, `ProjectGridCard` et `ProjectCaseStudy`.
3. `components/featured-project-card.ts:58-66` — mineur. Le lien étiré « Voir la fiche » est la copie, classe pour classe, de `project-grid-card.ts:41-49`. Deux sites seulement, donc à traiter dans le même passage que le point 2 si un composant `ProjectSheetLink` s'avère simple ; sinon, le laisser tel quel.
4. `components/featured-project-card.spec.ts:46`, `home-projects.spec.ts:53` — mineur. `configureTestingModule` là où CLAUDE.md préfère `TestBed.overrideComponent` ; cohérent avec les specs voisines de la spec 012, à ne pas reprendre seul.
