# Profil-projet AAK — angular-portfolio-app

> Généré par `/aak-init-profile`. Adapté à la main si besoin.
> Les 4 agents AAK lisent ce fichier à chaque invocation.

## Projet & langue

- **Nom du projet** : `angular-portfolio-app`.
- **Langue des livrables** (specs, ADRs, rapports) : `français`. Identifiants de
  code et noms de patterns établis restent en VO.

## Gestionnaire de paquets & commandes canoniques (gates)

- **Gestionnaire** : `pnpm`, version `≥ 10.22` (`packageManager: pnpm@10.22.0`).
  Binaire installé : `pnpm exec <cmd>` ; ad-hoc : `pnpm dlx <pkg>`. **Aucune**
  autre commande ne franchit les gates.
- **test** (source de vérité du typecheck) : `pnpm test` (`ng test`, builder
  `@angular/build:unit-test` → Vitest 4 + jsdom). `tsconfig.spec.json` inclut
  bien `src/**/*.spec.ts` ⇒ les specs sont type-checkées.
- **lint** : `pnpm lint` (`ng lint`, `@angular-eslint/builder` + flat config
  `eslint.config.js`) — zéro warning, zéro erreur.
- **build** : `pnpm build` (`ng build`, `@angular/build:application`, SSR activé).
  N'est pas la source de vérité des types (l'app-tsconfig exclut les specs).
- **invalidation cache** (à lancer **avant** de rejouer un gate ou une preuve RED
  quand le diff touche le système de cache) : `pnpm exec ng cache clean` (puis
  `rm -rf node_modules/.vite` si besoin). **Système(s) de cache concerné(s)** :
  `.angular/cache` (CLI persistant), `node_modules/.vite` (Vitest/Vite).

## Stack & bibliothèques (choix structurants)

- **État partagé** : aucun store générique tiers (pas de NgRx) ; stores maison à
  base de signals. **Seuil de promotion en store** : partagé entre **2+
  composants non liés**. Sous le seuil : signals locaux.
- **Coordinateur de feature (facade)** : couche `features/<x>/application/**`,
  services injectables qui *frontent* les use-cases/gateways du domaine et les
  adaptent au view (signals, `resource()`/`rxResource()`). Naming : **nommés par
  use-case, sans suffixe** (`login.ts`, `contact-form.ts`, `admin-cv.ts`) —
  jamais `Store`. Portée : instance-scopée via provider de route/composant.
  Les stores (source de vérité partagée) portent le suffixe `-store`
  (`toast-store.ts`, `auth-store.ts`).
- **Validation aux frontières** : `<aucune lib de validation runtime>` côté front
  (Zod réservé au backend NestJS). La frontière est tenue par des **adapters =
  fonctions pures** `toX(raw)` (infra → domaine) + **types API isolés** dans
  `infra/*.types.ts` (jamais dans `domain`). Pas de validation runtime des
  réponses HTTP ⇒ les agents tracent « validation runtime aux frontières non
  vérifiée ».
- **Persistance** : backend REST (`shared/api/**`, interceptors `core/**`).
  Observabilité : Sentry (`@sentry/angular`). Backend/auth : oui (feature `auth`,
  2FA, `auth-store`).
- **Async / réactivité** : `resource()`/`rxResource()`/`httpResource()` d'abord
  (`rxResource` largement utilisé) ; `signal`/`computed` pour l'état dérivé ;
  RxJS réservé aux vrais flux.
- **Cross-platform** : `aucun` (pas de Capacitor/Electron).
- **Forme des modèles** : `type` immutables (`readonly`) ; pas d'`interface` pour
  les modèles de domaine ; **union types > enums**. Pas de dérivation depuis un
  schéma (aucune lib de validation runtime côté front).
- **Contrats injectables** : `abstract class` **seulement si 2+ implémentations**
  réelles/planifiées (in-memory + HTTP, mock + prod) ; sinon **classe concrète**
  `@Injectable({ providedIn: 'root' })` directe (YAGNI). La testabilité passe par
  `provideHttpClientTesting()`, pas par swap de gateway.
- **Suffixes domaine** : `*.model.ts`, `*.gateway.ts`, `*.use-case.ts`,
  `*.adapter.ts` (1 use-case = 1 `execute()` ; supprimer les passthroughs
  triviaux).

## Naming & arborescence

- **Nommage des fichiers** : **pas de suffixe `.component.`** (0 fichier dans le
  repo) ; templates inline ; modèles `*.model.ts` / `*.types.ts`.
- **Préfixe sélecteur** : `app-`.
- **Pages de feature** : `src/app/features/<x>/application/**` (composants
  use-case) ; pages de premier niveau dans `src/app/pages/**`.
- **DS / primitives partagées** : `src/app/shared/ui/**`.
- **Domaine pur** (logique testable hors UI) : `src/app/features/<x>/domain/**`
  (models + gateways). Infra (gateways HTTP) : `features/<x>/infra/**`.
- **Seuils d'altitude composant** (gate advisory `code-reviewer`, non bloquant) :
  LOC 250, collaborateurs injectés 6 (défauts universels du contrat — non
  surchargés).

## Styling & design system

- **Règle styling** : Tailwind 4 **CSS-first** (utility classes par défaut dans
  templates et `host: { class }`) ; config dans `@theme`/`@utility` de
  `src/styles.css`, couleurs en **OKLCH**, alpha via `color-mix`. **Réutilisation
  = composant Angular `shared/ui/`**, jamais `@apply` ni classe CSS custom. Pas de
  couleur/espacement en dur hors tokens.
- **Localisation des styles** : **pas de `.css`/`.scss` séparé** par composant
  (seul `src/styles.css` global porte `@theme` + tokens). `styles:` inline
  réservé aux exceptions (keyframes custom, pseudo-éléments complexes,
  `background-clip: text`, `:autofill`/`::selection`/`::placeholder` avancés) ;
  sinon → composant `shared/ui/`.
- **Nom du DS / palette** : `<aucun nom formel>` — système de tokens sémantiques
  avec thème commutable (`--color-*` résolus depuis `--theme-*`).
- **Tokens-clés** : `--color-primary`, `--color-surface`, `--color-surface-elevated`,
  `--color-background`, `--color-foreground`, `--color-accent`, `--color-muted`,
  `--color-status-{success,warn,error}`, `--theme-*` (couche de thème).
- **Cible & viewport de référence** : mobile-first responsive, 375×667.
- **Tokens cross-platform** (safe-area, gestes) : `aucun`.

## Tests

- **Framework** : Vitest 4 (builder `@angular/build:unit-test`) + jsdom.
- **Frontières d'I/O** (seuls fakes légitimes — liste **fermée**) : réseau (HTTP,
  backend REST), horloge/timers (`Date`, `setTimeout`/`setInterval`), storage
  navigateur (`localStorage`/`sessionStorage` : thème, token auth), source d'aléa
  (`Math.random`, `crypto`, génération d'ID). Tout le reste s'exécute pour de vrai.
- **Carve-out unitaire direct** (sacré, ne pas collapser dans une page) :
  domaine pur (`features/*/domain/**`), testé **sans TestBed** (TypeScript pur).
- **Sélecteurs de test** : `data-testid` **uniquement** — jamais id / classe /
  texte.
- **HTTP en test** : `provideHttpClientTesting()` + `HttpTestingController`, avec
  `verify()` en `afterEach`.
- **Structure** : `describe` > `it` en Given/When/Then ; `it.each` pour la
  triangulation TDD ; `fixture.componentRef.setInput()` pour les inputs ;
  `TestBed.overrideComponent` > `configureTestingModule`.
- **Projet de test visuel** (DOM réel, navigateur) : `aucun`.
- **Glossaire domaine / builders** : convention **Builder + PageModel** pour la
  lisibilité ; agrégats récurrents candidats (`User`, `SiteStats`,
  `StatsOverview`, `Project`) — à doter d'un builder dès qu'ils sont construits
  >1× dans les tests.
- **Exemple Router-en-test stable** : `src/app/features/auth/application/login.spec.ts`.

## Revue UI/design (optionnelle)

- **Outil de scoring visuel** : `aucun` ⇒ régime de validation
  manuelle/structurelle.
- **Chemin du bundle compilé** (grep des règles `[_nghost-…]`) :
  `dist/angular-portfolio-app/browser/**`.
- **Composants à forte interaction tactile** (validation interactive séparée,
  cible mobile-first) : `app-drawer`, `app-file-dropzone`, `app-paginator`,
  `app-toast`.

## Politique commentaires (archéologie interdite)

- **Pattern grep d'archéologie** (mécanique, sans jugement) :
  `ADR-[0-9]|spec [0-9]{3}|§ ?[A-Z]|ajouté pour|/\*\*`.
- **Règle** (rappel — universelle) : par défaut **aucun** commentaire ; seul
  légitime = **une ligne** de WHY intemporel non-évident. Interdits : numéro de
  spec/ticket, réf ADR/§, récit de diagnostic/rétro, « ajouté pour X », le QUOI,
  le bloc narratif.
- **Garde-fou `pre-commit`** : Husky `.husky/pre-commit` lance les tests
  (`npm test`) ; `lint-staged` applique `prettier --write` + `eslint --fix` sur
  `*.ts`/`*.html` et `prettier` sur `*.{css,scss,json}`. Pas de garde-fou
  spécifique anti-archéologie de commentaire.

## Patterns projet (respectés ; signalés en finding si violés)

- Couches hexagonales par feature : `features/<x>/{domain,infra,application}` —
  `domain` pur (zéro import Angular), `infra` = gateways HTTP + adapters,
  `application` = facades use-case. Règle de dépendance : `application` → `domain`,
  `infra` → `domain`, `domain` → rien ; `application` ne dépend **jamais**
  directement de `infra` (câblage dans `app.config.ts`).
- Stores d'état partagé suffixés `-store` ; facades `application/**` sans suffixe.
- **Result pattern** sur les erreurs métier : `{ success: true; data: T } |
  { success: false; error: E }` (jamais d'exception pour un échec métier attendu).
- **Adapters = fonctions pures** `toX(raw)` à la frontière infra→domaine ; types
  API isolés dans `infra/*.types.ts`.
- Contrats injectables en `abstract class` uniquement si 2+ impls (sinon classe
  concrète) ; use-case non trivial uniquement (pas de passthrough).
- Async via `resource()`/`rxResource()`/`httpResource()` d'abord ; RxJS réservé
  aux vrais flux (`takeUntilDestroyed()` sur tout subscribe manuel).
- Modèles de domaine en `type` immutables (`readonly`), union types > enums,
  jamais `interface`.

## Outillage intake (`intake-auditor`, dimensions 1/5/10)

- `pnpm dlx madge --circular --extensions ts` (cycles) ;
  `pnpm dlx knip` (dead code) ;
  `pnpm dlx depcheck` (deps inutilisées) ;
  `pnpm audit --prod` (CVEs). Dégradation propre si un outil échoue.
- **CI/CD** (dimension 10, **GitHub Actions uniquement**) : `aucun workflow`
  détecté (`.github/workflows/` absent) ⇒ `CI non auditée : aucun workflow
  GitHub Actions` (trace, dégradation propre). Gates attendus en CI quand ils
  existeront = `test` / `lint` / `build` ci-dessus.
