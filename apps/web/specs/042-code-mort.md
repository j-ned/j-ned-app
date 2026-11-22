# Code mort, cycles d'imports et dépendances inutilisées

## Description

Point resté ouvert de l'audit `039-intake-audit-repo.md` : `madge`, `knip` et `depcheck` n'avaient
pas pu être lancés (dimensions 1 et 5 non couvertes). Cette spec les lance sur tout le monorepo
(`apps/web`, `apps/api`, `packages/api-parity`), trie chaque signalement, retire ce qui est prouvé
mort et liste le reste.

Contraintes : aucun changement de comportement, aucun outil ajouté au dépôt, aucune montée de
version, aucun commentaire de l'API modifié (chantier parallèle).

## Outils

Lancés hors dépôt (`pnpm dlx` ou installation dans un dossier temporaire), configuration hors
dépôt. Versions publiées depuis plus de deux semaines au 2026-11-22.

| Outil    | Version | Publiée    | Lancement                                                              |
| -------- | ------- | ---------- | ---------------------------------------------------------------------- |
| knip     | 6.44.2  | 2026-11-07 | `pnpm dlx knip@6.44.2 --config <tmp>/knip.json` depuis la racine       |
| madge    | 8.0.0   | 2024-08-05 | `pnpm dlx madge@8.0.0 --circular --extensions ts --ts-config …`, et API JS avec `skipTypeImports` |
| depcheck | 1.4.7   | 2023-10-17 | une fois par paquet du workspace (racine, web, api, api-parity)        |

### Configuration knip (deux passes)

1. **Passe complète** : plugins Angular, Vitest, Jest, Playwright, ESLint, Drizzle actifs ; points
   d'entrée ajoutés : web `src/main.ts`, `src/main.server.ts`, `src/server.ts`, `src/**/*.spec.ts`,
   `e2e/**/*.ts`, `scripts/*.mjs`, `proxy.conf.cjs` ; API `src/main.ts`, `src/instrument.ts`,
   `src/**/*.spec.ts`, `src/database/seeds/*.ts`, `src/database/scripts/*.ts`, `test/**/*.ts` ;
   api-parity `src/**/*.spec.ts`, `src/global-setup.ts`. Les alias `@core/*`, `@shared/*`,
   `@features/*`, `@layout/*` sont lus dans `tsconfig.json`.
2. **Passe production** (`--production`, specs et dossiers `testing/` exclus des entrées) : fait
   apparaître les exports qui ne servent qu'aux tests.

## Signalements et verdicts

### Fichiers

| Élément | Outil | Verdict | Preuve |
| --- | --- | --- | --- |
| `apps/web/src/app/testing/editorial-sources.ts` | knip | **mort, supprimé** | Aucun import dans le dépôt : ses deux consommateurs (`editorial-typography.spec.ts`, `editorial-identity.spec.ts`) ont été retirés par `150a83af`. Seules des specs et l'ADR-0032 (historique, non modifié) le citent. |
| `apps/api/src/profile/profile.seed.ts` (passe production) | knip | faux positif | Fixture de test volontaire : trois specs vérifient qu'il reste égal à la migration `drizzle/0021_profile_seed.sql`. |
| 33 fichiers `testing/` du front (passe production) | knip | faux positif | Builders, stubs et page objects de test, importés par les specs. |

### Exports utilisés seulement dans leur propre module (export retiré, symbole gardé)

Front : `alpha` (`analytics-presenter.ts`), `LEGAL_LAST_UPDATE` (`legal-notice.ts`), `ICON_MAP`
(`icon-map.ts`, `scripts/build-icons.mjs` n'importe que `uniqueIcons`), `NEW_TAB_NOTICE`
(`new-tab-notice.ts`), type `CommentThreadItem` (`comment-thread-view.ts`).

API : `isPrivateIp`, `DAILY_ROLLUP_PATTERN`, `DAILY_ROLLUP_MONITOR`, `METRIC_TYPES`,
`EVENT_COUNT_TYPES`, `ANALYTICS_TYPES`, `blogPostsRoutes`, `JSON_BODY_LIMIT_BYTES`, `readJson`,
`withoutMarkup`, `S3_TIMEOUTS`, types `DayConversions`, `CommentModeration`, `LogLevel`,
`MailTemplate`, `ProfileBiography`, `ProfileTitledItem`, `ProfileTechnology`, `ProfileDiploma`,
`ProfileMotivation`, `RuntimeConfigResponse`.

api-parity : type `Method` (`routes.ts`).

Preuve pour chacun : `grep -rnw` sur `apps`, `packages`, `deploy`, `.github` (hors `node_modules`,
`dist`, Markdown) ne trouve le nom que dans son fichier, ou sous un homonyme sans rapport (`readJson`
local de `feed-handler.ts` et de `ci/api-stub/server.mjs`, `METRIC_TYPES` local d'un spec du front).

### Types morts (supprimés)

| Élément | Verdict | Preuve |
| --- | --- | --- |
| `MetricType`, `EventCountType` (`apps/api/src/analytics/dto/date-range-query.dto.ts`) | **mort, supprimé** | Aucune référence, même dans le fichier (l'`EventCountType` du front est un type distinct). |
| `Env` (`apps/api/src/config/env.schema.ts`) | **mort, supprimé** | Aucune référence ; `env.validation.ts` importe seulement `envSchema`. |

### À décider par le propriétaire

| Élément | Outil | Raison |
| --- | --- | --- |
| Types `…Dto` inutilisés : `ChangePasswordDto`, `LoginDto`, `TwoFactorDisableDto`, `TwoFactorEnableDto`, `TwoFactorVerifyDto`, `Profile{Biography,Highlight,WhatIDo,Technology,Diploma,Motivation}Dto`, `ArchitectureDecisionDto`, `ProjectImageAltDto`, `ReorderProjectImagesDto`, `TechChoiceDto` | knip | Morts au sens strict (aucune référence), mais chaque `*.dto.ts` de l'API suit la forme « schéma + `type XDto = z.infer<…>` » et d'autres `XDto` du même motif sont utilisés. Les retirer casse cette régularité sans gain au build (types effacés). Gardés. |
| `setThrottleStore`, `MemoryThrottleStore`, `ThrottleStore` (`apps/api/src/common/throttle.ts`) | knip (production) | Point d'injection de test : seuls les specs remplacent le magasin. Le comportement (quota en mémoire) sert l'application ; gardés. |

### Faux positifs

| Élément | Outil | Raison |
| --- | --- | --- |
| 8 réexports de `apps/web/src/app/core/monitoring/sentry-sdk.ts` (`createErrorHandler`, `getActiveSpan`, `getCurrentScope`, `getRootSpan`, `setUser`, `spanToJSON`, `TraceService`, `updateSpanName`) | knip | `main.ts` importe le module entier (`await import(…)`) et passe l'espace de noms à `Monitoring.attach`, typé `MonitoringSdk`, qui les appelle. |
| `uniqueIcons` (passe production) | knip | Lu par `scripts/build-icons.mjs` via un `import()` dynamique sur un chemin calculé. |
| Constantes exportées lues par leur spec (`JWT_ISSUER`, `DEFAULT_THROTTLE`, `IMAGE_MAX_WIDTH`, `RELATED_POSTS_LIMIT`, `PENDING_COMMENT_TTL_MS`, `escapeCsv`, `scaleToFit`, `storageImageLoader`, `FeedTarget`, etc. : 59 exports et 33 types en passe production) | knip (production) | Le symbole sert l'application dans son module ; l'export sert d'oracle au spec. Pas de code mort. |
| `@fortawesome/fontawesome-free` (web) | knip, depcheck | Source des SVG lue par `scripts/build-icons.mjs:21` (`node_modules/@fortawesome/fontawesome-free/svgs`). |
| `pino-pretty` (api) | knip, depcheck | Chargé par nom comme transport pino (`src/common/logger.ts:33`). |
| `@types/jest` (api) | depcheck | Globals `describe`/`it`/`expect` des specs Jest. |
| `prettier` (racine) | depcheck | Lancé par `lint-staged` (`package.json` racine). |
| `@angular/build`, `@angular-eslint/builder`, `@angular/compiler-cli` (web) | depcheck | Builders d'`angular.json`, compilateur AOT. |
| `@tailwindcss/postcss`, `postcss`, `tailwindcss`, `@tailwindcss/typography` (web) | depcheck | `.postcssrc.json`, `@import 'tailwindcss'` et `@plugin '@tailwindcss/typography'` de `src/styles.css`. |
| `tslib` (web) | depcheck | `importHelpers: true` dans `tsconfig.json`. |
| `lint-staged` « manquant » (web) | depcheck | Configuration lue par le `lint-staged` de la racine (hook husky). |
| Alias `@core/…`, `@shared/…`, `@features/…`, `@layout/…` « manquants » (web) | depcheck | Alias de chemins TypeScript, pas des paquets. |
| Binaires `typecheck`, `a11y`, `playwright`, `podman` | knip | Scripts pnpm et binaire système. |

### Styles `@utility` de `src/styles.css`

Les 14 `@utility` (`page-container`, `section-title`, `footer-heading`, `footer-link`,
`animate-fade-up`, `form-input`, `app-select`, `form-textarea`, `form-label`, `form-error`,
`field-label`, `field-hint`, `table-head`, `code-syntax`) sont tous employés dans au moins un
template ou `host` (`code-syntax` : chaîne construite dans `render-code-block.ts`). Rien à retirer.

### Dépendances

Aucune dépendance inutilisée : chaque signalement est un faux positif (tableau ci-dessus).
`package.json` et lockfile inchangés.

## Cycles d'imports

| Cycle | Nature | Décision |
| --- | --- | --- |
| `apps/api/src/storage/s3-utils.ts` ↔ `storage.service.ts` | **à l'exécution** : `s3-utils` importait la valeur `STORAGE_BUCKET`, `storage.service` importe `derivedKeysOf`/`isDerivedKey` | **Cassé** : `storeOptimizedImage` reçoit le bucket en paramètre, comme `deleteS3IfExists` ; il ne reste qu'un `import type`. |
| `apps/api/src/analytics/engagement.ts` ↔ `dto/track-event.dto.ts` | types seulement (`import type` dans `engagement.ts`), effacé à la compilation | Gardé. |

Front (`tsconfig.spec.json`, `src`, `e2e`, `scripts`) et api-parity : aucun cycle.

## Résultat après suppression

- madge (CLI, types compris) sur l'API : les deux cycles ci-dessus restent listés, tous deux
  réduits à des imports de type ; madge avec `skipTypeImports` : aucun cycle.
- knip, passe complète : restent les faux positifs et les `…Dto` « à décider » ci-dessus.
- depcheck : inchangé, faux positifs seulement.
