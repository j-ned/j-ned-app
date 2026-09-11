# Lessons

## 2026-09-08 — deux builds Docker cassés par des merges de PR « indépendantes »

**Ce qui s'est passé.** Sept PR ouvertes en parallèle depuis le même `master`, annoncées
indépendantes. Deux casses de prod après merge :

1. `pnpm-lock.yaml` incohérent (#81 Angular 22.1 + #84 DOMPurify touchaient `package.json` et le
   lockfile) → `ERR_PNPM_LOCKFILE_MISSING_DEPENDENCY` sur l'install gelé du Dockerfile (#86).
2. Import `ElementRef` perdu : un commit de documentation poussé sur la branche de #80 **déjà
   mergée** a créé une seconde PR (#87) à partir d'une branche obsolète, qui a réécrit
   `contact-form.ts` dans sa version d'avant #85 (#88).

**Règles.**
- Une branche mergée est morte : tout complément part d'une **nouvelle branche depuis `master`**.
- « Indépendantes » se prouve, ne s'affirme pas : `git diff --name-only master...<branche>` sur
  chaque PR, intersection vide sur **les fichiers**, pas seulement sur les hunks (`package.json`,
  lockfile, et tout fichier reformaté par Prettier comptent).
- Après chaque merge, rejouer localement les étapes exactes du Dockerfile
  (`pnpm install --frozen-lockfile` puis `pnpm run build --configuration production`), pas
  seulement `pnpm test`.
- Ce dépôt merge en **squash** : vérifier le contenu de `master`, pas celui de la branche.

## 2026-09-11 — l'admin déconnecté à chaque rechargement (NG0200 avalé par `catchError`)

**Ce qui s'est passé.** #110 a conditionné `restoreSession()` à un indice `localStorage`. Le
constructeur d'`AuthStore` lançait la requête `/auth/me`, qui traverse `authInterceptor`, lequel
injecte… `AuthStore` : NG0200 (dépendance circulaire) levée avant tout appel réseau, avalée par le
`catchError`, qui effaçait l'indice. Le second appel (depuis `App`) ne trouvait plus d'indice :
zéro `GET /auth/me` dans les logs API en 20 h, tandis que les 504 tests passaient (le spec
n'enregistrait pas l'intercepteur). Avant #110, la même erreur existait déjà mais le second appel
masquait le problème.

**Règles.**
- Jamais de requête HTTP dans le constructeur d'un service injecté par un intercepteur : la lancer
  depuis un `provideAppInitializer` (le service est alors construit).
- Un `catchError` qui a un effet de bord persistant (effacer un indice, un token) ne réagit qu'à
  l'erreur qui le justifie (`HttpErrorResponse` 401), jamais à « toute erreur ».
- Le test de non-régression enregistre l'intercepteur réel (`withInterceptors([authInterceptor])`)
  : un `HttpTestingController` sans intercepteur ne voit pas les erreurs de DI.
- Diagnostic utile : zéro requête côté API + indice absent ⇒ tracer `Storage.prototype.removeItem`
  et `new Error('NG0…')` dans un Chromium headless (`playwright-core` + `addInitScript`).
