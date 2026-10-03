---
id: 008
title: Landmarks uniques — un seul `<main>` (celui du shell) et en-tête dans un landmark `banner`
type: fix
status: draft
created: 2026-10-03
related: [specs/007-offre-site-industrie.md, src/app/app.ts, src/app/layout/components/header/header.ts]
---

# 008 — Landmarks uniques (main imbriqué, contenu de l'en-tête hors landmark)

## Description

### Contexte

La revue de la spec 007 (page `/offre-site-industrie`, qui évite déjà le problème) a relevé deux
défauts d'accessibilité transverses, signalés par axe sur les pages publiques prérendues.

1. **`<main>` imbriqué.** Le shell `App` (`src/app/app.ts`) possède le `<main>` autour du
   `<router-outlet />`. Plusieurs composants de page émettent **leur propre** `<main>` à
   l'intérieur : axe `landmark-no-duplicate-main`, `landmark-main-is-top-level`. Recensement
   (`grep "<main" src/app`) :
   - `features/home/application/home.ts`
   - `features/profile/application/about.ts`
   - `features/projects/application/projects.ts`, `project-detail.ts`
   - `features/blog/application/blog-list.ts`, `blog-detail.ts`
   - `pages/legal-notice.ts`, `pages/privacy-policy.ts`
   - `pages/page-not-found.ts` : sain (pas de `<main>`).
   - `features/admin/application/admin-layout.ts` : idem mais **hors périmètre** (route admin
     non publique, non prérendue) ; constat consigné en fin de spec.
2. **Contenu de l'en-tête hors landmark.** `app-header` rend un `<div>` fixe : le logo (lien
   d'accueil) et les boutons (thème, CV, menu mobile) ne sont dans aucun landmark (seule la
   `<nav>` en est un). axe `region` × 2, identique sur toutes les pages publiques.

3. **Landmarks `navigation` non uniques** (relevé au baseline axe, présent en prod) : chaque
   `app-project-card` émet `<nav aria-label="Liens du projet">` ; sur `/` et `/projects`, plusieurs
   cartes ⇒ plusieurs `navigation` de même nom, axe `landmark-unique`.

### Ce qui est attendu

- **Ownership unique** : le shell possède `<main>` ; aucun composant routé n'émet `<main>`.
  Les classes de mise en page portées par l'ancien `<main>` de page sont conservées (sur l'host
  ou un élément neutre), **sans régression visuelle**.
- **Tout le contenu de `app-header` est dans un landmark** (`banner`).
- Chaque `navigation` de carte projet a un nom accessible unique (inclut le titre du projet).
- Aucun changement fonctionnel, de contenu, de SEO ni de routes.

### Critères d'acceptation

- [ ] Zéro violation axe sur `/`, `/about`, `/projects`, `/blog`, `/mentions-legales`,
      `/confidentialite`, `/offre-site-industrie` (build de prod prérendu servi en statique).
- [ ] Exactement un `<main>` par page publique (HTML prérendu).
- [ ] Aucune régression visuelle (comparaison avant/après).
- [ ] Tests : chaque page concernée n'émet pas de `main` ; l'en-tête expose un `banner` qui
      contient le lien d'accueil et la navigation.
- [ ] Gates : `pnpm install --frozen-lockfile`, `pnpm run build --configuration production`,
      `pnpm test`, `pnpm lint` verts. `public/sitemap.xml` et `public/rss.xml` restaurés après
      build (hors diff).

## Plan technique

### Architecture

Correctif de template pur, aucune couche domaine/infra/état touchée. Règle d'ownership des
landmarks, déjà posée par la spec 007 (§ Landmarks) et appliquée par `SiteOffer` : **le shell
`App` possède `banner` (`app-header`), `main` (autour du `router-outlet`) et `contentinfo`
(`app-footer`) ; un composant routé n'en émet aucun.** Pas d'ADR (règle déjà actée, aucune
nouvelle abstraction).

- **Pages** : l'élément `<main>` racine de chaque page est **supprimé** et ses classes passent sur
  `host.class` (CLAUDE.md « Layout sur l'host » ; précédent `site-offer.ts` : `host: { class:
  'block pt-20' }`). Chaque `<main>` est l'**unique** racine rendue du template (seul un `@let`
  le précède dans les pages de détail, il ne rend aucun nœud) ⇒ l'host prend exactement la place
  de la boîte : même parent (`<main class="min-h-svh">` du shell), mêmes enfants directs, rendu
  identique. Pas d'élément neutre de remplacement (`<div>`) : ce serait un wrapper inutile.
  Aucun sélecteur CSS ne cible `main` (`src/styles.css` vérifié).
- **`min-h-svh` en double** (shell + page) : **conservé** sur les pages. Le retirer changerait la
  hauteur de la page (le `pt-20` s'ajoute sous `box-sizing: border-box`, la boîte page fait
  `max(100svh, contenu)`) ; le fix vise zéro régression visuelle, pas un nettoyage de layout.
- **En-tête** : le `<div>` externe fixe de `header.ts` devient **`<header>`** avec les mêmes
  classes. `app-header` est enfant direct de `app-root`, hors `article`/`aside`/`main`/`nav`/
  `section` ⇒ rôle implicite `banner` (HTML-AAM). Retenu contre `host: { role: 'banner' }` :
  sémantique native d'abord (pas d'ARIA quand un élément natif porte le rôle), et le drawer
  (`role="dialog" aria-modal`) **reste hors du banner**, frère du `<header>` comme aujourd'hui
  (avec un `role` sur l'host, le dialog se retrouverait imbriqué dans le banner). Le drawer n'est
  rendu que si `visible()` (`@if`) : absent du HTML prérendu.

### Fichiers à modifier

| Fichier | Changement |
|---|---|
| `src/app/features/home/application/home.ts` | `host.class` `block` → `flex flex-col w-full` ; `<main>` retiré |
| `src/app/features/profile/application/about.ts` | `host.class` → `block min-h-svh pt-20` ; `<main>` retiré |
| `src/app/features/projects/application/projects.ts` | `host.class` → `block min-h-svh pt-20 pb-24` ; `<main>` retiré |
| `src/app/features/projects/application/project-detail.ts` | `host.class` → `block min-h-svh pt-20 pb-16` ; `<main>` retiré (`@let p` conservé en tête) |
| `src/app/features/blog/application/blog-list.ts` | `host.class` → `block min-h-svh pt-20 pb-24` ; `<main>` retiré |
| `src/app/features/blog/application/blog-detail.ts` | `host.class` → `block min-h-svh pt-20 pb-16` ; `<main>` retiré (`@let p` conservé) |
| `src/app/pages/legal-notice.ts` | `host.class` → `block min-h-svh pt-20 pb-16` ; `<main>` retiré |
| `src/app/pages/privacy-policy.ts` | `host.class` → `block min-h-svh pt-20 pb-16` ; `<main>` retiré |
| `src/app/layout/components/header/header.ts` | `<div>` externe fixe → `<header>` (classes inchangées) |
| Specs : `home.spec.ts`, `projects.spec.ts`, `project-detail.spec.ts`, `blog-list.spec.ts`, `blog-detail.spec.ts`, `pages/legal-pages.spec.ts`, `header.spec.ts` | Assertions landmarks (cf. Tranches) |
| `src/app/features/profile/application/about.spec.ts` | **À créer** (n'existe pas) : rendu de `About` + assertion landmark |

Home : `flex` est de niveau bloc, il remplace `block` (les deux ensemble seraient en conflit) ;
`w-full` conservé à l'identique. Réindentation du template après retrait du `<main>` : attendue
(prettier), pas de changement de contenu.

### Modèles, réactivité, état, cross-platform, bibliothèques

Sans objet : aucun modèle, signal, store, gateway ni dépendance ajoutés. L'audit axe de
vérification passe par `pnpm dlx @axe-core/cli` (ad hoc, **pas** de devDependency).

### Tranches

- **Tranche 1 — les pages routées n'émettent plus de `main`** : 8 composants de page.
  Tests (un par page, réutilisant l'assertion précédente de `site-offer.spec.ts`) :
  `expect(fixture.nativeElement.querySelectorAll('main')).toHaveLength(0)` après rendu nominal
  (données présentes pour `project-detail`/`blog-detail`, sinon le test passe à vide). Plus une
  assertion de non-régression de layout : `fixture.nativeElement.classList` contient les classes
  de l'ancien `<main>` (`min-h-svh`, `pt-20`, `pb-*` selon la page ; `flex`, `flex-col` pour
  Home) — lecture de `classList` de l'host, pas un sélecteur de classe sur le DOM. Dans
  `legal-pages.spec.ts`, `it.each` sur `[LegalNotice, PrivacyPolicy]`. `about.spec.ts` : rendu
  de `About` avec `provideRouter([])` ; les `@defer` restent en placeholder, sans incidence sur
  l'assertion.
- **Tranche 2 — l'en-tête est un landmark `banner`** : `header.ts`. Tests dans `header.spec.ts`
  (happy-dom ne calcule pas les rôles : on vérifie l'élément natif qui porte le rôle implicite) :
  `:scope > header` existe et est unique ; il contient le lien d'accueil (`a[href="/"]`), la
  `nav[aria-label="Navigation principale"]` et le bouton de thème ; les enfants élément de
  l'host sont exactement `header` + `app-drawer` (aucun contenu hors landmark) ; menu ouvert, le
  `[role="dialog"]` n'est **pas** descendant du `header` racine.

- **Tranche 3 — nom unique des `nav` de carte projet** (ajout orchestrateur après baseline axe) :
  `features/projects/application/components/project-card.ts`, `aria-label="Liens du projet"` →
  `[attr.aria-label]="'Liens du projet ' + project().title"` (même forme que les `aria-label` des
  liens de la carte). On garde `<nav>` (groupe de liens sortants, landmark utile à la navigation
  clavier). Test dans `project-card.spec.ts` : deux cartes de titres différents ⇒ `nav`
  `aria-label` distincts et contenant chacun le titre.

Les trois tranches sont indépendantes (verticales sur leurs composants, ordre libre).

### Baseline axe (avant correctif, build prod de `master` 5baeedf servi en statique)

Harnais : Playwright 1.58 + `@axe-core/playwright` (scratchpad, hors dépendances du repo), API
prod proxifiée avec en-têtes CORS (sinon un toast d'erreur CORS propre à `localhost` ajoute un
faux `color-contrast`), 2 thèmes × 2 viewports (1280, 375). Identique à la prod
(`nedellec-julien.fr`, vérifié) :

| Page | `<main>` | Violations |
|---|---|---|
| `/`, `/projects` | 2 | `landmark-main-is-top-level`, `landmark-no-duplicate-main`, `landmark-unique` ×2, `region` ×3 (×2 en 375) |
| `/about`, `/blog`, `/mentions-legales`, `/confidentialite` | 2 | idem, `landmark-unique` ×1 |
| `/offre-site-industrie` | 1 | `region` ×3 (×2 en 375) |

### Vérification (preuve runtime, avant PR)

1. Build prod déjà produit (`dist/angular-portfolio-app/browser`), servi statiquement
   (`pnpm dlx serve dist/angular-portfolio-app/browser`, ou `python3 -m http.server`).
2. `grep -o '<main' <page>/index.html | wc -l` = **1** sur chaque page prérendue (les 7 URL des
   critères + un `projects/<slug>` et un `blog/<slug>` prérendus, touchés par la tranche 1).
3. `pnpm dlx @axe-core/cli <url…>` sur les mêmes URL : **0 violation** (en particulier
   `landmark-no-duplicate-main`, `landmark-main-is-top-level`, `region`). Rejouer avant le fix
   sur `master` pour consigner le delta.
4. Captures avant/après en 375×667 et desktop sur `/`, `/about`, `/blog`, un détail : aucune
   différence (position du contenu sous l'en-tête fixe, hauteur min, pied de page).
5. Restaurer `public/sitemap.xml` et `public/rss.xml` après build (hors diff).

### Risques & inconnues

- **Second `banner` menu ouvert** : le drawer contient son propre `<header>` (titre « Menu ») dans
  un `role="dialog"` ; selon le navigateur, un `<header>` hors sectioning content peut être exposé
  `banner`. Invisible au prérendu (drawer non rendu) mais à vérifier à l'axe menu ouvert ; si
  violation, remplacer ce `<header>` de `shared/ui/drawer.ts` par un `<div>` (hors périmètre sinon).
- **Hors périmètre, constat** : `features/admin/application/admin-layout.ts` émet aussi un
  `<main>` dans celui du shell (route admin non publique, non prérendue) ; même correctif à
  porter dans une spec dédiée.
- Classes d'host et classes posées par un parent sur `<app-xxx>` : aucune page n'est instanciée
  avec `class=` (routées via `router-outlet`), pas de collision.

## Plan de test

Commande : `pnpm test` (`ng test` : typecheck des specs + Vitest/happy-dom), après
`pnpm exec ng cache clean` + `rm -rf node_modules/.vite`. Lint/format des specs touchées :
`eslint` et `prettier --check` verts. Les trois tranches sont jouées dans le même tour RED
(indépendantes, template-only). Résultat global : 12 failed / 685 total, 673 tests préexistants
verts, les 12 échecs sont tous des `AssertionError` sur les tests neufs (aucune erreur de harnais).

### Tranche 1 — les pages routées n'émettent plus de `main`

Chaque test rend la page avec ses données (pré-assertion de contenu qui passe : `h1`, `article`,
ligne d'article, texte du projet), puis asserte `querySelectorAll('main')` de longueur 0 et la
`classList` triée de l'host égale aux classes attendues.

| Fichier | Test | Assertions clés |
|---|---|---|
| `features/home/application/home.spec.ts` | landmarks › template réel | 0 `main` ; host = `flex flex-col w-full` (exact, donc sans `block`) |
| `features/profile/application/about.spec.ts` (créé) | profil livré, `@defer` en Manual | `h1` = displayName ; 0 `main` ; host = `block min-h-svh pt-20` |
| `features/projects/application/projects.spec.ts` | projets chargés | texte « Mon site » ; 0 `main` ; host = `block min-h-svh pt-20 pb-24` |
| `features/projects/application/project-detail.spec.ts` | projet du slug | `h1` contient « Mon site » ; 0 `main` ; host = `block min-h-svh pt-20 pb-16` |
| `features/blog/application/blog-list.spec.ts` | articles publiés | 1 `app-blog-post-row` ; 0 `main` ; host = `block min-h-svh pt-20 pb-24` |
| `features/blog/application/blog-detail.spec.ts` | article du slug | `article` présent ; 0 `main` ; host = `block min-h-svh pt-20 pb-16` |
| `pages/legal-pages.spec.ts` | `it.each` LegalNotice / PrivacyPolicy | `h1` présent ; 0 `main` ; host = `block min-h-svh pt-20 pb-16` |

RED confirmé via la commande test du profil le 2026-10-03 20:15, 8 failed / 685 total (tranche 1 ;
échecs `AssertionError: expected <main …> to have a length of +0 but got 1`).

### Tranche 2 — l'en-tête est un landmark `banner`

`layout/components/header/header.spec.ts`, describe `landmark banner` :

- host rendu : enfants élément = exactement `['header', 'app-drawer']` (header unique, aucun
  contenu hors landmark).
- le premier enfant est un `header` contenant `a[href="/"]`, `nav[aria-label="Navigation
  principale"]` et le bouton de thème (`button[aria-label="Passer en mode sombre|clair"]`).
- menu ouvert (`toggleMobileMenu`) : `[role="dialog"]` présent, le premier enfant est un `header`
  et ne contient pas le dialog.

RED confirmé via la commande test du profil le 2026-10-03 20:15, 3 failed / 685 total (tranche 2 ;
échecs `expected [ 'div', 'app-drawer' ] to deeply equal [ 'header', 'app-drawer' ]` et
`expected 'div' to be 'header'`).

### Tranche 3 — nom unique des `nav` de carte projet

`features/projects/application/components/project-card.spec.ts`, describe `navigation des liens
du projet` : deux cartes (titres Alpha, Beta, `liveUrl` renseigné pour rendre la `nav`) ⇒
`aria-label` des `nav` = `['Liens du projet Alpha', 'Liens du projet Beta']` (égalité exacte).

RED confirmé via la commande test du profil le 2026-10-03 20:15, 1 failed / 685 total (tranche 3 ;
échec `expected [ Array(2) ] to deeply equal [ 'Liens du projet Alpha', …(1) ]`).

## Journal des tranches

- **Tranche 1 — les pages routées n'émettent plus de `main`** : GREEN 685 passed / 685 total · refactor : aucun (réindentation prettier du template après retrait du `<main>`)
- **Tranche 2 — l'en-tête est un landmark `banner`** : GREEN 685 passed / 685 total · refactor : aucun
- **Tranche 3 — nom unique des `nav` de carte projet** : GREEN 685 passed / 685 total · refactor : aucun
- **Tranche 4 — le drawer n'émet plus de `banner`** (ajout orchestrateur, risque § Risques
  matérialisé à la vérification) : menu mobile ouvert, le `<header>` de titre du drawer
  (`shared/ui/drawer.ts`) devenait un second `banner` à côté de celui du shell (axe
  `landmark-no-duplicate-banner`, `landmark-unique`). RED `drawer.spec.ts` › `Drawer landmarks`
  (`expected <header …> to have a length of +0 but got 1`, 1 failed / 5) ; GREEN : `<header>` →
  `<div>` (mêmes classes), 686 passed / 686 total · refactor : aucun

## Verify

Le 2026-10-03, sur le build prod de la branche (`pnpm install --frozen-lockfile` puis
`pnpm run build --configuration production` : exit 0 ; `public/sitemap.xml` et `public/rss.xml`
restaurés), servi en statique. Même harnais que le baseline (Playwright 1.58 +
`@axe-core/playwright`, API prod proxifiée, analytics neutralisées).

- **`<main>`** : exactement 1 dans chacune des 15 pages `index.html` prérendues (baseline : 2 sur
  toutes sauf `/offre-site-industrie`). Même ensemble de 16 fichiers HTML qu'au baseline.
- **axe** : **0 violation** sur les 7 URL d'acceptation × thèmes sombre/clair × 1280 / 375 px
  (28/28). En plus : `/projects/candidash` 0 ; menu mobile ouvert sur `/mentions-legales` :
  0 violation, 1 seul `banner`.
- **Visuel** : captures pleine page avant/après (mêmes 28 combinaisons), `pixelmatch`
  seuil 0.1 : **0 pixel différent** sur 28/28, dimensions identiques.
- **Gates** : `pnpm test` 83 fichiers, 686 passed ; `pnpm lint` « All files pass linting » ;
  `prettier --check` OK sur les fichiers source touchés.
- **Hors périmètre, préexistant** : `scrollable-region-focusable` ×8 sur les articles de blog
  (`/blog/<slug>`, blocs `<pre>` défilants non focusables), identique sur `master` ; à traiter
  dans une spec dédiée, comme `admin-layout.ts` (`<main>` imbriqué, route non publique).

## Review code

**Verdict** : APPROVED
**Gates CI locaux** : tests ✅ (`pnpm test`, exit 0, 83 fichiers / 686 passed) / lint ✅ (`pnpm lint`, exit 0, « All files pass linting ») / build ✅ (`pnpm run build --configuration production` exit 0, preuve § Verify ; non rejoué, artefact `dist/` 20:22 cohérent avec le commit 2f0620a : 1 `<main>` sur les 15 `index.html`, `aria-label` de carte uniques). `prettier --check` sur les 20 fichiers source touchés : OK.
**Checks mécaniques** : checker non vendoré : auto-checks joués à la main (`fakeAsync|waitForAsync|flushMicrotasks|toMatchSnapshot|getByTestId|fireEvent` sur les specs du diff : 0 hit ; `innerHTML` : 1 hit, ligne réindentée préexistante de `blog-detail.ts`, hors changement ; réf ADR/§/n° spec dans le code : 0 hit). Profil sans champs archéologie / immutabilité / mutation : règles non vérifiées par profil, tracé.
**Warnings de gate** : aucun (sorties test et lint lues en entier).
**Rendu compilé** : ✅ (`drawer` à sélecteur élément, pas d'attribut ; pixelmatch 0 px sur 28/28 en § Verify)
**Preuve de verify runtime** : ✅ (§ Verify + contre-vérification du reviewer sur le build statique : `/mentions-legales` 1 `main`, 1 `header` de bannière, host `block min-h-svh pt-20 pb-16` ; `/` en 375 px menu ouvert : 1 `main`, dialog hors du `header`, 0 `header` dans le dialog, `nav` de cartes nommées « Liens du projet DashFlow / CandiDash », aucune erreur `NG0`. Erreurs console observées uniquement liées à l'environnement de service statique : `/api/config` 404 et CORS vers l'API prod depuis `localhost`, neutralisées par le proxy du harnais § Verify)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ✅
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ✅

Espaces inline vérifiés sur `git diff -w` : `</a\n>.` et `</a\n>. Vous pouvez` (privacy) collent la ponctuation comme avant ; `</span><span>` (logo du header) sans espace comme avant ; `>politique … GitHub</a\n>` garde l'espace avant « (États-Unis) » ; interpolations `{{ … }}` sans effet. Confirmé par le pixelmatch 0 px.

**Tests notables** :
- ⚠️ `*.spec.ts` (×8 pages) — l'égalité exacte de `classList` de l'host fige des utilitaires Tailwind : tout ajustement d'espacement casse le test sans régression fonctionnelle. Prescrit par le plan comme garde-fou de layout ; à alléger plus tard si le coût se fait sentir.
- ✨ `header.spec.ts:183` — le dialog est vérifié hors du `header` menu ouvert : épingle exactement le choix « `<header>` plutôt que `role` sur l'host ».
- ✨ `drawer.spec.ts:122` — couvre le second `banner` découvert à l'axe (tranche 4), invisible au prérendu.
