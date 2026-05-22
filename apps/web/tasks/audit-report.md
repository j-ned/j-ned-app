# Audit complet `.claude/CLAUDE.md` — Rapport priorise

Date : 2026-05-22 — Scope : 169 fichiers `src/**/*.{ts,html,css}` audites par 4 agents paralleles contre l'ensemble des regles definies dans `.claude/CLAUDE.md`.

Le rapport est organise **par theme transversal** plutot que par fichier : la meme regle est violee dans plusieurs zones, regrouper par theme rend le plan d'action lisible et permet de batcher les corrections.

---

## CRITIQUE — Violations de regles architecturales / nommage 2025

### C1. Dossier `infrastructure/` au lieu de `infra/`

CLAUDE.md (section Clean Architecture) impose `infra/`. Le projet utilise `infrastructure/` dans **6 features** :

- `src/app/features/auth/infrastructure/`
- `src/app/features/admin/` (pas d'infra/ — voir C9)
- `src/app/features/profile/infrastructure/`
- `src/app/features/home/infrastructure/`
- `src/app/features/projects/infrastructure/`
- `src/app/features/contact/infrastructure/`

**Impact** : tous les imports `../infrastructure` (admin-layout, application/*, app.config.ts, app.ts, app.routes.ts, etc.).

**Action** : `git mv infrastructure infra` dans chaque feature + sed sur tous les imports.

### C2. Classes suffixees `Service` (interdit par convention 2025)

CLAUDE.md table : "Nommage des classes -> comportement, pas type. `AuthService` -> `AuthManager` / `SessionHandler` / `AuthStore`."

| Fichier actuel | Classe actuelle | Renommage propose |
|---|---|---|
| `src/app/features/auth/infrastructure/auth.service.ts` | `AuthService` | `AuthStore` (gere `_currentUser` signal) |
| `src/app/shared/seo/seo.ts` | `SeoService` | `Seo` ou `SeoMetaManager` |
| `src/app/shared/ui/toast.service.ts` | `ToastService` | `ToastStore` ou `ToastNotifier` |

**Action** : renommer classe + fichier (drop `.service.ts`) + tous les imports (login, two-factor-*, admin-layout, admin-dashboard, admin-cv, auth.guard, auth.interceptor, app.ts, app.config.ts, ui-toast, error-toast.interceptor).

### C3. Suffixes de fichiers interdits (`.service.ts`, `.guard.ts`, `.interceptor.ts`, `.pipe.ts`, `.component.ts`)

CLAUDE.md : "Fichier : kebab-case, sans suffixe `.component`". Seuls `*.model.ts`, `*.gateway.ts`, `*.use-case.ts`, `*.adapter.ts` sont autorises.

| Fichier actuel | Renommage |
|---|---|
| `auth/infrastructure/auth.service.ts` | `auth/infra/auth-store.ts` |
| `auth/infrastructure/auth.guard.ts` | `auth/infra/auth-guard.ts` |
| `auth/infrastructure/auth.interceptor.ts` | `auth/infra/auth-interceptor.ts` |
| `core/interceptors/error-toast.interceptor.ts` | `core/interceptors/error-toast.ts` |
| `shared/ui/toast.service.ts` | `shared/notifications/toast-store.ts` (cf. C8) |
| `shared/calendar/french-date.pipe.ts` | `shared/calendar/french-date.ts` (classe garde `FrenchDatePipe`) |

### C4. Features metier dans `shared/`

CLAUDE.md : "`shared/` Composants UI, directives, pipes reutilisables (**pas de services**)."

- `src/app/shared/cv/` — gateway + http-cv (upload/delete) = feature CV complete.
- `src/app/shared/analytics/` — gateway + 13 methodes (track, beacon, getOverview) = feature analytique.

**Action** : creer `features/cv/{domain,infra}/` et `features/analytics/{domain,infra}/`, deplacer les fichiers, mettre a jour `app.config.ts` (providers) et tous les imports.

### C5. Violation de la regle de dependance Clean Architecture

`src/app/shared/cv/cv.gateway.ts:3` :
```typescript
import type { CvInfo } from '@features/admin/domain/models/cv.model';
```

`shared/` ne doit **jamais** importer depuis `features/`. Le modele `CvInfo` doit vivre dans `features/cv/domain/models/cv.model.ts` une fois la migration C4 effectuee. Idem `http-cv.gateway.ts:7` et `http-cv.gateway.spec.ts:9`.

### C6. Gateway = `type` au lieu de `abstract class`

CLAUDE.md : "Gateway = abstract class (= injectable sans token)." Le projet utilise un pattern mixte (type + InjectionToken + factory throw). 5 occurrences :

- `features/profile/domain/gateways/profile.gateway.ts:13` — `type ProfileGateway` + `PROFILE_GATEWAY`
- `features/home/domain/gateways/home.gateway.ts:4` — `type HomeGateway` + `HOME_GATEWAY`
- `features/contact/domain/gateways/contact.gateway.ts:8` — `type ContactGateway` + `CONTACT_GATEWAY`
- `features/projects/domain/gateways/projects.gateway.ts` — `type ProjectsGateway`
- `features/auth/domain/gateways/auth.gateway.ts:16-21` — **doublon** : `abstract class AuthGateway` ET `AUTH_GATEWAY = new InjectionToken<AuthGateway>(...)`

**Action** : convertir tous les gateways en `abstract class`, supprimer les `InjectionToken` correspondants, mettre `useClass:` directement contre la classe abstraite. Les implementations infra passent de `implements XGateway` a `extends XGateway`.

### C7. Use cases absents (couplage application → infra)

`features/profile/` et `features/home/` n'ont **aucun** `domain/use-cases/`. Les composants injectent directement le gateway et appellent ses methodes — violation de la regle de dependance ("Application depend de Domain (utilise les use cases)").

`features/projects/domain/use-cases/get-featured-projects.use-case.ts:5` est un wrapper passe-plat sans logique : soit ajouter de la logique metier, soit le supprimer (YAGNI).

**Action** :
- Creer `GetProfileInfoUseCase`, `GetBiographyUseCase`, `GetHighlightsUseCase`, `GetWhatIDoUseCase`, `GetWhatISeekUseCase`, `GetDiplomasUseCase`, `GetStackUseCase` pour profile.
- Creer `GetHomeBundleUseCase`, `GetHeroUseCase`, `GetFeaturedProjectsUseCase`, `GetHighlightsUseCase` pour home.
- Decider : conserver `GetFeaturedProjectsUseCase` (l'enrichir) ou le supprimer.

### C8. Composant `ui-toast` (shared/ui) injecte un service → casse la regle Dumb

`src/app/shared/ui/ui-toast.ts:111` :
```typescript
protected readonly toastService = inject(ToastService);
```

CLAUDE.md : "shared/ui : composants UI doivent etre Dumb (input/output uniquement, **ZERO service injecte**)."

**Action** : passer `messages` via `input<readonly ToastEntry[]>()` et emettre `dismiss = output<number>()`. Le wiring se fait dans le composant qui rend `<ui-toast>` (App ou Layout). Alternative : sortir `ui-toast` de `shared/ui/` vers `shared/notifications/` (qui peut, lui, etre couple a `ToastStore`).

### C9. `isPlatformBrowser` au lieu de `afterNextRender` (anti-pattern explicite)

CLAUDE.md : "`afterNextRender` / `afterRenderEffect` sont no-op cote serveur → supprime le besoin de `isPlatformBrowser()` autour du code DOM."

- `features/projects/application/projects.ts:88-89,128` — `if (isPlatformBrowser(this.platformId)) { this.document.defaultView?.scrollTo(...) }`
- `shared/analytics/http-analytics.gateway.ts:26` — partiellement justifie (HTTP/beacon), mais la branche `document.referrer` (l.35) peut etre traitee via `afterNextRender`.

**Action** : envelopper dans `afterNextRender({ write: () => window.scrollTo(...) })` declenche depuis un `effect()` qui ecoute `currentPage`.

### C10. Methodes evenement-style (`onSubmit`, `onClick`, `onCreate`...)

CLAUDE.md : "Nommage des methodes -> action, pas evenement. `submitContact()` pas `handleClick()`/`onSubmit()`."

| Fichier | Methode | Renommage |
|---|---|---|
| `auth/application/login.ts:128` | `onSubmit()` | `authenticate()` ou `submitLogin()` |
| `auth/application/two-factor-verify.ts:102` | `onSubmit()` | `verifyCode()` |
| `auth/application/two-factor-setup.ts` | `onSubmit()` × 3 (password, enable, disable) | `changePassword()` / `enableTwoFactor()` / `disableTwoFactor()` |
| `admin/application/admin-projects.ts:211, 246` | `onCreate()`, `onUpdate()` | `createProject()` / `updateProject()` |
| `admin/application/admin-cv.ts:134` | `onFileSelected()` | `selectCvFile()` |
| `contact/application/contact-form.ts:341` | `onSubmit()` | `submitContact()` |
| `app.ts:54` | `onCtrlL()` | `openAdminShortcut()` ou similaire |

### C11. `@defer` sans `@placeholder`/`@error`

`features/profile/application/about.ts:43-65` — `@defer (hydrate on viewport)` sur sections under-the-fold sans aucun bloc fallback.

CLAUDE.md : "Pas de `@error` -> le placeholder reste affiche eternellement si le chunk echoue." Risque CLS + UX cassee.

**Action** : ajouter `@placeholder` (dimensions stables pour eviter CLS) + `@error` (avec retry).

### C12. Use case `throw` au lieu de Result pattern / Observable error

`features/contact/domain/use-cases/submit-contact-form.use-case.ts:15` :
```typescript
if (!isValidEmail(data.email)) { throw new Error('Invalid email format'); }
```

CLAUDE.md : "Result pattern pour les erreurs metier : `{ success: true; data: T } | { success: false; error: E }`." Lancer une exception synchrone dans une fonction qui renvoie un `Observable` rompt la propagation reactive.

**Action** : retourner `throwError(() => new InvalidEmailError())` ou refactorer en `Result<ContactConfirmation, ContactError>`.

### C13. Couplage domain → UI (langue francaise dans le domain)

`features/projects/domain/use-cases/filter-projects.use-case.ts:4` :
```typescript
if (filter === 'Tous') return projects;
```

Le domain framework-agnostic ne doit pas connaitre la langue UI. Exposer une constante `FILTER_ALL = '__ALL__'` ou laisser le composant transmettre `undefined` pour "tous".

### C14. Memory leak `URL.createObjectURL` dans un `computed`

`shared/ui/file-dropzone.ts:158-168` :
```typescript
previewSrc = computed(() => { ... return URL.createObjectURL(f); });
```

Un `computed` doit etre **pur**. Chaque recalcul alloue un nouveau blob URL sans revocation. Fuite garantie a chaque selection.

**Action** : `_previewSrc = signal('')`, `effect()` qui regenere a chaque changement de `currentFile()` avec `URL.revokeObjectURL(prev)`, plus `inject(DestroyRef).onDestroy(() => URL.revokeObjectURL(current))`.

### C15. `setTimeout` non nettoye + non SSR-safe (toast)

`shared/ui/toast.service.ts:24` — `setTimeout(() => this.dismiss(entry.id), entry.life)` sans `clearTimeout` si dismiss manuel. Cote serveur, declenche `setTimeout` qui empeche la deshydratation.

**Action** : stocker l'`id` du timer dans la map des messages, `clearTimeout` dans `dismiss()`/`clear()`, encadrer par `isPlatformBrowser()` ou utiliser `afterNextRender`.

### C16. HTML semantique : `role="menu"` invalide

`features/projects/application/projects.ts:45` — `<nav role="menu">` avec enfants `<button>` non-`menuitem`. Casse la semantique ARIA et le comportement clavier attendu.

**Action** : retirer `role="menu"` (le `<nav aria-label="Filtres">` suffit), ou refactorer en `role="tablist"` + `role="tab"` + `aria-selected` (puisque c'est un filtre).

### C17. Methodes/getters dans templates → doivent etre `computed()`

CLAUDE.md : "JAMAIS de methodes/getters dans templates -> `computed()`."

- `admin/application/admin-layout.ts:85,89,92` — `item.badge()!` (badge est une fonction sur l'objet)
- `admin/application/components/admin-column.ts:220, 259` — `[class]="badgeClass(...)"`
- `admin/application/admin-dashboard.ts:134, 202-204` — `formatTime(date)` dans template → faire un `Pipe relativeTime`
- `home/application/home-projects.ts:26, 53-57` — `projectsSection()` recree un objet a chaque CD → `protected readonly projectsSection = { ... } as const`

---

## IMPORTANT — Perf, a11y, signals mal utilises

### I1. Visibilites manquantes (`protected` sur membres template)

CLAUDE.md : "`protected` pour les membres utilises dans le template." Occurrences relevees :

- `admin/application/admin-layout.ts:146-175` — `authService` non `protected`
- `admin/application/admin-dashboard.ts:171` — `authService` non `protected`
- `admin/application/admin-cv.ts:96, 99, 111-114` — `cv`, `downloadUrl`, `formattedSelectedSize` non `protected`
- `admin/application/admin-projects.ts:177-179` — `selectedCategory`, `editingId`, `showNewForm` non `protected`
- `admin/application/admin-analytics.ts:390-392` — `dateRange`, `activeVisitors` non `protected`
- `contact/application/contact-form.ts:307, 309` — `isSubmitting`, `form` non `protected`
- `projects/application/components/project-card.ts:131, 133` — `project` (input OK), `trackClick` doit etre `protected`

### I2. Imports barrel (`index.ts`)

CLAUDE.md : "Eviter les barrel imports (`index.ts`) -> empechent le tree-shaking." Le projet en utilise massivement : `@shared/ui`, `@shared/cv`, `@shared/icons`, `@shared/calendar`, `@shared/analytics`, `@shared/api`, `@features/*/{domain,infra,application}`, `@layout`.

**Note** : la regle est explicite mais touche **toute** la base. Decision a prendre : tolerer (status quo) ou supprimer en deux passes (1. inliner les imports, 2. supprimer les `index.ts`).

### I3. Ordre des proprietes non respecte

CLAUDE.md : `inject() > inputs/outputs > queries > signals/computed > methods`.

- `auth/application/two-factor-setup.ts:380-563` — methodes intercalees entre `pwdForm` et `tfaForm`
- `features/home/application/home-projects.ts:50-51` — input apres alias

### I4. Composant qui viole la SRP

`auth/application/two-factor-setup.ts:34` — un seul composant gere **3 formulaires** (password change, 2FA enable, 2FA disable) + 3 etats d'erreur. Decouper en `password-change-form`, `two-factor-enable`, `two-factor-disable`.

### I5. `effect()` mal utilises ou inutiles

- `admin/application/admin-cv.ts:202-206` — `firstValueFrom(...).then(...)` sans gestion d'erreur, promesse non-attendue depuis `constructor`. Migrer vers `rxResource`.
- `admin/application/admin-cv.ts:116-118` — appel IO `loadCv()` dans `constructor` — anti-pattern.
- `admin/application/components/admin-table.ts:156-164` — `queueMicrotask` pour init sort = fragile, depend du timing. Remplacer par `linkedSignal()`.
- `admin/application/components/admin-project-inline-form.ts:271-292` — `effect()` qui `patchValue()` sur form. Pas un signal-write, mais porte ouverte au timing imprevisible.
- `admin/application/admin-messages.ts:108`, `admin-projects.ts:189-190` — `[...(resource.value() ?? [])]` clone defensif inutile, declenche re-renders.
- `admin/application/admin-dashboard.ts:174-180` — `formattedDate = signal(new Date(...))` pour une valeur statique. Remplacer par constante.
- `shared/ui/ui-drawer.ts:114-118` — `effect()` qui mute `body.style.overflow` → `afterRenderEffect({ write: ... })`.
- `shared/ui/ui-drawer.ts:120-122` — `afterRenderEffect` sans phase explicite (`focus()` declenche layout).

### I6. RxJS subscribe imperatif sans nettoyage

- `auth/infrastructure/auth.service.ts:140-152` — `restoreSession()` dans service root, `takeUntilDestroyed` present mais `destroyRef` ne se declenche jamais.
- `shared/analytics/http-analytics.gateway.ts:130-135` — `fireAndForget` `.subscribe()` sans `takeUntilDestroyed` (root singleton).
- `app.config.ts:48-54, 64-83, 85-119` — `prefetchHomeBundle`, `initializeSeo`, `initializeTracking` font des subscribes sans nettoyage. Acceptable car app-initializer one-shot, mais ajouter `catchError(() => EMPTY)` au minimum.
- `layout/components/header/header.ts:212` — `firstValueFrom().then()` pour `loadCvUrl()` → preferer `toSignal()`.

### I7. HTML semantique : doubles `<main>` potentiels

- `projects/application/projects.ts:23` — `<main>` dans une page rendue dans `<router-outlet>` qui peut deja etre dans `<main>` du layout.
- `profile/application/about.ts:24-70` — meme probleme, plus classes de carte appliquees a `<main>` (incorrect semantiquement).
- `pages/page-not-found.ts:10` — meme remarque.

**Action** : auditer `App` template + decider : soit `<main>` au niveau page (et layout n'en a pas), soit l'inverse. Coherent partout.

### I8. `<section>` sans `aria-labelledby`

CLAUDE.md : "Chaque `<section>` doit avoir un heading (`aria-labelledby`)."

- `projects/application/projects.ts:26`
- `contact/application/contact-form.ts:33`
- (a verifier partout — pattern recurrent)

### I9. `<hgroup>` deprecie

- `profile/application/about-hero.ts:33-38`
- `home/application/home-hero.ts:43`

Remplacer par `<h1>` + `<p>` adjacents.

### I10. `track $index` ou `track item` sur listes mutables

CLAUDE.md : "ID unique prefere. Jamais `$index` sur liste mutable."

- `profile/application/about-hero.ts:65` — `track social.label` → `track social.id`
- `profile/application/about-highlights.ts:18` — `track highlight.title` → `track highlight.id`
- `profile/application/about-stack.ts:21` — `track tech.name` → `track tech.id`
- `profile/application/about-what-i-do.ts:18` — `track item.title` → `track item.id`
- `profile/application/about-journey.ts:19` — `track paragraph` (string) → `track $index` acceptable seulement si liste immuable
- `layout/components/header/header.ts:46` — `track item` → `track item.href`

### I11. `private readonly` manquant sur deps injectees

- `features/home/application/home-projects.ts:49` — `private router = inject(Router)` sans `readonly`
- `shared/seo/seo.ts:17-19` — `private title`, `private meta`, `private document` sans `readonly`
- Pattern recurrent : prive sans prefix `_` (CLAUDE.md : "Prefixer les membres prives avec `_`").

### I12. Doublon `initializeAuth` (app.config) + `restoreSession` (app.ts:33-42)

Boot de session execute deux fois. Consolider dans `initializeAuth` uniquement, supprimer du constructor de `App`.

### I13. Couches manquantes / Adapters

- `features/projects/infrastructure/gateways/http-projects.gateway.ts:8-12` — `resolveProject` est defini en module (pure), devrait etre `infra/projects.adapter.ts` (convention `*.adapter.ts`).
- `features/projects/infrastructure/gateways/http-projects.gateway.ts:23,40,55,...` — URL `_sort=order` hardcodee 5 fois. Extraire en constante ou helper.

### I14. SVG inline au lieu de `<app-icon>`

Incoherent avec le sprite SVG centralise du projet.

- `admin/application/admin-projects.ts:86-98` — `<svg>` inline sans `aria-hidden`
- `shared/ui/file-dropzone.ts:46-58, 83-94, 118-131` — 3 SVG inline

### I15. Pattern `Ui*` redondant sur classes shared/ui

CLAUDE.md : nom de classe semantique sans prefix de techno. Si l'intent etait de namespacer, le dossier `shared/ui/` suffit deja.

- `UiButton` → `Button` (+ selector `app-button` au lieu de `app-ui-button`)
- `UiDrawer` → `Drawer`
- `UiToast` → `Toast`

(A faire en meme temps que les renamings C2/C3.)

### I16. Constante UI codee en dur dans template

- `shared/ui/paginator.ts:9` — `const ELLIPSIS = -1;` defini mais template (l.26) compare contre `-1` litteral. Utiliser la constante.
- `features/projects/application/projects.ts:104` — `itemsPerPage = 3;` non-UPPER_SNAKE_CASE → `const ITEMS_PER_PAGE = 3;` en haut de fichier.

---

## MINEUR — Cosmetique, style, immutabilite

### M1. `readonly` manquant sur `input()`

CLAUDE.md : "Toujours `readonly` -> ne jamais reassigner un input signal."

- `projects/application/components/project-card.ts:131` — `project = input.required<Project>();` → ajouter `readonly`

### M2. Selecteur prefixe `app-` (convention 2025 recommande `prefix: ''`)

CLAUDE.md : "configurer `prefix: ''` dans schematics." `angular.json` actuel : `"prefix": "app"`. Choix de projet — la regle est plus indicative que stricte ; si on s'aligne, c'est un changement massif.

**Decision recommandee** : conserver le prefix `app` pour eviter le churn. Si on s'aligne, faire en passe dediee.

### M3. `experimentalDecorators: true` dans tsconfig

Angular 21 utilise les standard decorators TS 5.0+. A tester en retirant.

### M4. Double import `@angular/common` dans `app.config.ts`

`isPlatformBrowser` (l.9) + `IMAGE_CONFIG` (l.23) — fusionner.

### M5. Tests sans `data-testid`

Plusieurs specs utilisent `querySelectorAll('app-ui-button')` — fragile au refactor de selecteur. Convention recommande `data-testid="..."`.

### M6. `as never` dans test (`in-memory-home.gateway.spec.ts:37`)

Indique un mauvais typage. Preferer un Builder Project ou typer correctement.

### M7. Donnees vides dans `contact.static-data.ts:10-14`

`linkedin: { url: '', label: '', icon: '' }` — preferer ne pas declarer la cle (`Partial<SocialLinks>`).

### M8. Champ `order` declare mais jamais utilise

- `features/home/domain/models/home-highlight.model.ts:6`
- `features/home/infrastructure/data/home.static-data.ts:17, 25, 33` — tous a `0`

YAGNI : retirer tant que pas exploite.

### M9. Code mort

- `features/home/application/home.ts:106-111` — methode `scrollTo()` non utilisee
- `features/home/application/home.ts:97` — `document = inject(DOCUMENT)` inutile si `scrollTo` retire

### M10. `setTimeout`/`subscribe` sans `takeUntilDestroyed` (app-initializers)

Acceptable car singleton, mais ajouter `catchError(() => EMPTY)` pour la resilience.

### M11. `<nav>` pour un seul lien (`two-factor-verify.ts:78-82`)

Surdimensionne. `<p>` ou rien.

### M12. CSP `unsafe-inline`

`src/index.html:56` — `script-src 'unsafe-inline'` annule la protection XSS. Justifie par hydration + structured data, mais ideal serait nonce-based CSP. Non bloquant.

### M13. Tailwind v4 `@utility` admin globales

`src/styles.css:73-189` — si seulement utilisees dans `features/admin/`, deplacer dans un fichier scoped feature.

### M14. Tests : `schemas: [NO_ERRORS_SCHEMA]` (contact-form.spec)

Masque les erreurs de template. Preferer `overrideComponent` avec providers/imports.

### M15. Imports a regrouper

- `auth/infrastructure/auth.service.ts:1-8` — separer `import type` et `import` pour le meme module
- Plusieurs fichiers ont des imports d'`@angular/core` non groupes

### M16. `private` sans prefix `_` (recurrent)

CLAUDE.md : "Prefixer les membres prives avec `_` : `private _data = signal([])`." Quasiment **tous** les composants ont des `private readonly authService` sans `_`. Pattern systemique.

### M17. Test `'Verrouillé'` en francais (icon spec)

`shared/icons/app-icon.spec.ts:46-48` — utiliser `'Locked'` (anglais pour code).

### M18. `Header` reserve par DOM (`globalThis.Headers`)

`layout/components/header/header.ts:152` — nom de classe potentiellement confus. Mineur.

---

## POSITIFS NOTABLES

Le projet est **massivement conforme** sur les fondamentaux modernes Angular 21+ :

- **Zoneless** : aucun `provideZoneChangeDetection`, OnPush partout, signals partout.
- **Signals & Resource API** : `input()`/`output()`/`model()`/`viewChild()` systematique, `rxResource`/`resource` utilises (admin-messages, admin-projects, admin-dashboard, admin-analytics).
- **Control flow v17+** : `@if`/`@for`/`@switch` partout, zero `*ngIf`/`*ngFor`.
- **Host encapsulation** : `host: { class: 'block' }` / `'contents'` declare sur quasi tous les composants.
- **Route par defaut non lazy** (`Home` import statique) — conforme.
- **Lazy loading** : `loadComponent`/`loadChildren` correctement utilises ailleurs.
- **Guards/Interceptors fonctionnels** : `CanMatchFn`, `HttpInterceptorFn`, pas de classe.
- **SSR + hydration** : `provideClientHydration(withEventReplay, withIncrementalHydration, withHttpTransferCacheOptions)`.
- **`provideRouter` configure** : `withComponentInputBinding`, `withInMemoryScrolling`, `withViewTransitions`, `withPreloading(SelectivePreload)`.
- **RxJS imports** : `from 'rxjs'` direct, `takeUntilDestroyed` utilise sur les subscribes manuels.
- **Reactive Forms** : `FormGroup<T>` types, `nonNullable: true`, `getRawValue()`, `<fieldset><legend>`, `<label for>` + `<input id>`, `role="alert"`, `aria-required`, `autocomplete`.
- **HTML semantique** : `<header>`/`<nav aria-label>`/`<main>`/`<section>`/`<article>`/`<footer>`/`<fieldset>`/`<address>` partout.
- **A11y** : `aria-label`, `aria-labelledby`, `aria-required`, `aria-sort`, `aria-current`, `role="switch"`, `focus-visible`.
- **NgOptimizedImage** : `[ngSrc]` + `width`/`height`/`priority` sur LCP (about-hero).
- **Tests Vitest** : `it.each` triangulation, Given/When/Then, `HttpTestingController`, `httpController.verify()`, `defer(() => of(data))` pour async stubs.
- **Optimistic updates** avec rollback (`admin-messages.ts:147-167`, `admin-projects.ts:277-302`).
- **Encapsulation signals** : `_data = signal()` + `data = _data.asReadonly()` (auth.service:16-19, admin-messages:109-110).
- **TypeScript strict++** : `strictTemplates`, `strictInjectionParameters`, `strictInputAccessModifiers`, `noPropertyAccessFromIndexSignature`, `noImplicitOverride`, `noFallthroughCasesInSwitch`.
- **ESLint a11y** : `templateAccessibility` actif.
- **SSR strategie** : `app.routes.server.ts` prerender public, CSR auth/admin — optimal.
- **`index.html`** : `lang="fr"`, charset, viewport, OG, Twitter cards, theme-color, format-detection, CSP, referrer policy, DNS prefetch, preload sprite — SEO/security grade.
- **`shared/icons/app-icon`** : composant SSR-safe exemplaire.
- **`shared/api/crud-http-methods`** : factory pure, generic, exemplaire.
- **`app.ts:44-48`** : pattern sandwich Signal → RxJS → Signal pour `isAdminRoute` via `toSignal(router.events)` + `computed()`.

---

## Plan d'action propose (par batch)

| # | Batch | Type | Risque |
|---|---|---|---|
| 1 | C1 — Renommer `infrastructure/` → `infra/` (6 features) | git mv + sed imports | Faible (mecanique) |
| 2 | C2 + C3 — Renommer `AuthService`/`SeoService`/`ToastService` + supprimer suffixes `.service`/`.guard`/`.interceptor`/`.pipe` | Renommages massifs | **Moyen** (~30 fichiers d'imports) |
| 3 | I15 — Renommer `UiButton`/`UiDrawer`/`UiToast` → `Button`/`Drawer`/`Toast` + selecteurs | Renommages cascadants | Moyen |
| 4 | C6 — Gateways `type` → `abstract class`, supprimer `InjectionToken`/factory throw | Refactor architectural | Moyen |
| 5 | C4 + C5 — Sortir `cv/` et `analytics/` de `shared/` vers `features/` | Deplacement + imports | Moyen |
| 6 | C8 — Decoupler `ui-toast` du service (Dumb pur) | Refactor cible | Faible |
| 7 | C7 — Ajouter use cases manquants `profile/` + `home/` | Ajout fichiers | Faible |
| 8 | C9 — Remplacer `isPlatformBrowser` par `afterNextRender` (projects) | Refactor cible | Faible |
| 9 | C10 — Renommer methodes `on*` → verbes d'action | Renommages locaux | Faible |
| 10 | C11 — Ajouter `@placeholder`/`@error` aux `@defer` (about.ts) | Ajouts template | Faible |
| 11 | C12 + C13 — Use case Result pattern + decoupler `'Tous'` du domain | Refactor cible | Faible |
| 12 | C14 + C15 — Fix memory leaks `URL.createObjectURL` + `setTimeout` toast | Fix bugs | Faible |
| 13 | C16 — Fix `role="menu"` invalide | Fix a11y | Faible |
| 14 | C17 — Eliminer methodes/getters dans templates | Refactor cible | Faible |
| 15 | I1 — Ajouter `protected` aux membres template | Edits locaux | Faible |
| 16 | I3-I5 — Ordre proprietes, SRP, effects mal utilises | Refactor varie | Variable |
| 17 | I7-I10 — HTML semantique, `track`, `<hgroup>` | Edits template | Faible |
| 18 | M1-M18 — Polish (readonly, code mort, prefixes `_`, etc.) | Mecanique | Faible |

Apres chaque batch : `pnpm exec tsc --noEmit -p tsconfig.app.json && pnpm run lint && pnpm test`.
