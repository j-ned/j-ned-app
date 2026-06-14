---
type: intake-audit
---

# Intake audit — repo entier (angular-portfolio-app)

## Description

Audit d'entrée du scope **repo** (repo entier : tout `src/`).
Déclenché le 2026-06-14 via `/aak-audit`. Aucun diff : la portée est ce scope.

## Intake audit

**Scope** : repo entier (tout `src/`, 186 fichiers `.ts` dont 37 specs)
**Date** : 2026-06-14
**Outils exécutés** : `pnpm audit --prod` ✅ (0 CVE) | `madge --circular` ✅ (0 cycle) | `knip` ✅ | `depcheck` ✅
**CI auditée** (dim 10, GitHub Actions) : ✅ `.github/workflows/ci.yml` (job unique `verify`). **N.B.** le profil-projet déclare `aucun workflow GitHub Actions` — **drift de profil** : un workflow existe (ajouté en commit `d64eadc`). Le profil devrait être corrigé (cf. F015).
**Gates CI locaux** : tests ✅ (270 passés / 37 fichiers) · lint ❌ (**1 erreur + 17 warnings**, exit 1) · build ✅ (SSR + 3 routes prerendered)
**Candidats hors-périmètre écartés** : N/A (scope-repo, pas de manifeste figé).

> **⟳ Mise à jour post-audit (2026-06-14)** — décisions prises après remise du rapport :
> - **F001 corrigé** : `project-card.spec.ts:24` passé en `vi.fn()` ; `pnpm lint` repasse à **0 erreur** (16 warnings préexistants, non bloquants). Le gate lint local + hook Husky sont de nouveau verts.
> - **CI GitHub Actions retirée volontairement** : `.github/workflows/ci.yml` **et** `.github/dependabot.yml` sont supprimés (suppression indexée, décision équipe assumée). En conséquence : **F015 et F016 deviennent caducs** (ils reposaient sur une CI désormais absente), et le profil-projet qui déclare « aucun workflow GitHub Actions » redevient **correct** — aucune correction de profil à faire. La mention « CI déjà mûre » (bonnes pratiques) est sans objet. Le cadrage « CI rouge » de F001 ne s'applique plus, mais la correction lint reste légitime (gate local).

### Vue d'ensemble

`angular-portfolio-app` est un **portfolio personnel front-only Angular 21** (zoneless, standalone, signals d'abord), **rendu en SSR avec prerender SSG** de 3 routes publiques (`/`, `/about`, `/projects` en `RenderMode.Prerender` ; `login`/`two-factor`/`admin/**` en `RenderMode.Client`). L'artefact prerendu porte un `<title>` distinct par route et du JSON-LD (6 fichiers HTML avec `application/ld+json`) — **toute recommandation touchant `<head>`/`title`/`meta`/JSON-LD/cycle de vie à effet DOM doit préserver l'exécution serveur** (pas d'API browser-only en remplacement). Le backend (NestJS) vit dans un repo séparé ; deux features (`profile`, `home`) tournent réellement sur des gateways **in-memory câblés en production** (`InMemoryProfileGateway`/`InMemoryHomeGateway` dans `app.config.ts`) — implémentation runtime légitime, pas des fakes de test.

L'organisation est une **Clean Architecture EAK stricte** : 8 features (`admin`, `analytics`, `auth`, `contact`, `cv`, `home`, `profile`, `projects`) en 3 couches `domain`/`infra`/`application`, plus `core/` (auth-store, interceptors, navigation, strategies, theme), `layout/`, `pages/`, `shared/`. La discipline est **remarquablement haute** : zéro `any`, zéro `interface`, zéro `*ngIf`/`*ngFor`, zéro `NgModule`, OnPush explicite sur les 53 composants (correct pour v21 < v22), domaine pur (aucun import Angular en `domain/`), règle de dépendance `application ↛ infra` respectée (ADR-0001 l'a corrigée à la racine), 0 cycle, 0 CVE. La dette résiduelle est **concentrée et superficielle** : un gate CI cassé (lint), quelques god-files admin/auth non testés sur des hotspots, du code mort résiduel, et une dérive de convention sur les barrels `index.ts`.

Hotspots (volume × churn) : `header.ts` (235 LOC, 37 commits), `home.ts` (38 commits), `contact-form.ts` (363 LOC, 32 commits), `app.config.ts` (178 LOC, 36 commits), `two-factor-setup.ts` (618 LOC), `admin-analytics.ts` (456 LOC).

### Pistes d'enquête prioritaires (10 fichiers, nommés)

1. `src/app/layout/components/header/header.ts` — 235 LOC × 37 commits (top churn) et **aucun spec** : zone de dette la plus exposée.
2. `src/app/features/auth/application/two-factor-setup.ts` — 618 LOC, god-file (3 formulaires en un), surface auth sensible.
3. `src/app/features/admin/application/admin-analytics.ts` — 456 LOC, polling 30 s + Chart.js, **aucun spec** composant.
4. `src/app/features/contact/application/contact-form.ts` — 363 LOC × 32 commits, formulaire public.
5. `src/app/app.config.ts` — 178 LOC × 36 commits, câblage central + 3 app-initializers à effets de bord.
6. `src/app/features/home/application/home.ts` — top churn (38), pilote le `@defer` et le scroll-spy, pas de spec dédié.
7. `src/app/shared/icons/icon-map.ts` — 295 LOC, table d'icônes + consommé par le script de build sprite.
8. `src/app/features/admin/application/components/admin-project-inline-form.ts` — 405 LOC, formulaire inline complexe.
9. `src/app/core/auth/auth-store.ts` — singleton de session transverse (ADR-0001), consommé par guard/interceptor/2 features.
10. `src/app/shared/api/crud-http-methods.ts` — factory CRUD candidate dead-code (à confirmer, cf. F009).

### Synthèse (≤ 10 points, classés par impact)

1. **F001** — `pnpm lint` échoue (1 erreur ESLint) ⇒ **la CI est rouge** sur tout push/PR vers `master`.
2. **F002** — `header.ts` (top churn, 235 LOC) n'a **aucun spec** : la zone la plus modifiée du repo n'est pas couverte.
3. **F003** — `admin-analytics.ts` (456 LOC, polling + charts) sans spec composant.
4. **F004** — Deux `firstValueFrom(...).then()` **sans `.catch()`** (`admin-cv.ts`, `header.ts`) : rejet de promesse non géré si l'HTTP du CV échoue.
5. **F005** — 17 warnings ESLint `explicit-function-return-type` non traités (érosion silencieuse de la règle de typage).
6. **F006** — 26 barrels `index.ts` alors que CLAUDE.md interdit explicitement les barrels (tree-shaking) ; knip y trouve des ré-exports morts.
7. **F007** — `two-factor-setup.ts` (618 LOC) : god-file portant 3 formulaires, ordre des propriétés non conforme.
8. **F008** — `home.ts` (top churn) sans spec dédié au composant smart.
9. **F009 / F010** — Code mort confirmé : `crud-http-methods.ts` (factory jamais appelée) et `stats.model.ts` (`SiteStats` sans importeur).
10. **F011** — `theme-watcher.ts` : `MutationObserver` dans un singleton root sans `disconnect()` (poids permanent, impact faible).

### Légende des catégories (OBLIGATOIRE — le compte rendu peut être transmis à un tiers sans accès au contrat)

**Catégorie** (dimension d'audit) : 1 Délitement architectural · 2 Érosion de la cohérence · 3 Dette de types et contrats · 4 Dette de tests · 5 Dette de dépendances et configuration · 6 Performance et gestion des ressources · 7 Gestion des erreurs et observabilité · 8 Sécurité · 9 Dérive de la documentation · 10 Dette de CI/CD et automatisation.
**Sévérité** : Critique (casse prod / sécurité / régression silencieuse) · Élevée (ralentit le travail courant) · Moyenne (friction modérée) · Faible (cosmétique / pérennité). **Effort** : S ≤ ½ j · M ≤ 2 j · L > 2 j.
**`[dep]`** : non applicable ici (scope-repo, pas de manifeste de périmètre).

### Constats (table — PROBLÈMES ACTIONNABLES UNIQUEMENT)

| ID | Catégorie | fichier:ligne | Sévérité | Effort | Description | Recommandation |
| --- | --- | --- | --- | --- | --- | --- |
| F001 ✅ | 10+4 | src/app/features/projects/application/components/project-card.spec.ts:24 | Critique | S | **CORRIGÉ (2026-06-14)** — stub vide remplacé par `vi.fn()`, `pnpm lint` → 0 erreur. _(Cadrage CI initial caduc : CI retirée, cf. MAJ post-audit.)_ `pnpm lint` exit 1 sur erreur `@typescript-eslint/no-empty-function` (`trackProjectClick: () => {}`). | Remplacer le stub vide par `vi.fn()`. **Fait.** |
| F002 | 4 | src/app/layout/components/header/header.ts:1 | Élevée | M | Fichier le plus modifié du repo (37 commits) et 235 LOC, **aucun `header.spec.ts`**. Navigation, toggle thème, chargement CV — logique non régressée par les tests. | Ajouter un spec composant (TestBed + `data-testid`) couvrant nav, toggle thème, état du lien actif et chargement CV. |
| F003 | 4 | src/app/features/admin/application/admin-analytics.ts:302 | Élevée | M | 456 LOC, polling `interval(30_000)` + intégration Chart.js, **aucun spec composant** (seul le domaine pur `analytics-presenter` est testé). | Spec composant : démarrage/arrêt du polling (fake timers runner + `whenStable`, cf. régime zoneless), rendu des KPI, sélection de plage de dates. |
| F004 ✅ | 7 | src/app/features/admin/application/admin-cv.ts:189 | Élevée | S | **CORRIGÉ (2026-06-14)** — `loadCv` passé en `async`/`try-catch` + toast d'erreur (`extractErrorMessage`), cohérent avec `deleteCv`/`uploadCv`. _(Initial : `.then()` sans `.catch()` → rejet non géré, bruit Sentry.)_ | Fait. |
| F004b ✅ | 7 | src/app/layout/components/header/header.ts:229 | Élevée | S | **CORRIGÉ (2026-06-14)** — `loadCvUrl` passé en `async`/`try-catch` + `console.warn` (lien CV optionnel, dégradation gracieuse, convention `admin-projects.ts:224`). _(Initial : `.then()` sans `.catch()`.)_ Mutualisation header/admin-cv dans une facade reste une amélioration possible (non bloquante). | Fait (mutualisation = piste future). |
| F005 | 2 | src/app/features/analytics/domain/analytics-presenter.ts:44 | Moyenne | S | 17 warnings ESLint `explicit-function-return-type` (4 ici en `domain`, 13 en `.spec.ts`). Exit-0 isolément (l'erreur F001 masque le signal), mais érode la règle de typage du repo. | Annoter les types de retour. Envisager de hausser la règle en `error` sur `domain/**` (code de production) une fois F001 résolu, pour que le warning ne soit plus silencieux. |
| F006 | 1+2 | src/app/shared/api/index.ts:1 | Moyenne | M | 26 barrels `index.ts` alors que CLAUDE.md § A11y/SEO/Perf interdit explicitement les barrels (« empêchent le tree-shaking »). knip relève des ré-exports morts (`AdminDashboard`, `authInterceptor`, `Projects`, `createCrudHttpMethods`, icônes…). Drift règle énoncée ↔ réalité. | Trancher : soit acter les barrels comme convention (mettre à jour CLAUDE.md), soit les supprimer au profit d'imports profonds. Dans les deux cas, supprimer les ré-exports morts. |
| F007 | 1 | src/app/features/auth/application/two-factor-setup.ts:435 | Moyenne | M | 618 LOC : un seul composant porte **3 formulaires** (changement de mot de passe, activation 2FA, désactivation 2FA). Au-delà du seuil d'altitude (250 LOC). Ordre des propriétés non conforme (signaux `qrCodeUrl`/`secret`… déclarés après la méthode `changePassword`). | Extraire 3 sous-composants dumb (`password-change`, `tfa-enable`, `tfa-disable`) pilotés par la facade. Réordonner deps → inputs → signals → méthodes. |
| F008 | 4 | src/app/features/home/application/home.ts:1 | Moyenne | S | Composant smart le plus churné (38 commits) sans spec dédié (seul `home-hero-section.spec.ts` couvre un sous-composant). Pilote `@defer`/scroll-spy. | Spec couvrant le binding `bundleResource`, `expertises` dérivé et le déclenchement `eagerSections`. |
| F009 ✅ | 1 | src/app/shared/api/crud-http-methods.ts:16 | Faible | S | **CORRIGÉ (2026-06-14)** — fichier supprimé (`git rm`) + ré-export retiré de `shared/api/index.ts`. _(Initial : factory `createCrudHttpMethods<T>()` jamais appelée, code mort.)_ | Fait. |
| F010 ✅ | 1 | src/app/features/admin/domain/models/stats.model.ts:1 | Faible | S | **CORRIGÉ (2026-06-14)** — fichier supprimé (`git rm`) ; `admin/domain/models/` désormais vide (aucun barrel ne le référençait). _(Initial : type `SiteStats` orphelin, zéro importeur.)_ | Fait. |
| F011 | 6 | src/app/shared/theme/theme-watcher.ts:26 | Faible | S | `new MutationObserver(...)` dans un singleton `providedIn: 'root'` **sans `disconnect()`** ni `DestroyRef`. Vit toute la durée de l'app (impact mémoire faible, mais asymétrique avec `section-visibility.ts` qui, lui, nettoie via `DestroyRef.onDestroy(() => observer.disconnect())`). | Capturer l'observer et `inject(DestroyRef).onDestroy(() => observer.disconnect())` pour la symétrie et la robustesse au HMR/SSR. |
| F012 | 8 | src/app/features/home/application/home-hero.ts:61 | Faible | S | `[innerHTML]="highlightedTagline()"` injecte du HTML construit par `tagline.replace(/(Angular\|NestJS)/g, '<span…>')`. Angular **sanitize** `[innerHTML]` (pas de `bypassSecurityTrust`), donc pas de faille XSS aujourd'hui ; mais le pattern est fragile si `tagline` devient contenu CMS/utilisateur, et mélange présentation et données. | Remplacer par un découpage en template (`@for` sur segments) ou un pipe dédié, sans `innerHTML`. Surveiller si `HomeGateway` passe un jour sur HTTP. |
| F013 | 9 | src/app/features/analytics/domain/analytics-presenter.ts:6 | Faible | S | Blocs de commentaires `/**` narratifs multi-lignes au-delà du WHY intemporel d'une ligne (politique commentaires du profil). Concentrés dans `theme-watcher.ts:6`, `section-visibility.ts:16`, `section-scroller.ts` (plusieurs blocs), `auth-store.ts:24/133`, `crud-http-methods.ts:4`. La majorité des `/**` du repo sont des WHY d'une ligne **conformes** (non flaggés). | Réduire les blocs narratifs à une ligne de WHY intemporel, ou supprimer le QUOI redondant avec le code. |
| F014 | 5 | package.json:64 | Faible | S | knip + depcheck signalent `@fortawesome/fontawesome-free`, `@sentry/cli`, `eslint-plugin-prettier`, `lint-staged` comme non utilisés. À confirmer : `@sentry/cli`/`lint-staged` sont consommés par des scripts (`sentry:sourcemaps`, `lint-staged` config) ⇒ **faux positifs** ; `@fortawesome/fontawesome-free` mérite vérification (consommé via le script de build sprite ?). | Vérifier la consommation réelle de `@fortawesome/fontawesome-free` (script `icons:build`) ; ne retirer que ce qui est prouvé non consommé. Garder `@sentry/cli` et `lint-staged`. |
| ~~F015~~ ⊘ | 9 | .claude/project-profile.md:184 | Faible | S | **CADUC (2026-06-14)** — la CI a été retirée volontairement ; le profil « aucun workflow GitHub Actions » est donc **correct**, plus de drift à corriger. _(Constat initial : drift profil ↔ `ci.yml` existant.)_ | Sans objet : aucune modification de profil. |
| ~~F016~~ ⊘ | 10 | .github/workflows/ci.yml:38 | Faible | M | **CADUC (2026-06-14)** — workflow `ci.yml` supprimé (décision équipe) ; l'optimisation `paths-ignore` / épinglage SHA ne s'applique plus à un fichier retiré. _(Constat initial : pipeline `verify` sans filtre `paths`.)_ | Sans objet. |

### Priorités absolues (« si tu ne corriges rien d'autre »)

1. **F001** — Débloquer la CI : corriger l'erreur ESLint `no-empty-function` dans `project-card.spec.ts:24` (stub `() => {}` → `vi.fn()`). Tant qu'elle persiste, **chaque PR est rouge** et le gate de merge ne protège plus rien.
2. **F002 / F003** — Couvrir les deux hotspots non testés (`header.ts`, `admin-analytics.ts`). `header.ts` cumule le plus de churn du repo sans filet : c'est là que les régressions passeront inaperçues.
3. **F004 / F004b** — Gérer les rejets de promesse du chargement CV (`.then()` sans `.catch()`) : un backend CV indisponible doit produire une erreur observable, pas un échec muet.

### Gains rapides (effort faible × sévérité moyenne+)

- [x] F001 — Remplacer `trackProjectClick: () => {}` par `vi.fn()` dans `project-card.spec.ts:24`. **Fait (2026-06-14)**, `pnpm lint` → 0 erreur.
- [x] F009 — Supprimé `crud-http-methods.ts` + ré-export barrel. **Fait (2026-06-14)**.
- [x] F010 — Supprimé `stats.model.ts` (`SiteStats` orphelin ; dossier `admin/domain/models/` vidé). **Fait (2026-06-14)**.
- [x] ~~F015~~ — Caduc : CI retirée volontairement, profil déjà correct (aucune correction).
- [x] F004/F004b — `loadCv` (admin-cv) → `async`/try-catch + toast ; `loadCvUrl` (header) → `async`/try-catch + `console.warn` (dégradation gracieuse). **Fait (2026-06-14)**.

### Bonnes pratiques notables (informatif)

- **Discipline de types et de templates exemplaire** : 0 `any`, 0 `interface`, 0 `*ngIf`/`*ngFor`, 0 `NgModule` sur 186 fichiers — l'écosystème Angular 21 moderne est appliqué sans exception.
- **Règle de dépendance EAK tenue à la racine** : 0 import `application → infra`, domaine pur (0 import Angular en `domain/`), ADR-0001 a résolu le finding F004 historique par relocalisation plutôt que par dérogation.
- **SEO/prerender soigné** : 3 routes SSG avec `<title>` distinct par route et JSON-LD émis dans l'artefact prerendu ; `RenderMode.Client` réservé aux routes authentifiées sans intérêt SEO.
- **Nettoyage des ressources correct là où il compte** : `section-visibility.ts` (IntersectionObserver) et `admin-analytics.ts` (polling RxJS) nettoient via `DestroyRef`/`takeUntilDestroyed` ; seul le singleton root `theme-watcher` fait exception (F011, impact faible).
- ~~**CI déjà mûre sur les fondamentaux**~~ — _sans objet (2026-06-14) : la CI GitHub Actions a été retirée volontairement (cf. MAJ post-audit). Le repo n'a plus de CI ; ce constat informatif ne tient plus._

### Faux positifs assumés (BLOQUANT NON-VIDE)

- **`InMemoryProfileGateway` / `InMemoryHomeGateway` câblés dans `app.config.ts`** — pourraient sembler des fakes de test fuités en production. En réalité ce sont l'**implémentation runtime légitime** des features `profile`/`home` (pas de backend pour elles), explicitement actée par le profil-projet (§ Tests). Leurs specs dédiés ne sont **pas** rejetés. Ne pas flagger.
- **`uniqueIcons` (icon-map.ts) signalé « unused export » par knip** — consommé hors `src/` par le script de build sprite `scripts/build-icons.mjs` (générateur), confirmé par le commentaire « Liste dé-dupliquée pour le script de génération du sprite ». Outil statique aveugle au consommateur build-time. Conserver.
- **`relativeTime` (fonction) signalée par knip** — la fonction est utilisée dans son propre fichier par le `@Pipe({ name: 'relativeTime' })` (ligne 23), pipe employé dans `admin-dashboard.ts`. Seul le **ré-export barrel** est mort (couvert par F006), pas la fonction. Pas de suppression de la fonction.
- **`@sentry/cli` et `lint-staged` signalés « unused devDependencies » par depcheck** — consommés respectivement par le script `sentry:sourcemaps` et par la config `lint-staged` du `package.json` (hook Husky). depcheck ne lit pas ces consommations non-`import`. Ne pas retirer.
- **`depcheck` « Missing dependencies » (`@features/*`, `@core/*`, `@shared/*`)** — ce sont les **alias de chemins TS** (`tsconfig` `paths`), pas des paquets npm manquants. Faux positif intégral de l'outil ; aucune action.
- **`OnPush` explicite sur les 53 composants** — redondant en théorie sur un futur v22 (défaut framework), mais **correct et requis en v21** (cf. profil : bascule du défaut = v22). Ne pas le flagger comme « redondant ».
- **Reactive Forms (`FormGroup`/`FormControl`) sur 5 composants** — pourrait sembler « non migré vers Signal Forms ». Signal Forms n'est stable qu'en **v22** ; le repo est en **v21** ⇒ Reactive Forms est le choix conforme. Ne pas recommander la migration ici.
- **Les `import().then(m => m.X)` dans `app.routes.ts` / `*.routes.ts`** — `.then()` sans `.catch()` mais ce sont des **lazy-loads de route standard Angular** (le router gère l'échec via `@error`/navigation), pas le motif fautif de F004. Ne pas confondre avec les `firstValueFrom().then()`.

### Questions ouvertes pour l'équipe

- **Barrels `index.ts` (F006)** : choix intentionnel d'ergonomie d'import, ou dette à résorber ? CLAUDE.md les interdit ; il faut trancher (mettre à jour la doc OU supprimer les barrels) plutôt que laisser la contradiction.
- **God-file `two-factor-setup.ts` (F007)** : le découpage en 3 sous-composants relève d'une décision d'architecture (`architect`) — intentionnel pour garder la surface 2FA cohérente, ou à refactorer ?
- **Règle ESLint `explicit-function-return-type` (F005)** : la garder en `warning` (tolérée) ou la hausser en `error` sur le code de production (`domain/**`, `application/**`) une fois F001 résolu ?
- **Result pattern** : prescrit par CLAUDE.md pour les erreurs métier mais réellement employé seulement dans `http-contact.gateway.ts` ; les autres gateways propagent l'erreur RxJS. Convention à généraliser ou à assouplir dans la doc ?
