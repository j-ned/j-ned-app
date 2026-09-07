---
id: 003
title: Rendre la section projets et le formulaire de contact visibles en SSR sur la home, et sortir la première carte projet du hors-champ
type: fix
status: draft
created: 2026-09-07
related: [tasks/todo.md]
---

# 003 — Home : visibilité SSR & hiérarchie de la landing

## Description

Constat analytics à l'origine du chantier : **les visiteurs ne dépassent pas la
home**. La lecture du code a écarté trois des quatre pistes initiales (déjà en
place ou redondantes) et a exposé une **cause racine qui n'y figurait pas**.

### 1. Bug SSR (bloquant)

`src/app/features/home/application/home.ts` porte deux blocs `@defer` :

- ligne 69 — la **section projets** (`app-home-projects`)
- ligne 88 — le **formulaire de contact** (`app-contact-form`)

Tous deux sont écrits `@defer (on viewport; prefetch on idle; when eagerSections())`,
**sans trigger `hydrate`**, alors que `app.config.ts` active
`provideClientHydration(withIncrementalHydration(), withEventReplay())` et que
`src/app/features/about/application/about.ts` utilise correctement
`@defer (hydrate on viewport)`.

Conséquence : sous hydratation incrémentale, un bloc `@defer` sans trigger
`hydrate` **rend son `@placeholder` côté serveur**. Le HTML SSR de la route
par défaut (`path: ''`) ne contient donc ni la section projets ni le formulaire
de contact — deux `<div>` vides (`h-64`, `h-96`) à la place. Crawler, aperçu de
partage social et navigation sans JS ne voient rien du contenu principal de la
page qui encaisse tout le trafic.

Doctrine violée — `CLAUDE.md` § `@defer` : *« Jamais pour : above-the-fold,
contenu principal d'une route, SEO critique sans hydrate »*. La section projets
est le contenu principal de la route par défaut : deux critères sur trois.

### 2. Layout : les projets sont hors champ par construction

`home.ts:20` — `min-h-[calc(100svh-5rem)] mt-20` verrouille le hero **et** les
trois cartes d'expertise sur 100 % du premier écran. Aucune réécriture de
contenu ne corrige ça : la première carte projet est structurellement invisible
au chargement.

**Les deux points sont couplés.** Si la première carte projet remonte
above-the-fold, `on viewport` se déclenche au chargement : le `@defer` ne diffère
plus rien et ajoute un aller-retour de chunk sur le chemin critique de la route
eager. Le trigger et le layout se tranchent dans le même mouvement.

### 3. Trou de test

`home.spec.ts` ne rend **aucun** des deux blocs `@defer` : il ne teste que
l'API de classe (`bundle`, `expertises`, `eagerSections`). Rien ne prouve
aujourd'hui que la section projets s'affiche, ni en client ni en SSR.

### Objectif

1. Les deux blocs `@defer` de la home sont **rendus dans le HTML SSR** et
   hydratés à la demande (hydratation incrémentale).
2. L'**affordance de scroll est établie** : la section projets est entamée sous
   le premier écran en 1440×900 comme en 390×844 (cf. Critères d'acceptation
   pour la formulation exacte, révisée après revue).
3. Le rendu des deux blocs est **couvert par des tests** pilotés en mode
   `Manual` (`fixture.getDeferBlocks()` + `DeferBlockState.Complete`).

### Périmètre

- **Dans le périmètre** :
  - `src/app/features/home/application/home.ts` (triggers `@defer` + suppression
    du lock de hauteur du premier fold)
  - `src/app/features/home/application/home.spec.ts` (tests de rendu des blocs)
- **Hors périmètre** (lots ultérieurs de `tasks/todo.md`, ne pas élargir) :
  - Lot 2 — hiérarchie des CTA du hero (P3), événement `cta_click` (P4)
  - Lot 3 — réécriture éditoriale du hero (P2), SEO de la route (P2bis)
  - Le hack `when eagerSections()` du `SectionScroller` : candidat au nettoyage
    **après mesure de P0**, pas dans ce lot
  - Toute refonte graphique, animation, ou refactor de `AnalyticsGateway`

### Contraintes

- **Ne pas supprimer les `@defer`.** `HomeProjects` et `ContactForm` ne sont
  référencés que dans des blocs `@defer` : le compilateur les sort ainsi du
  bundle initial. Les retirer ferait entrer `ProjectCard` + `NgOptimizedImage`
  + le formulaire réactif dans le chunk eager de `path: ''`.
- **`ContactForm` va désormais être rendu côté serveur.** Vérification déjà
  faite en amont : ni `ContactForm`, ni `ContactInfoPanel`, ni `ProjectCard`,
  ni `ToastStore` ne touchent `window` / `document` / `localStorage` au montage
  (l'unique `setTimeout` de `ToastStore` est armé dans `show()`). À reconfirmer
  au moment du GREEN.
- **Tests `@defer` en mode `Manual` obligatoire.** Sous jsdom, `on viewport`
  échoue silencieusement en l'absence d'`IntersectionObserver` : le placeholder
  reste sans qu'aucune assertion ne le détecte. Les transitions d'état ne
  rembobinent pas → **une fixture par scénario**.

### Critères d'acceptation

- Les deux blocs `@defer` de `home.ts` portent un trigger `hydrate`, et
  conservent leur `@placeholder` ainsi que leur bloc `@error`.
- Le lock `min-h-[calc(100svh-5rem)]` du premier fold est levé, et l'affordance
  de scroll est établie sur les deux viewports de référence :
  - **1440×900** — le **header de la section projets** dépasse le fold (badge
    « Portfolio » + `h2` visibles). *Corrigé le 2026-09-07 après revue* : le
    critère disait initialement « le haut de la première carte projet dépasse »,
    ce que le § 5 du plan déclare vingt lignes plus bas **non tenu** (≈ 112 px
    dégagés sur ≈ 220 px requis). Un critère ne peut pas affirmer tenu ce que le
    plan chiffre comme dette. La cible « première carte visible » reste
    l'objectif, atteignable **après Lot 2** (−2 CTA, ≈ 84 px) **et Lot 3** (hero
    réécrit) ; si la mesure visuelle montre qu'elle est déjà atteinte dès ce lot,
    tant mieux, mais le lot ne s'y engage pas.
  - **390×844** — le **header de la section projets** dépasse le fold (badge
    « Portfolio » + `h2` visibles). *Arbitré le 2026-09-07* : le calcul donne
    ≈ 1 078 px de contenu avant la section projets pour un fold de 844 px ;
    aucun réglage de padding ne comble les ~400 px manquants. La cible « première
    carte visible » sur mobile est reprise **après Lot 2** (−2 CTA) **et Lot 3**
    (hero réécrit), qui attaquent le vrai poste.
- **Aucune troncature de contenu.** *Arbitré le 2026-09-07* : les descriptions des
  cartes d'expertise (`line-clamp-5`, `min-h-55.5`) ne sont **pas** réduites pour
  gagner des pixels — leur prose est parquée en P2ter, hors périmètre. Un lot
  « SSR + layout » ne fait pas de dégât éditorial au passage.
- `home.spec.ts` prouve, en pilotage `Manual`, que le bloc projets rend
  `app-home-projects` et que le bloc contact rend `app-contact-form` à l'état
  `Complete`.
- **Preuve SSR exigée** (non prouvable en Vitest/jsdom). La home est **prérendue**
  (`Prerendered 5 static routes`) : inutile de booter le serveur, le grep porte
  directement sur le fichier prérendu.
  ```bash
  pnpm build
  grep -c 'data-testid="project-card-link"' dist/angular-portfolio-app/browser/index.html   # 0 avant, N après
  grep -c '<app-contact-form'               dist/angular-portfolio-app/browser/index.html   # 0 avant, 1 après
  ```
  Baseline mesurée le 2026-09-07 sur `dist/angular-portfolio-app/browser/index.html` :
  `project-card-link` → 0, `<app-home-projects` → 0, `<app-contact-form` → 0, et les
  deux placeholders vides présents (`h-64`, `h-96`).
- `pnpm test`, `pnpm lint`, `pnpm build` au vert.

## Plan technique

> Décision structurante actée dans **ADR-0001** —
> `docs/adr/0001-hydratation-incrementale-des-defer-de-route-publique.md`.
> Toutes les affirmations sur le runtime ci-dessous sont vérifiées sur
> `node_modules/@angular/core@22.0.3` (source citée) et par A/B sur le build du 2026-09-07.

### 1. Architecture

Aucune couche n'est ajoutée ni déplacée. Le lot est **entièrement contenu dans le template
de `Home`** (`features/home/application/home.ts`) plus son spec. Pas de nouveau service, pas
de nouveau modèle, pas de nouvelle dépendance : la cause racine est un trigger manquant, pas
un défaut de structure.

Chaîne de rendu de la route `path: ''` (prérendue) :

```
build (prérendu)                        │ navigateur (initial)              │ navigateur (nav SPA)
─────────────────────────────────────── │ ───────────────────────────────── │ ────────────────────
Home rendu par le serveur               │ document = HTML complet           │ Home créé par le Router
  ├─ hero + expertises (eager)          │   ├─ hero/expertises hydratés     │   ├─ hero/expertises
  ├─ @defer projets  → hydrate ⇒ REND   │   ├─ bloc projets  déshydraté     │   ├─ @defer projets  : triggers
  └─ @defer contact  → hydrate ⇒ REND   │   └─ bloc contact  déshydraté     │   │   RÉGULIERS actifs
                                        │  hydratation à la demande via     │   └─ @defer contact  : idem
                                        │  les triggers `hydrate` seuls     │
```

Le pivot est une seule fonction du runtime, `shouldAttachRegularTrigger()` :

```js
// serveur
if (ngServerMode) return !incrementalHydrationEnabled || !hasHydrateTriggers;
// client
const wasServerSideRendered = lDetails[SSR_UNIQUE_ID] !== null;
if (_hasHydrateTriggers && wasServerSideRendered && incrementalHydrationEnabled) return false;
return true;
```

et son miroir `shouldAttachTrigger(2 /* hydrate */) === !shouldAttachRegularTrigger(...)`.
Trois conséquences, toutes exploitées ci-dessous :

- **Serveur** : dès qu'un trigger `hydrate` est présent, les triggers réguliers ne sont pas
  attachés et chaque instruction `ɵɵdeferHydrateOn*` appelle `triggerDeferBlock(2, …)` →
  le contenu réel est rendu et sérialisé (jamais le `@placeholder`).
- **Client, entrée par le document** : le bloc a un `SSR_UNIQUE_ID`, les triggers réguliers ne
  sont **pas attachés du tout** — `ɵɵdeferWhen` / `ɵɵdeferOnViewport` sortent avant même de
  consommer leur binding.
- **Client, navigation SPA** : pas de `SSR_UNIQUE_ID`, les triggers **réguliers** sont attachés
  et les triggers `hydrate` ne le sont pas.

**Invariant a11y inchangé.** Le lot ne touche à aucun landmark : `<main>` reste porté par `Home`,
le shell porte `banner`/`contentinfo`. Les blocs `@defer` deviennent visibles côté serveur, ce qui
fait entrer dans le HTML servi le `<section id="projects">` de `HomeProjects` et le `<section>` de
`ContactForm` — aucun d'eux n'est un landmark implicite (pas d'`aria-label` / `aria-labelledby`),
donc aucun doublon de `region`.

### 2. Fichiers à créer / modifier

| Fichier | Nature | Rôle |
|---|---|---|
| `src/app/features/home/application/home.ts` | **modifié** | Triggers `hydrate` sur les 2 blocs `@defer` ; `data-testid` sur les deux contenus différés ; levée du verrou de hauteur du premier fold (§5) |
| `src/app/features/home/application/home.spec.ts` | **modifié** | Ajout du pilotage `Manual` des 2 blocs (§7) ; les 3 `describe` existants restent intacts |
| `docs/adr/0001-hydratation-incrementale-des-defer-de-route-publique.md` | **créé** | Décision transverse (cf. ADR-0001) |

Aucun autre fichier. En particulier `contact-form.ts`, `home-projects.ts`, `project-card.ts` et
`section-scroller.ts` ne sont **pas** touchés.

### 3. Forme exacte des triggers — décision

**Bloc projets (`home.ts:69`)** — retenu :

```
@defer (hydrate on viewport; on viewport; prefetch on idle; when eagerSections())
```

**Bloc contact (`home.ts:88`)** — retenu, forme **identique** :

```
@defer (hydrate on viewport; on viewport; prefetch on idle; when eagerSections())
```

La forme envisagée dans `tasks/todo.md` est donc **validée telle quelle**, avec quatre
précisions qui en changent la lecture :

1. **`hydrate on viewport` est le seul terme qui règle P0.** Il est suffisant à lui seul pour
   le rendu serveur : `ɵɵdeferHydrateOnViewport()` appelle `triggerDeferBlock(2, …)` sous
   `ngServerMode`. Preuve A/B sur le build du 2026-09-07 : les 6 blocs `hydrate on viewport`
   d'`about.ts` sont tous présents dans `dist/angular-portfolio-app/browser/about/index.html`,
   les 2 blocs sans `hydrate` de la home sont absents de `…/browser/index.html`.
   Réf. : [angular.dev — Incremental hydration](https://angular.dev/guide/incremental-hydration)
   (« Hydrate triggers are additional triggers that are used alongside regular triggers on a
   defer block. Hydration is an initial load optimization, and that means hydrate triggers only
   apply to that initial load. »).
2. **`when eagerSections()` n'est pas mort — il change de domaine.** Sur le chemin d'entrée SSR
   il devient inopérant (`ɵɵdeferWhen` sort sur `shouldAttachTrigger(0,…) === false`, sans même
   évaluer l'expression). Sur le chemin **navigation SPA** il reste **load-bearing** : c'est lui
   qui permet à `SectionScroller.scrollTo('contact')` de matérialiser le bloc avant de défiler
   quand on arrive d'une autre route (`navigateByUrl('/')` puis scroll) — `on viewport` seul ne
   suffirait pas, le bloc n'étant pas dans le viewport à ce moment.
   ⇒ **On conserve `on viewport` et `when eagerSections()`.** Cela **requalifie** la note de
   `tasks/todo.md` (« candidat au nettoyage après mesure de P0 ») : ce n'est pas une suppression
   mécanique, c'est un arbitrage sur le chemin SPA, à traiter hors de ce lot.
3. **`prefetch on idle` reste actif et devient un accélérateur d'hydratation.**
   `shouldAttachTrigger(1 /* prefetch */)` ne teste que `!ngServerMode` : le trigger est attaché
   côté client **même sur un bloc déshydraté**. Le chunk est donc chargé à l'idle, hors chemin
   critique, et `triggerResourceLoadingForHydration()` le trouve déjà en état `COMPLETE` quand le
   trigger `hydrate` se déclenche. C'est ce qui réduit à ~0 la fenêtre de désynchronisation du
   formulaire décrite ci-dessous.
4. **`hydrate on interaction` sur le bloc contact est REJETÉ.** Motif mécanique, pas préférentiel :
   `setUpControlValueAccessor()` (`@angular/forms`) exécute `dir.valueAccessor.writeValue(control.value)`
   au branchement des `formControlName`. Le formulaire est désormais rendu côté serveur ; ses inputs
   sont réels et saisissables **avant** hydratation. Avec `hydrate on interaction`, l'hydratation
   démarre au premier `click`/`keydown` (`interactionEventNames = ['click','keydown']`) et se termine
   de façon asynchrone : à sa complétion, `writeValue('')` écrase dans le DOM tout ce qui a été tapé
   entre-temps. `withEventReplay()` rejoue l'**événement** déclencheur, pas l'**état de valeur** du
   DOM — il ne couvre pas ce cas. `hydrate on viewport` réduit la fenêtre au délai entre l'entrée du
   formulaire dans le viewport et la fin du chargement du chunk (déjà préchargé, cf. point 3), soit
   avant que l'utilisateur ait pu voir puis saisir le champ.
   Bénéfice induit : forme identique sur les deux blocs, et alignement sur le précédent établi du
   repo (`about.ts`, 6 occurrences de `hydrate on viewport`) — pas de réinvention.

`@placeholder` et `@error` sont **conservés à l'identique** sur les deux blocs (ils servent
toujours le chemin SPA), conformément aux critères d'acceptation.

### 4. Effet sur le chunking — confirmé, et contrôle de non-régression

**Confirmé : `hydrate` ne change rien au découpage.** Le trigger n'intervient que sur le *moment*
du rendu ; la résolution des dépendances passe par le même `dependencyResolverFn` et le même
`import()` dynamique généré par le compilateur. `HomeProjects` et `ContactForm` restent hors du
bundle initial du navigateur.

Baseline mesurée le 2026-09-07 (`dist/angular-portfolio-app/browser/`), à rejouer après le GREEN :

```bash
grep -l 'Voir tous les projets' *.js   # chunk-SGAEWAJD.js  (HomeProjects)   — jamais main-*.js
grep -l 'Envoyer un message'   *.js    # chunk-JVUSWAGP.js  (ContactForm)    — jamais main-*.js
grep -c 'Voir tous les projets\|Envoyer un message' main-*.js   # doit rester 0
```

(Les hashs de chunk changeront ; ce qui est contrôlé, c'est **`0` dans `main-*.js`** et la présence
des deux marqueurs dans un `chunk-*.js`. Le chunk `contact-form` de 13.10 kB doit toujours figurer
dans le tableau de stats de `pnpm build`.)

### 5. Levée du verrou de hauteur du premier fold

`home.ts:20` : `class="flex flex-col justify-center min-h-[calc(100svh-5rem)] mt-20"`.
Total du premier fold = `mt-20` (5rem) + `100svh - 5rem` = **exactement `100svh`** ⇒ la section
projets démarre pile au pixel du fold, par construction.

**Constat qui commande le reste** : lever le verrou ne suffit pas. Le verrou n'ajoute du blanc que
si le contenu est *plus court* que `calc(100svh-5rem)`. Or la hauteur naturelle du fold, dérivée
des classes en place (1440×900, breakpoints `md`/`lg` actifs) :

| Poste | Classes | Hauteur |
|---|---|---|
| Décalage header | `mt-20` | 80 px |
| Hero — paddings | `md:pt-12 md:pb-16` | 112 px |
| Hero — contenu | `h1 lg:text-8xl leading-[1.2]` + tagline + badge | ≈ 235 px |
| Hero — CTA | `md:mt-8` + 1 rangée `size="large"` | ≈ 84 px |
| Expertises | `md:py-16` (128) + carte `min-h-55.5` (222) | 350 px |
| **Total** | | **≈ 861 px** |

Le verrou n'ajoute donc que ≈ 39 px à 1440×900 : **la contrainte réelle est la hauteur du contenu,
pas le `min-h`.** Et l'offset entre le début de la section projets et le haut de la première carte
vaut, dérivé pareillement (`md:py-20` 80 px + header de `HomeProjects` ≈ 179 px) ≈ **259 px**.
Budget à dégager pour que la carte dépasse à 1440×900 : `861 + 259 − 900` ≈ **220 px**.

> Ces valeurs sont **calculées depuis les classes Tailwind effectivement posées**, pas mesurées en
> navigateur : hauteurs de police, de bouton et nombre de lignes de la tagline sont des estimations.
> Elles fixent l'ordre de grandeur et la stratégie ; **la validation est la capture** (§ Risques).

**Changement retenu (dans `home.ts` uniquement) :**

1. Wrapper du fold : `flex flex-col justify-center min-h-[calc(100svh-5rem)] mt-20`
   → `flex flex-col mt-20`.
   Le `min-h` disparaît (c'est P1) ; `justify-center` part avec lui — sans hauteur imposée il
   n'a plus rien à centrer, le garder serait une utility morte. Le « centrage vertical du hero »
   est alors porté par les paddings symétriques du hero lui-même (`md:pt-12 md:pb-16`).
2. Section expertises : `py-12 md:py-16` → `py-8 md:py-8` (−64 px en `md`).
3. ~~Réduction des cartes d'expertise (`min-h-55.5` → `min-h-40`, `line-clamp-5` → `line-clamp-3`)~~
   — **levier rejeté, arbitré le 2026-09-07.** Il achetait 62 px au prix d'une troncature réelle
   des trois descriptions (~200 caractères chacune). La prose de ces cartes est parquée en **P2ter**,
   hors périmètre : un lot « SSR + layout » ne fait pas de dégât éditorial au passage. Le couple
   `min-h-55.5` carte/skeleton reste **inchangé des deux côtés**, la garde anti-CLS tient d'elle-même.
4. Section projets : `py-16 md:py-20` → `pt-8 md:pt-8 pb-16 md:pb-20` (−48 px sur l'offset).

Total dégagé ≈ **112 px** (leviers 1, 2 et 4) pour ≈ 220 px requis. **Le complément est assumé
comme dette de lot, pas comme échec** : il vient de Lot 2 (suppression de 2 CTA sur 3, ≈ 84 px) et
Lot 3 (réécriture du `h1`), qui attaquent le vrai poste — pas d'un coup de rabot supplémentaire ici.
Le critère d'acceptation a été réécrit en conséquence (§ Critères d'acceptation) : cible « première
carte visible » à 1440×900, « header de section visible » à 390×844.

**Aucun CLS introduit** : les trois changements sont des contraintes statiques (padding, `min-h`),
appliquées au premier paint, identiques serveur et client. Le couple carte/skeleton n'étant plus
touché, la page ne gagne aucun nouveau risque de CLS. Tailwind v4, utility classes seules, aucun
`styles:` ajouté, aucun token nouveau.

**390×844 — non atteignable dans ce périmètre, à arbitrer.** Sur mobile la grille passe en
`grid-cols-1` : les 3 cartes empilées valent à elles seules `3 × 160 + 2 × 24` = 528 px après
réduction, auxquelles s'ajoutent `mt-20` (80) et un hero d'environ 470 px (h1 `text-5xl`, tagline
sur ~4 lignes, 3 boutons empilés) — soit ≈ 1 078 px avant même que la section projets commence,
pour un fold de 844 px. Aucun réglage de padding ne comble 400 px.
Les deux issues, à trancher **hors de ce plan** :
- **(a) recommandé** — ce lot tient la cible « première carte visible » à **1440×900**, et à
  390×844 se contente de faire dépasser le **header de la section projets**. La cible mobile
  complète est reprise après Lot 2 (−CTA) et Lot 3 (hero réécrit), qui attaquent le vrai poste.
- **(b)** — passer la grille d'expertises en rail horizontal `snap-x` sous `md`. Techniquement
  in-scope (utility classes, `home.ts` seul) mais c'est un changement de présentation qui relève
  de « refonte graphique », explicitement hors périmètre.

### 6. Réactivité & état partagé

Inchangés, et volontairement. `bundle`/`expertises` restent des `computed()` dérivés du
`rxResource` existant ; `eagerSections` reste la lecture du signal `SectionScroller.eager`
(§3 point 2 : il garde un rôle sur le chemin SPA). Aucun `effect()`, aucun signal nouveau,
aucune promotion en store — on est très en dessous du seuil du profil (partage entre 2+ composants
non liés). `SectionScroller` reste le singleton `providedIn: 'root'` qu'il est.

### 7. Stratégie de test (cadrage pour `qa`, phase RED)

**Ce que Vitest/jsdom peut prouver, et ce qu'il ne peut pas.**

| Prouvable en Vitest | Prouvable seulement par le build |
|---|---|
| Le bloc projets rend `HomeProjects` à l'état `Complete` | Le bloc est **rendu côté serveur** |
| Le bloc contact rend `ContactForm` à l'état `Complete` | Le HTML prérendu contient les cartes |
| Le `@placeholder` est rendu à l'état initial | Le chunking n'a pas régressé |

Le comportement `hydrate` **n'est pas observable en jsdom** : `ngServerMode` est faux, il n'y a ni
`SSR_UNIQUE_ID` ni `DEHYDRATED_BLOCK_REGISTRY` peuplé, donc `shouldAttachTrigger(2, …)` est faux et
aucune instruction `ɵɵdeferHydrateOn*` ne fait quoi que ce soit. **Les tests Vitest prouvent que le
contenu différé est correct et rendable, pas qu'il est servi par le serveur** — cette dernière
preuve est exclusivement celle du `grep` sur `dist/…/browser/index.html` (§ Critères d'acceptation).
`qa` ne doit écrire aucune assertion prétendant couvrir l'hydratation.

**Pilotage.** `TestBed.configureTestingModule({ deferBlockBehavior: DeferBlockBehavior.Manual })`
**explicitement** : le défaut d'Angular 22 est `DeferBlockBehavior.Playthrough`
(`DEFER_BLOCK_DEFAULT_BEHAVIOR = DeferBlockBehavior.Playthrough`), et sous jsdom `on viewport`
échoue alors en silence, le placeholder reste, aucune assertion ne le détecte. Puis
`const [projects, contact] = await fixture.getDeferBlocks();` (ordre du template : projets, puis
contact) et `await block.render(DeferBlockState.Complete);`.
**Une fixture par scénario** : les transitions d'état ne rembobinent pas.

**Harnais.** Les tests de rendu ne peuvent pas réutiliser le `setup()` actuel, qui écrase le
template (`TestBed.overrideComponent(Home, { set: { imports: [], template: '<div></div>' } })`).
Il faut un second harnais qui conserve le vrai template, sans `NO_ERRORS_SCHEMA` (`render(Complete)`
instancie les vrais composants différés) et qui fournit leurs dépendances réelles :
`Router` (via `provideRouter([])`), `ContactGateway`, `AnalyticsGateway`, `provideHttpClientTesting()`
+ `HttpTestingController.verify()` en `afterEach`. Les 3 `describe` existants gardent le harnais
actuel — ils testent l'API de classe, pas le rendu.

**Sélecteurs.** `data-testid` uniquement (règle du profil). **Quatre** `data-testid` sont posés
**dans `home.ts`**, donc sans sortir du périmètre :

| `data-testid` | Emplacement | Sert à |
|---|---|---|
| `home-projects-section` | le `<section>` du bloc `@defer` projets (`home.ts:70`) | ancrer l'assertion de rendu du bloc projets |
| `home-projects-placeholder` | le `<div>` du `@placeholder` projets (`home.ts:76`) | prouver que le `@placeholder` est **conservé** |
| `home-contact-form` | attribut sur `<app-contact-form />` (`home.ts:89`) | ancrer l'assertion de rendu du bloc contact |
| `home-contact-placeholder` | le `<div>` du `@placeholder` contact (`home.ts:91`) | prouver que le `@placeholder` est **conservé** |

> **Les deux `*-placeholder` ont été ajoutés au cadrage après la phase RED (2026-09-07).** Sans eux,
> les cas 1 et 4 n'assertent qu'une **absence** (`home-projects-section` absent) — assertion qui
> resterait vraie si le bloc `@placeholder` était purement et simplement supprimé, alors qu'un
> critère d'acceptation exige explicitement que les blocs *conservent* leur `@placeholder`.
> C'est aussi la seule façon conforme au profil (`data-testid` uniquement, jamais class/texte) de
> prouver « placeholder **remplacé** » plutôt que « contenu absent ». **`angular-expert` doit poser
> les quatre**, sinon les cas 1 et 4 restent rouges.

`data-testid="project-card-link"` existe déjà dans `project-card.ts` : c'est lui qui porte la preuve
SSR, et il permet en test de vérifier que les cartes sont bien projetées quand `featuredProjects`
est non vide.

**Cas attendus** (`describe` > `it` Given/When/Then, une fixture chacun) :

1. *bloc projets — état initial* : sans `render()`, le `@placeholder` est présent et
   `home-projects-section` absent.
2. *bloc projets — `Complete`* : après `render(DeferBlockState.Complete)`, `home-projects-section`
   présent, et autant de `project-card-link` que de `featuredProjects` fournis par le gateway
   (fournir ≥ 2 projets — le `bundle()` du spec actuel a `featuredProjects: []`, il faudra un
   builder de `Project` : agrégat déjà listé comme candidat dans le profil).
3. *bloc contact — état initial* : `@placeholder` présent, `home-contact-form` absent.
4. *bloc contact — `Complete`* : `home-contact-form` présent, et le `<form>` du `ContactForm`
   monté sans erreur (preuve indirecte que le composant est instanciable hors navigateur).

**Hors périmètre du RED** : ne pas tenter de tester `@error` (nécessiterait de faire échouer
l'`import()` dynamique), ni le trigger `when eagerSections()` en rendu (les 2 `it` existants sur
`eagerSections` couvrent déjà le signal).

### 8. Risques & inconnues

- **`ContactForm` désormais rendu côté serveur** — risque principal du lot, réduit après
  vérification : `contact-form.ts`, `contact-info-panel.ts`, `button.ts`, `app-icon.ts` et
  `toast-store.ts` ne référencent **aucun** de `window` / `document` / `localStorage` /
  `navigator` / `matchMedia` / `IntersectionObserver`, n'ont ni `ngAfterViewInit` ni `effect()` ;
  l'unique `setTimeout` de `ToastStore` est armé dans `show()`, jamais au montage. Reste à
  reconfirmer au GREEN que `pnpm build` ne produit aucune erreur de prérendu.
- **La preuve SSR dépend d'un appel réseau au moment du build.** `InMemoryHomeGateway` compose
  `featuredProjects` depuis `ProjectsGateway.getFeaturedProjects()`, soit un vrai GET vers
  `https://api.nedellec-julien.fr/api` exécuté pendant le prérendu. Le build du 2026-09-07 le
  résout (les 3 cartes d'expertise sont dans le HTML prérendu, donc le bundle a émis) — mais si
  l'API est injoignable au build, `project-card-link` restera à 0 **sans que le fix soit en cause**.
  En cas de compteur à 0, vérifier d'abord `<app-home-projects` (présence de la section) avant de
  suspecter les triggers.
- **La cible layout à 390×844 n'est pas atteignable dans ce périmètre** (§5) : arbitrage (a)/(b)
  requis avant le GREEN. Les chiffres du §5 sont dérivés des classes, pas mesurés — la capture
  1440×900 / 390×844 est la seule autorité, et peut invalider le dimensionnement proposé.
- **Fenêtre de désynchronisation du formulaire de contact**, résiduelle et acceptée : entre l'entrée
  du formulaire dans le viewport et la fin de l'hydratation, une saisie serait écrasée par
  `writeValue('')`. `prefetch on idle` la réduit au temps de rendu ; `hydrate on interaction`
  l'aggraverait (cf. ADR-0001, décision 3). Aucune mitigation supplémentaire dans ce lot.

## Plan de test

> Phase **RED** livrée par `qa`. Fichier unique : `src/app/features/home/application/home.spec.ts`
> (complété, jamais remplacé — les 3 `describe` d'API de classe existants sont intacts).

### Harnais de rendu (`renderHomeTemplate`)

Second harnais, disjoint du `setup()` existant (lequel écrase le template par `<div></div>`) :

- `deferBlockBehavior: DeferBlockBehavior.Manual` **explicite**, puis
  `const [projectsBlock, contactBlock] = await fixture.getDeferBlocks()` (ordre du template :
  projets, puis contact) et `await block.render(DeferBlockState.Complete)`.
- **Une fixture par `it`** — aucune fixture partagée, aucune transition d'état rembobinée.
- Vrai template, **aucun** `NO_ERRORS_SCHEMA` : `render(Complete)` instancie réellement
  `HomeProjects`, `ProjectCard` et `ContactForm`.
- Dépendances fournies : `provideRouter([])`, `HomeGateway`, `SectionScroller` (stub signal),
  `ContactGateway`, `AnalyticsGateway`.
- Sélecteurs `data-testid` uniquement. Seule exception assumée : le `<form>` du `ContactForm`,
  interrogé par sélecteur de balise (sémantique HTML, ni id ni classe ni texte) — c'est
  précisément l'assertion « le formulaire réactif est instanciable hors navigateur ».

**Trois écarts au § 7 du Plan technique**, assumés et tracés :

1. **Pas de `provideHttpClientTesting()` ni de `HttpTestingController.verify()`.** Aucun composant
   du sous-arbre différé (`HomeProjects`, `ProjectCard`, `ContactForm`, `ContactInfoPanel`,
   `Button`, `AppIcon`, `AppIconTile`, `ToastStore`) n'injecte `HttpClient` : les trois gateways
   sont stubbés. Ces providers seraient du poids mort et un `verify()` sans objet.
2. **Quatre `data-testid` au lieu de deux.** Les deux `data-testid` supplémentaires portent sur les
   `@placeholder`. Sans eux, le test d'état initial n'assert qu'une **absence** — vrai même si le
   bloc `@placeholder` était supprimé — alors qu'un critère d'acceptation exige explicitement que
   les blocs « conservent leur `@placeholder` ». C'est aussi la seule façon conforme au profil
   (`data-testid` uniquement) de prouver que le placeholder est **remplacé** à l'état `Complete`.
3. **Builder `aProject()` local au spec**, et non fichier de builder partagé : le § 2 fige la liste
   des fichiers touchés. Duplication assumée avec la factory locale de `project-card.spec.ts` ;
   la promotion en builder partagé est une dette à arbitrer hors de ce lot.

### Contrat GREEN — `data-testid` à poser dans `home.ts`

| `data-testid` | Emplacement attendu |
|---|---|
| `home-projects-placeholder` | le `<div>` du `@placeholder` du bloc projets |
| `home-projects-section` | le `<section>` du contenu du bloc `@defer` projets |
| `home-contact-placeholder` | le `<div>` du `@placeholder` du bloc contact |
| `home-contact-form` | attribut sur `<app-contact-form />` |

`project-card-link` existe déjà dans `project-card.ts` : rien à poser.

### Cas de test

| # | Test | Scénario | Assertions clés | Nature |
|---|---|---|---|---|
| 1 | bloc projets — état initial | template réel, aucun `render()` forcé | `home-projects-placeholder` présent ; `home-projects-section` absent | **RED** |
| 2 | bloc projets — `Complete` | 2 projets mis en avant, `render(Complete)` | `home-projects-section` présent ; `home-projects-placeholder` absent | **RED** |
| 3 | bloc projets — projection des cartes | 2 projets mis en avant, `render(Complete)` | `project-card-link` × 2 | vert — non-régression |
| 4 | bloc contact — état initial | template réel, aucun `render()` forcé | `home-contact-placeholder` présent ; `home-contact-form` absent | **RED** |
| 5 | bloc contact — `Complete` | `render(Complete)` | `home-contact-form` présent ; `home-contact-placeholder` absent | **RED** |
| 6 | bloc contact — montage du formulaire | `render(Complete)` | un `<form>` est rendu (composant instanciable hors navigateur) | vert — non-régression |

**Les cas 3 et 6 sont verts dès maintenant, et c'est attendu** : `home.ts` porte déjà les deux
blocs `@defer` (sans `hydrate`), donc leur contenu est rendable en pilotage `Manual`. Ils ne sont
pas un RED déguisé — ils comblent le trou de test du § 3 de la Description et deviennent le filet
de non-régression du GREEN. Aucun faux échec n'a été fabriqué pour les faire passer au rouge.

**Aucun test ne prétend couvrir l'hydratation.** `hydrate on viewport` n'est pas observable en
happy-dom/jsdom (`ngServerMode` faux, pas de `SSR_UNIQUE_ID`) : cette preuve reste exclusivement
le `grep` sur `dist/angular-portfolio-app/browser/index.html` (§ Critères d'acceptation).

### Preuve RED

Commande du profil (`pnpm test` = `ng test`, builder `@angular/build:unit-test` → Vitest 4),
exécutée le **2026-09-07 18:09**. Aucune invalidation de cache requise (le diff ne touche
aucun système de cache).

```
 FAIL  src/app/features/home/application/home.spec.ts  (10 tests | 4 failed)
   × Home > rendu du bloc @defer projets > Given le template réel When le bloc reste à son état
     initial Then le placeholder est rendu et la section projets absente
     AssertionError: expected null not to be null   (home.spec.ts:193)
   × Home > rendu du bloc @defer projets > Given deux projets mis en avant When le bloc passe à
     Complete Then la section remplace le placeholder
     AssertionError: expected null not to be null   (home.spec.ts:207)
   × Home > rendu du bloc @defer contact > Given le template réel When le bloc reste à son état
     initial Then le placeholder est rendu et le formulaire absent
     AssertionError: expected null not to be null   (home.spec.ts:229)
   × Home > rendu du bloc @defer contact > Given le template réel When le bloc passe à Complete
     Then le formulaire remplace le placeholder
     AssertionError: expected null not to be null   (home.spec.ts:239)

 Test Files  1 failed | 52 passed (53)
      Tests  4 failed | 403 passed (407)
```

Baseline mesurée juste avant (spec remisée) : `401 passed (401)`. 407 − 401 = **6 tests neufs** ;
403 − 401 = **2 neufs verts** (cas 3 et 6) ; **4 neufs rouges** (cas 1, 2, 4, 5).

**Nature des échecs** : les 4 sont des `AssertionError` **comportementales** (`expected null not to
be null` sur une requête `data-testid`), pas des erreurs de harnais. Aucun « Zone is needed », aucun
provider manquant, aucun module introuvable. Le harnais `Manual` fonctionne — les cas 3 et 6 le
prouvent en rendant réellement `ProjectCard` et le `<form>` de `ContactForm` à l'état `Complete`.

**Gates annexes au vert** : `pnpm lint` → 0 erreur (2 warnings préexistants dans `blog-*.spec.ts`,
hors périmètre) ; `prettier --check` sur le spec → conforme. Le typecheck des specs passe (la
compilation du spec est un préalable à son exécution par le builder).

## Review code

**Verdict** : REJECTED
**Gates CI locaux** : tests ✅ (`pnpm test` → exit 0, `53 passed (53)` / `407 passed (407)`) / lint ✅ (`pnpm lint` → exit 0, `0 errors, 2 warnings`) / build ✅ (`pnpm build` → exit 0, `Prerendered 5 static routes`, aucun warning émis)
**Warnings de gate** :
- (b) pré-existant — `blog-detail.spec.ts:48` et `blog-list.spec.ts:29`, `@typescript-eslint/explicit-function-return-type`. Fichiers hors diff. Non bloquant.
- (b) pré-existant, en limite de (c) — la suite de tests émet des erreurs runtime réelles sur stdout tout en sortant 0 : `getaddrinfo ENOTFOUND demo.test` (fetch réseau réel) et `Failed to load script "https://giscus.app/client.js"`, depuis `src/app/features/blog/application/blog-comments.ts:28`. Hors diff, mais la suite n'est **pas hermétique** : elle tente une résolution DNS sortante. Se comportera différemment sur un runner CI restreint. À remonter (le profil note `aucun workflow GitHub Actions` — la dette se paiera à l'ajout de la CI).

**Rendu compilé** : ✅ — `min-h-[calc(100svh-5rem)]` n'est plus émis dans `dist/angular-portfolio-app/browser/styles-*.css` (suppression propre, aucune utility morte) ; `justify-center` reste généré, encore consommé par la rangée de CTA du hero. Aucun composant à sélecteur attribut touché.
**Preuve de verify runtime** : ❌ — gate applicable (le diff touche `src/**`), section `## Verify` absente, aucune observation navigateur. Outillage vérifié et **effectivement absent** de cette session : ni `playwright` ni `puppeteer` installés, aucun `chrome`/`chromium` sur le PATH, aucun outil MCP navigateur exposé (seul `/usr/bin/firefox` existe, sans driver). Je n'ai donc pas pu produire la preuve à la place de l'implémenteur. Bloquant — cf. point #1.
**Conventions Angular 20+** : ✅
**Cross-platform** : N/A (profil : aucun Capacitor/Electron)
**Tests** : ✅ sur la forme, ⚠️ sur la portée (cf. Tests notables)
**Sécurité** : ✅ — aucun secret, aucun `innerHTML`/`bypassSecurityTrust*`, aucun `console.log` résiduel, aucun `.then()` sans `catch` introduit.
**Alignement spec** : ❌ — cf. points #3 et #4.

### Ce que j'ai vérifié moi-même et qui tient

- **P0 tenu, preuve machine indépendante.** `dist/angular-portfolio-app/browser/index.html` (rebuild complet de ma part) : `__nghDeferData__` = `{"d0":{"r":1,"s":2,"t":[2]},"d1":{"r":1,"s":2,"t":[2]}}` — les deux blocs sont sérialisés à l'état `2` (Complete) avec le trigger de type `2` (hydrate/viewport). Marqueurs reproduits au chiffre près : `project-card-link` ×2 (avec de vrais `href="/projects/dashflow"` / `href="/projects/candidash"`), `<app-home-projects` ×1, `<app-contact-form` ×1, `<form` ×1, `<input` ×3, `home-*-placeholder` ×0, 83 617 o.
- **Non-régression de chunking confirmée.** `grep -c 'Voir tous les projets\|Envoyer un message\|Aperçu des projets' main-BPYCAJMZ.js` → `0` ; les marqueurs vivent dans `chunk-SGAEWAJD.js` et `chunk-JVUSWAGP.js` ; `contact-form` reste un lazy chunk de 13.10 kB ; `main` = 52 086 o.
- **SSR-safety du sous-arbre différé : clean, y compris en transitif.** `contact-form`, `contact-info-panel`, `button`, `app-icon`, `icon-tile`, `home-projects`, `project-card`, `contact-info.static-data`, `contact.gateway`, `analytics.gateway` — aucun accès `window`/`document`/`localStorage`/`navigator`/`matchMedia`/`IntersectionObserver`, aucun `ngOnInit`/`ngAfterViewInit`/`effect()`. `ToastStore` est gardé par `isPlatformBrowser` et n'arme son `setTimeout` que dans `show()`. `ProjectCard` n'injecte `AnalyticsGateway` que pour `trackClick()` (au clic, jamais au montage) — le prérendu ne déclenche aucun POST analytics. `SectionVisibility` passe par `afterNextRender` (jamais serveur), `SectionScroller` par le token `DOCUMENT` + gardes.
- **ADR-0001 décision 3 : exacte sur l'Angular réellement installé.** `@angular/forms@22.0.3`, `forms.mjs:1880 setUpControlValueAccessor()` → ligne 1886 `dir.valueAccessor.writeValue(control.value);`, inconditionnel, avant tout `setUpViewChangePipeline`. `ContactForm` est bien un formulaire réactif (`ReactiveFormsModule`, `[formGroup]`). La proscription de `hydrate on interaction` est mécaniquement fondée, pas préférentielle.
- **Décision 4 (`when eagerSections()` conservé) : raisonnement vérifié, pas de régression de navigation interne.** `shouldAttachRegularTrigger()` (core 22.0.3, `_debug_node-chunk.mjs:13344`) : sur le chemin SPA, `Home` est créé par le Router, `lDetails[SSR_UNIQUE_ID] === null` ⇒ `wasServerSideRendered` faux ⇒ les triggers réguliers **sont** attachés. `SectionScroller.scrollTo('contact')` pose `_eager.set(true)` puis `navigateByUrl('/')` puis `_scrollWhenStable` ; le bloc contact n'est pas dans le viewport à cet instant, donc `on viewport` seul le laisserait sur son `@placeholder` (`h-96`) — l'`id="contact"` est porté par le `<div>` wrapper, hors du `@defer`, donc le scroll aboutirait sur une coquille vide. `when eagerSections()` est bien **load-bearing** sur ce chemin. À l'inverse sur le chemin document, le bloc est déjà rendu par le serveur : le scroll trouve du contenu réel. Aucune régression.
- **Tests `home.spec.ts` : pilotage correct.** `deferBlockBehavior: DeferBlockBehavior.Manual` posé explicitement — nécessaire, car `DEFER_BLOCK_DEFAULT_BEHAVIOR = DeferBlockBehavior.Playthrough` est toujours le défaut en 22.0.3 (`testing.mjs:135`). Une fixture neuve par `it` (aucun partage, aucune transition rembobinée). Aucune assertion ne prétend couvrir l'hydratation. Sélecteurs `data-testid` uniquement, sauf le `querySelector('form')` du cas 6, exception assumée et légitime.
- **A11y : aucune régression introduite.** Hiérarchie de titres dans le HTML prérendu : `h1 → h2(sr-only Expertises) → h3×3 → h2(Aperçu des projets) → h2,h2(titres de carte) → h2(Contactez-moi) → h3×3` — aucun saut de niveau. `aria-labelledby="expertise-heading"` conservé sur la section expertises. La levée de `justify-center` et les changements de padding sont purement visuels : aucun changement d'ordre DOM, donc aucun changement d'ordre de tabulation, aucun landmark ajouté ou dupliqué. Le hero ne dépendait pas de la hauteur du parent (`host: { class: 'relative block pt-8 pb-12 md:pt-12 md:pb-16 …' }`, aucun `flex-1`/`h-full`).
- **Commentaires / archéologie** : grep du profil (`ADR-[0-9]|spec [0-9]{3}|§ ?[A-Z]|ajouté pour|/\*\*`) sur `home.ts` et `home.spec.ts` → **0 hit**. Le commentaire devenu faux (`First fold: hero + expertise vertically centered under header`) a été corrigé en même temps que la classe, pas laissé à pourrir. Bon point.
- **Altitude composant** : `home.ts` 112 LOC / 2 collaborateurs injectés — sous les seuils (250 / 6). Rien à signaler.

### Points à corriger

1. **Preuve de verify runtime absente — bloquant de gate (§ 1.6).** La spec n'a pas de section `## Verify` et aucune observation navigateur n'existe. Ce n'est pas un formalisme ici : **tout l'objet du lot est un changement de comportement à l'exécution**. Les gates prouvent que ça compile et que le *serveur* sérialise le bon HTML ; **rien ne prouve la moitié cliente** — que les deux blocs s'hydratent réellement `on viewport` sans mismatch, que le formulaire redevient utilisable après hydratation, que `withEventReplay()` ne casse rien, et que la console est propre. Attendu : lancer l'app (`pnpm start` ou le build prérendu servi), ouvrir `/`, scroller jusqu'aux projets puis jusqu'au contact, saisir et soumettre le formulaire, et consigner dans `## Verify` les 4 éléments (steps, verdict PASS, capture, console propre — captures DevTools ouvertes). Sans ça, pas d'APPROVED.

2. **Risque d'hydratation non analysé : divergence des données entre prérendu et runtime.** Constat mesuré sur le build : le `ng-state` de la home ne contient que `__nghData__` et `__nghDeferData__` — **aucune entrée de transfer cache HTTP**. Or `InMemoryHomeGateway.getHomeBundle()` dérive `featuredProjects` de `HttpProjectsGateway.getFeaturedProjects()`, soit `GET {api}/projects?featured=true&_sort=order`, exécuté **au build** et figé dans le HTML statique. Côté client, le `rxResource` refait l'appel en direct. Avant ce diff le bloc projets n'était jamais rendu par le serveur : il n'y avait rien à réconcilier. Après ce diff, le bloc `d0` est déshydraté à l'état Complete et s'hydrate `on viewport` **contre un DOM construit à partir des données du build** : si la liste live diffère (mutation admin entre deux déploiements, API en erreur, ordre différent), le `@for` ne réconcilie pas — erreur d'hydratation, bruit console, re-rendu client. Ni le § 4 / § 8 du Plan technique ni les *Consequences* d'ADR-0001 ne couvrent ce cas : l'ADR ne traite que la SSR-safety au sens `window`/`document`. Attendu : trancher explicitement (inclure cette requête dans le transfer cache — noter que le `filter` actuel `!req.url.includes('/home-bundle')` ne la vise pas —, ou accepter et documenter le mismatch dans les *Consequences* de l'ADR), et le vérifier au point #1 (c'est précisément ce que la console révélera).

3. **Critère d'acceptation P1 à 1440×900 auto-contradictoire.** `## Critères d'acceptation` affirme toujours « **1440×900** — le haut de la première carte projet dépasse le fold », tandis que le § 5 du Plan technique calcule ≈ 112 px dégagés pour ≈ 220 px requis et qualifie lui-même l'écart de « dette de lot ». Par l'arithmétique de la spec, ce critère **n'est pas atteint** (haut de carte ≈ 1 008 px pour un fold de 900 px) ; il n'est pas non plus vérifié visuellement. Je ne rejette pas sur les leviers arbitrés (pas de troncature éditoriale, cible mobile réécrite) — je rejette sur le fait qu'un critère d'acceptation est énoncé comme tenu et déclaré non tenu vingt lignes plus bas. Attendu : réécrire ce critère comme l'a été celui de 390×844 (p. ex. « le header de la section projets dépasse le fold, la carte est reprise en Lot 2/3 »), ou le tenir. **P1 est à ce stade vérifié sur le code, non vérifié visuellement** — la seule autorité annoncée par la spec elle-même (la capture) manque.

4. **Fichiers hors plan dans l'arbre de travail.** Le § 2 du Plan technique dit « Aucun autre fichier ». L'arbre porte en plus `public/sitemap.xml` (modifié) et `public/rss.xml` (**non suivi et non gitignoré**), tous deux produits par `pnpm build` (`"build": "tsx scripts/generate-sitemap.mjs && tsx scripts/generate-rss.mjs && ng build"`), plus `tasks/` non suivi. Le `sitemap.xml` dérive au-delà des `lastmod` (ajout de `/blog`) : la version committée était périmée par rapport à ce que le générateur produit — dette pré-existante, sans rapport avec ce lot. Attendu : scoper le commit (ces artefacts ne sont pas le lot), et trancher séparément le sort de `public/rss.xml` (committer ou ignorer). À noter aussi : la branche `feat/home-ssr-visibility` **n'a aucun commit** (`HEAD == master`) — la revue a porté sur le diff d'arbre de travail, pas sur un diff de branche.

5. **Spec et ADR citent `@angular/core@21` ; l'installé est `22.0.3`** (`@angular/core`, `@angular/forms`, `^22.0.3` dans `package.json`). J'ai revérifié chaque affirmation runtime sur la version réellement installée et **toutes tiennent** (`shouldAttachRegularTrigger`, `shouldAttachTrigger(2) === !shouldAttachRegularTrigger(...)`, `DEFER_BLOCK_DEFAULT_BEHAVIOR = Playthrough`, `setUpControlValueAccessor` → `writeValue`) : c'est une erreur de citation, pas une erreur de fond. Corriger les références. Dans la foulée, `.claude/project-profile.md` est périmé sur deux points qui pilotent les agents : il déclare Angular `21` (d'où sa règle « `OnPush` explicite obligatoire », qui devient facultative en 22) et un runner `jsdom` alors que la suite tourne sur **happy-dom 20.9.0**.

### Tests notables

- ⚠️ `home.spec.ts` (les 6 nouveaux `it`) — **aucun ne verrouille le fix P0**. Supprimer `hydrate on viewport` des deux blocs laisse les 407 tests au vert : `deferBlockBehavior: Manual` court-circuite précisément l'arbitrage des triggers. La spec l'assume honnêtement (« aucun test ne prétend couvrir l'hydratation »), mais la conséquence n'est pas tirée : la seule garde du P0 est un `grep` manuel sur `dist/`, non automatisé, dans un repo où le profil note `aucun workflow GitHub Actions`. Le fix est protégé par rien. Suggestion : porter le `grep` de `## Critères d'acceptation` dans un script de post-build (ou le premier job CI), sinon la régression reviendra sans bruit.
- ⚠️ `home.spec.ts:191/199/222/232` — le RED des cas 1, 2, 4, 5 est un **RED de contrat de sélecteur**, pas un RED de comportement : les quatre `AssertionError: expected null not to be null` disent que les `data-testid` n'existaient pas encore dans le template, pas que le rendu était fautif. C'est du TDD légitime sur le contrat de test, mais l'affirmation du § *Preuve RED* (« comportementales, pas des erreurs de harnais ») surinterprète : aucun de ces quatre rouges ne pointait le défaut P0.
- ⚠️ `home.spec.ts:28` — `aProject()` est le **troisième** factory local de `Project` du repo, aux côtés de `project()` (`project-card.spec.ts:9`) et `makeProject()` (`filter-projects.use-case.spec.ts:4`) — trois noms pour un agrégat que le profil liste explicitement comme candidat builder « dès qu'il est construit >1× dans les tests ». La spec trace l'écart et le renvoie hors lot ; c'est défendable, mais le troisième duplicata est le moment où la dette devrait être payée. Non bloquant.
- ✨ `home.spec.ts` — bon choix de conception : les deux `data-testid` de `@placeholder` transforment quatre assertions d'**absence** (vraies même si le `@placeholder` était supprimé) en assertions de **remplacement**. C'est la seule façon conforme au profil (`data-testid` uniquement) de prouver le critère « les blocs conservent leur `@placeholder` ». Bien vu, et correctement documenté comme écart au § 7.
- ✨ `home.spec.ts` — le second harnais `renderHomeTemplate()` est disjoint du `setup()` existant au lieu de le tordre : les 3 `describe` d'API de classe gardent leur template écrasé, les nouveaux rendent le vrai template sans `NO_ERRORS_SCHEMA`. Bonne séparation des niveaux de test.

### Duplication / dérivation

- ⚠️ `src/app/features/home/application/home.spec.ts:28` — `aProject()` duplique `project()` (`features/projects/application/components/project-card.spec.ts:9`), champ pour champ. Remède : builder `Project` partagé, consommé par les trois specs. **Non bloquant** (un seul agrégat, pas de motif massif) — mais c'est la troisième occurrence, cf. Tests notables.

### Note a11y, pré-existante et hors périmètre

Les titres de carte projet sont des `<h2>` (`project-card.ts`), placés sous le `<h2>` « Aperçu des projets » de la section : hiérarchie aplatie (des `<h3>` seraient corrects). C'est pré-existant et non touché par le diff — donc **pas un motif de rejet ici**, du ressort de l'`intake-auditor`. Signalé parce que le lot le rend pour la première fois **visible dans le HTML servi et indexé** : ce qui était un détail de rendu client devient du signal SEO.

---

## Suite donnée à la revue (2026-09-07)

Verdict `code-reviewer` : **REJECTED**, 3 bloquants. Traitement point par point.

| # | Bloquant | Traitement |
|---|---|---|
| 1 | Verify runtime absent | **Accepté, non levable dans la session.** Aucun outil navigateur disponible (ni playwright/puppeteer, ni extension Chrome) — vérifié indépendamment par le reviewer. P1 reste **vérifié sur le code, non vérifié visuellement**. Validation visuelle déléguée à l'utilisateur sur le build prérendu servi localement. |
| 2 | Mismatch d'hydratation / transfer cache | **Mécanisme réel, attribution corrigée.** Mesure : `ng-state` ne contient aucune entrée de transfer cache sur **les 4 routes prérendues**, `/projects` et `/blog` incluses — routes que ce lot ne touche pas. De plus `getHomeBundle()` conditionne le bundle entier à l'HTTP, exposant déjà les cartes d'expertise **eager sur `master`**. Ce lot n'introduit pas le problème et l'étend de la façon la moins exposée (`hydrate on viewport` = hydratation tardive). **Sorti du périmètre → `specs/004-transfer-cache-prerender.md`** (arbitrage utilisateur du 2026-09-07). |
| 3 | Critère P1 auto-contradictoire | **Accepté et corrigé.** Le critère affirmait « le haut de la première carte projet dépasse » à 1440×900 alors que le § 5 chiffre ≈ 112 px dégagés sur ≈ 220 px requis. Critère et Objectif réécrits : le lot s'engage sur « le header de la section projets dépasse » ; la carte complète reste l'objectif, atteignable après Lot 2/3. |

Mineurs traités : citations `@angular/core@21` → `22.0.3` corrigées dans la spec et l'ADR (le reviewer a revérifié chaque affirmation runtime sur la version réelle — **toutes tiennent**) ; `public/sitemap.xml` reverté (régénération de build, hors lot) ; utilities mortes `py-8 md:py-8` / `pt-8 md:pt-8` simplifiées.

Mineurs **non** traités, hors périmètre, à porter ailleurs :
- `public/rss.xml` est généré par `scripts/generate-rss.mjs` au build mais n'est ni suivi ni gitignoré → repollue le worktree à chaque build.
- `.claude/project-profile.md` est périmé sur deux paramètres qui pilotent les agents : Angular `21` (l'installé est `22.0.3`) et runner `jsdom` (la suite tourne sur **happy-dom 20.9.0**).

**Point de fond du reviewer, non bloquant mais juste** : supprimer `hydrate on viewport` demain laisserait les 407 tests au vert — `deferBlockBehavior: Manual` court-circuite précisément l'arbitrage des triggers. Le fix P0 n'est gardé que par un grep manuel sur `dist/`, dans un repo **sans workflow CI**. Un garde-fou automatisé (assertion sur le HTML prérendu en CI) est le vrai correctif ; il dépasse ce lot.
