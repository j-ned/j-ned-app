---
type: intake-audit
---

# Intake audit — repo entier (angular-portfolio-app)

## Description

Audit d'entrée du scope **repo** (repo entier : tout `src/`).
Déclenché le 2026-06-06 via `/aak-audit`. Aucun diff : la portée est ce scope.

## Intake audit

**Scope** : repo entier (`src/` — 173 fichiers `.ts`, dont 24 `*.spec.ts`, ~11,9k LOC)
**Date** : 2026-06-06
**Outils exécutés** : `pnpm audit --prod` ✅ | `madge --circular` ✅ | `knip` ✅ | `depcheck` ✅
**CI auditée** (dim 10, GitHub Actions) : N/A (aucun workflow GitHub Actions — `.github/workflows/` absent)
**Gates CI locaux** (sanity check, cache invalidé via `ng cache clean` + `rm -rf node_modules/.vite` au préalable) : tests ✅ (203/203) — lint ❌ (41 erreurs, 4 warnings) — build ✅ (bundle SSR généré)
**Candidats hors-périmètre écartés** : N/A (scope-repo, pas de manifeste figé)

### Vue d'ensemble

`angular-portfolio-app` est le **front Angular 21 (SSR, zoneless implicite)** d'un portfolio full-stack : vitrine publique (home, profile/about, projects, cv, contact) + back-office admin protégé (auth 2FA, dashboard, analytics Chart.js, CRUD projets/messages/CV). Le code est globalement **de très bonne facture** : architecture EAK hexagonale par feature (`domain`/`infra`/`application`) tenue avec un **domaine pur strictement sans import Angular** (vérifié), **zéro `any`**, **zéro `interface`**, **zéro `NgModule`**, **zéro `*ngIf`/`*ngFor`**, **OnPush sur 44/44 composants**, **`ngSrc` sur 100 % des `<img>`**, **aucun cycle de dépendance** (madge), **aucune CVE** (`pnpm audit --prod`), **aucun TODO/FIXME** résiduel. Réactivité moderne (signals, `resource()`, `rxResource()`, `linkedSignal`), `takeUntilDestroyed` systématique sur les `subscribe` manuels de composants.

La dette se concentre sur **trois axes**. (1) **Gate lint cassée** : 40 composants ont un sélecteur sans préfixe `app-` (`about`, `about-hero`, `projects`, `project-card`, `page-not-found`…) — la convention du profil (`prefix: app`) est violée et `pnpm lint` sort en erreur. (2) **La feature `admin`** porte les hotspots et la dette : god-components (`admin-analytics.ts` 705 LOC, `two-factor-setup.ts` 618 LOC, `admin-column.ts` 566 LOC / 10 classes dans un fichier), **aucune spec** malgré un churn élevé. (3) **Dead code et indirections spéculatives** : module `shared/calendar` quasi mort, use-case `submit-contact-form` mort (et la validation email qu'il porte est de fait contournée), classes de colonnes admin et factory CRUD jamais consommées, ~38 barrels `index.ts` qui contredisent la règle anti-barrel de `CLAUDE.md`.

Note transverse : `CLAUDE.md` décrit un **monorepo full-stack** (NestJS, Drizzle, Zod, `apps/api/**`) alors que **ce repo est front-only** (aucun backend dans l'arbre) — drift de doc à clarifier (dim 9).

### Pistes d'enquête prioritaires (10 fichiers, nommés)

1. `src/app/features/admin/application/admin-analytics.ts` — 705 LOC, 8 `resource()`, 0 spec, churn 16. God-component non testé.
2. `src/app/features/auth/application/two-factor-setup.ts` — 618 LOC, parcours sécurité critique, template massif.
3. `src/app/features/admin/application/components/admin-column.ts` — 566 LOC, 10 classes dans 1 fichier, 4 exportées mortes.
4. `src/app/app.config.ts` — churn 33, câblage DI/SEO/tracking, 2 `subscribe` app-lifetime + `beforeunload` à valider.
5. `src/app/features/home/application/home.ts` — top churn (34), aucune spec.
6. `src/app/layout/components/header/header.ts` — 212 LOC, churn 31, aucune spec.
7. `src/app/features/contact/application/contact-form.ts` — 363 LOC, churn 28, frontière de validation.
8. `src/app/features/contact/domain/use-cases/submit-contact-form.use-case.ts` — use-case mort + validation email contournée.
9. `src/app/shared/calendar/` (`french-date.ts`, `french-holidays.ts`, `relative-time.ts`) — module majoritairement dead-export.
10. `src/app/features/admin/application/admin-projects.ts` — 296 LOC, churn 18, 0 spec, upload image + Result.

### Synthèse (classée par impact)

1. **F001** — Gate `pnpm lint` cassée : 41 erreurs (40 sélecteurs sans préfixe `app-` + 1 méthode vide). Bloque tout merge propre.
2. **F010** — Feature `admin` non testée (admin-analytics/dashboard/messages/projects) malgré churn et complexité élevés.
3. **F004** — Violation de la règle EAK : la couche `application` importe `infra` en direct (5 sites, surtout `AuthStore`).
4. **F006** — God-components : `admin-analytics` 705, `two-factor-setup` 618, `admin-column` 566 LOC.
5. **F007** — `admin-column.ts` empile 10 classes dans un fichier (viole « un concept par fichier ») dont 4 mortes.
6. **F008** — Use-case `submit-contact-form` mort ET sa validation email de fait contournée par l'appel direct au gateway.
7. **F003** — ~38 barrels `index.ts` contre la règle anti-barrel (tree-shaking) de `CLAUDE.md`.
8. **F009** — Module `shared/calendar` quasi entièrement dead-export (seul `relativeTime` consommé).
9. **F013** — `CLAUDE.md` décrit un monorepo NestJS/Drizzle ; le repo est front-only → drift de doc.
10. **F014** — Aucune CI : gates `test`/`lint`/`build` existent en local, aucun workflow ne les exécute.

### Légende des catégories (le compte rendu peut être transmis à un tiers sans accès au contrat d'audit)

**Catégorie** (dimension d'audit) : 1 Délitement architectural · 2 Érosion de la cohérence · 3 Dette de types et contrats · 4 Dette de tests · 5 Dette de dépendances et configuration · 6 Performance et gestion des ressources · 7 Gestion des erreurs et observabilité · 8 Sécurité · 9 Dérive de la documentation · 10 Dette de CI/CD et automatisation.
**Sévérité** : Critique (casse prod / sécurité / régression silencieuse) · Élevée (ralentit le travail courant) · Moyenne (friction modérée) · Faible (cosmétique / pérennité). **Effort** : S ≤ ½ j · M ≤ 2 j · L > 2 j.

### Constats (problèmes actionnables uniquement)

| ID | Catégorie | fichier:ligne | Sévérité | Effort | Description | Recommandation |
| --- | --- | --- | --- | --- | --- | --- |
| F001 | 2 | (40 fichiers) ex. `src/app/features/profile/application/about-hero.ts:8` | Critique | S | `pnpm lint` sort en erreur : 40 sélecteurs sans préfixe `app-` (`about`, `about-*`, `projects`, `project-card`, `page-not-found`) — viole `prefix: app` du profil et casse le gate lint. | Préfixer tous les sélecteurs `app-` (`app-about-hero`, `app-projects`…) et mettre à jour les usages template. |
| F002 | 4 | `src/app/features/auth/application/login.spec.ts:17` | Élevée | S | Méthode `add` vide dans un fake/stub → erreur lint `no-empty-function`. Stub silencieux qui peut masquer un appel attendu non vérifié. | Implémenter le stub (capter l'appel) ou `vi.fn()` ; lève l'erreur lint. |
| F003 | 1 | `src/app/shared/ui/index.ts:1` (+ ~37 autres `index.ts`) | Élevée | M | ~38 barrels `index.ts` alors que `CLAUDE.md` interdit explicitement les barrels (empêchent le tree-shaking). Plusieurs ré-exportent du code mort (cf. F007/F009). | Supprimer les barrels non structurants, importer par chemin direct ; conserver au plus les barrels de frontière de feature si justifiés. |
| F004 | 1 | `src/app/features/auth/application/login.ts:5` ; `two-factor-verify.ts:5` ; `two-factor-setup.ts:17` ; `admin-dashboard.ts:12` ; `contact-form.ts:9` | Élevée | M | La couche `application` importe `infra` en direct (`AuthStore`, `STATIC_CONTACT_INFO`) — viole la règle EAK « `application` ne dépend jamais directement de `infra` » du profil. | Exposer `AuthStore` via un token/contrat de domaine câblé en `app.config.ts`, ou statuer que les stores partagés transverses sont une exception documentée (ADR). |
| F005 | 2 | `src/app/features/admin/application/admin-cv.ts:157` et `:177` | Moyenne | S | Bloc d'extraction de message d'erreur (`err instanceof Error ? … : (err as {error?:{message?}})…`) dupliqué à l'identique sur upload et delete. | Extraire une fonction pure `extractErrorMessage(err): string` partagée (candidate `shared/`). |
| F006 | 1 | `src/app/features/admin/application/admin-analytics.ts:1` | Élevée | L | God-component 705 LOC : template ~360 lignes + 8 `resource()` pour 8 widgets analytics distincts (overview, chart, pages, referrers, browsers, os, countries, projects). Difficile à tester/maintenir. | Découper en sous-composants présentationnels par widget (`app-analytics-*`), garder le smart parent fin. |
| F007 | 1+3 | `src/app/features/admin/application/components/admin-column.ts:1` | Moyenne | M | 566 LOC, 10 classes `AdminCol*` dans un seul fichier (viole « un concept par fichier ») ; 4 (`AdminColMuted:95`, `AdminColMono:138`, `AdminColNumber:180`, `AdminColToggle:495`) sont des exports morts (zéro consommateur, vérifié). | Éclater 1 classe/fichier ; supprimer les 4 classes mortes. |
| F008 | 1+3 | `src/app/features/contact/domain/use-cases/submit-contact-form.use-case.ts:5` | Moyenne | S | Le use-case `submitContactForm` + `isValidEmail` + `InvalidEmailError` est mort : le composant appelle `contactGateway.submitContactForm()` en direct (`contact-form.ts:332`). La validation email front qu'il portait n'est donc **jamais exécutée**. | Soit supprimer le use-case mort, soit brancher le composant dessus si la validation email front est voulue (décision métier — cf. Questions ouvertes). |
| F009 | 1 | `src/app/shared/calendar/french-date.ts:6` ; `french-holidays.ts` ; `relative-time.ts:3` | Moyenne | S | Module `shared/calendar` majoritairement dead-export : `FrenchDatePipe`, `getFrenchHolidays`, `getUnavailableReason`, `isWeekend` sans aucun consommateur (vérifié) ; seul `relativeTime` est utilisé (`admin-dashboard.ts`). | Supprimer les exports/fichiers morts ; ne garder que `relativeTime` (à déplacer hors barrel si c'est le seul survivant). |
| F010 | 4 | `src/app/features/admin/application/admin-analytics.ts` ; `admin-dashboard.ts` ; `admin-messages.ts` ; `admin-projects.ts` ; `home.ts` ; `home-hero.ts` | Élevée | L | Composants à fort churn et/ou complexité sans aucune spec adjacente : tout le back-office `admin` (analytics 705 LOC, projets/messages avec CRUD + upload + Result), `home.ts` (churn 34), `home-hero`. Régressions silencieuses non détectées. | Couvrir en priorité `admin-projects` (CRUD + upload, Result pattern) et `admin-analytics` (calculs dérivés). Builder + PageModel selon le profil. |
| F011 | 4 | `src/app/layout/components/header/header.ts` (212 LOC, churn 31) | Moyenne | M | Le header (212 LOC, 2e fichier le plus modifié du repo) n'a aucune spec — comportement de navigation/menu mobile non testé. | Spec sur l'ouverture du drawer mobile et la navigation. |
| F012 | 2 | `src/app/shared/ui/file-dropzone.ts:16` ; `icon-map.ts:1` ; `crud-http-methods.ts:4` ; `admin-column.ts:15` ; `theme-watcher.ts:6` | Faible | S | Blocs de commentaires JSDoc narratifs multi-paragraphes (listes de comportement, modes d'emploi « Pour ajouter une icône : 1… 2… ») — interdits par la politique commentaires du profil (par défaut aucun ; au plus une ligne de WHY intemporel). Hits du grep d'archéologie (`/**`). | Réduire chaque bloc à ≤ 1 ligne de WHY non-évident, ou supprimer (le QUOI se lit dans le code). Conserver éventuellement la note SSR de `theme-watcher` et la contrainte InputSignal de `admin-column` réduites à une ligne. |
| F013 | 9 | `.claude/CLAUDE.md:264` (section Backend) | Moyenne | S | `CLAUDE.md` documente un monorepo full-stack (NestJS, Drizzle, Zod, `apps/api/src/**`, commandes `pnpm --filter api`, `drizzle-kit`) alors que ce repo est **front-only** (aucun backend dans l'arbre). README évoque aussi `pnpm start:dev` (backend) absent du `package.json` front. | Clarifier : soit scinder la doc backend hors de ce repo, soit marquer explicitement la portée monorepo et la localisation réelle de `apps/api`. |
| F014 | 10 | `.github/workflows/` (absent) | Moyenne | M | Aucune CI : `test`/`lint`/`build` sont définis et exécutables en local (profil) mais aucun workflow ne les fait tourner. Vu que `lint` est actuellement rouge (F001), rien ne l'aurait bloqué. Husky `pre-commit` lance les tests mais ni lint ni build. | Ajouter un workflow GitHub Actions exécutant `pnpm lint && pnpm test && pnpm build` sur PR, actions tierces épinglées sur SHA, `permissions:` least-privilege, cache du store pnpm. |
| F015 | 8 | `src/app/features/home/application/home-hero.ts:43` | Faible | S | `[innerHTML]="highlightedTagline()"` injecte du HTML construit par regex. Source actuelle = donnée statique de confiance (`InMemoryHomeGateway`) et Angular sanitize `[innerHTML]` → risque réel faible. Devient dangereux si `tagline` passe un jour côté backend/CMS sans échappement. | Documenter la confiance de la source ; si `tagline` devient dynamique, basculer sur un rendu sans `innerHTML` (segmentation + `@for` + `<span class="kw">`). |

### Priorités absolues (« si tu ne corriges rien d'autre »)

1. **F001** — Remettre `pnpm lint` au vert (préfixer les 40 sélecteurs en `app-`). C'est le gate cassé qui laisse passer toute la dette ; mécanique, à faire en premier.
2. **F010** — Couvrir le back-office `admin` (commençant par `admin-projects` : CRUD + upload + Result pattern). Surface la plus risquée et la moins testée.
3. **F004** — Trancher la règle EAK `application`→`infra` (token de domaine pour `AuthStore`, ou exception documentée par ADR) avant que le pattern ne se propage.

### Gains rapides (effort faible × sévérité moyenne+)

- [ ] **F002** — Remplir la méthode `add` vide dans `login.spec.ts:17` (lève l'erreur lint).
- [ ] **F007 (partiel)** — Supprimer les 4 classes mortes `AdminColMuted/Mono/Number/Toggle` de `admin-column.ts`.
- [ ] **F009** — Supprimer les exports morts de `shared/calendar` (garder `relativeTime`).
- [ ] **F008** — Supprimer le use-case `submit-contact-form` mort (ou décider de le brancher) — `< 30 min`.
- [ ] **F005** — Factoriser `extractErrorMessage(err)` (2 sites identiques dans `admin-cv.ts`).

### Bonnes pratiques notables (informatif)

- **Domaine pur exemplaire** : `features/*/domain/**` sans aucun import Angular (vérifié) — la règle de dépendance EAK est tenue côté domaine.
- **Discipline réactivité** : OnPush sur 44/44 composants, `ngSrc` sur 100 % des `<img>`, `takeUntilDestroyed` systématique sur les `subscribe` de composants, `resource()`/`rxResource()` privilégiés.
- **Hygiène de base** : zéro `any`, zéro `interface`, zéro `NgModule`, zéro `*ngIf`/`*ngFor`, zéro TODO/FIXME, aucun cycle de dépendance, aucune CVE prod.
- **Gestion d'erreur structurée** : `catch (err: unknown)` typé + feedback toast utilisateur (`admin-cv.ts`), Result pattern et `catchError(() => EMPTY)` sur les flux fire-and-forget.

### Faux positifs assumés (motifs à NE PAS flagger dans ce repo)

- **`subscribe` sans `takeUntilDestroyed` dans `app.config.ts:68` et `:95`** — naïvement un leak ; en réalité ces souscriptions vivent dans des `provideAppInitializer` (SEO, tracking) à **durée de vie application**, jamais détruits. Idem `window.addEventListener('beforeunload', …)` ligne 108. Pas de fuite.
- **`fireAndForget(...).subscribe()` sans cleanup (`http-analytics.gateway.ts:134`)** — POST HTTP one-shot qui **complète** de lui-même (`catchError(() => EMPTY)`), pas un flux long. Pas un leak.
- **`new Subject<void>()` non `complete()` (`http-projects.gateway.ts:23/35`, `http-contact.gateway.ts:51`)** — déclencheurs de refresh dans des gateways `providedIn:'root'` (singletons app-lifetime) alimentant des `shareReplay`. Légitime, pas de fuite.
- **`madge` : 27 fichiers « skipped » / warnings** — artefact de résolution des alias `@core`/`@shared`/`@features` (madge ne lit pas `tsconfig.paths` sans config dédiée), **pas** un défaut de code. Aucun cycle réel détecté.
- **`depcheck` « missing dependencies » (`@core/strategies`, `@features/auth`…)** — ce sont les **alias de chemins TS**, pas des paquets npm manquants. Faux positif intégral de l'outil.
- **`depcheck`/`knip` « unused devDependencies » (`@tailwindcss/postcss`, `postcss`, `tailwindcss`, `@angular/build`, `@angular/compiler-cli`, `tslib`, `lint-staged`, `eslint-plugin-prettier`, `@fortawesome/fontawesome-free`, `@sentry/cli`)** — consommés via build/config/CSS/scripts (Tailwind v4 par PostCSS, builder Angular, `lint-staged` par Husky, FontAwesome par le script de sprite, Sentry CLI par le script sourcemaps) hors graphe d'import TS. Aucune suppression à faire.
- **Absence de `provideZonelessChangeDetection()` explicite** — pourrait sembler une config oubliée ; en Angular 21 le zoneless est le défaut quand `zone.js` est absent (vérifié : pas de dép `zone.js`, pas de polyfills). Comportement correct implicite.
- **`src/styles.css` et `proxy.conf.cjs` listés « unused files » par knip** — `styles.css` est la feuille globale référencée dans `angular.json` (`styles: [...]`), `proxy.conf.cjs` est le proxy du dev-server. Hors graphe d'import, mais bien utilisés.

### Questions ouvertes pour l'équipe

- **Validation email contournée (F008)** : la non-utilisation du use-case `submitContactForm` (et donc de `isValidEmail`) est-elle intentionnelle (la validation est-elle déléguée au `FormControl` Angular et/ou au backend) ou un oubli de câblage ? Le `<form>` a-t-il un `Validators.email` équivalent ?
- **EAK `application`→`infra` (F004)** : `AuthStore` (store partagé vivant en `infra`) consommé depuis `application` est-il une **exception assumée** pour les stores transverses, ou faut-il un contrat de domaine ? À acter en ADR (le repo n'a pas de `docs/adr/`).
- **Barrels (F003)** : la prolifération des `index.ts` est-elle un choix d'ergonomie d'import accepté malgré la règle anti-barrel de `CLAUDE.md`, ou une dérive à corriger ?
- **Découpage admin (F006/F007)** : architecture des god-components admin — relève d'`architect` (re-design du module analytics en sous-composants) ; signalé ici, non re-planifié.
- **Périmètre doc (F013)** : ce repo doit-il porter la doc backend NestJS/Drizzle, ou celle-ci appartient-elle à un repo `apps/api` séparé du monorepo ?
