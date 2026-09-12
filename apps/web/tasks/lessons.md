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

## 2026-09-12 — un conflit résolu dans GitHub a cassé le build Docker de l'API, et le front a été mergé avant l'API dont son build dépend

**Ce qui s'est passé.**

1. PR API #38 (carte de partage) ouverte depuis un `master` antérieur à #36 (clés d'images
   hachées). Les deux ajoutaient des fonctions **en fin de `s3-utils.ts`** : conflit au merge,
   résolu dans l'éditeur GitHub (« Merge branch 'master' into feat/share-image-variant »). La
   résolution a gardé l'`import { createHash }` mais perdu `contentHash`, et laissé le
   `Cache-Control` 24 h de #38 écraser le `max-age=31536000, immutable` de #36. La CI avait
   validé la branche **avant** le merge ; le build Docker Dokploy (sur `master`) a échoué avec
   `TS2305: no exported member 'contentHash'`. Corrigé par #39.
2. PR front #118 mergée à 16:03, PR API #39 mergée à 16:12 et déployée à 16:14. Le script RSS du
   build front fait un `HEAD` sur l'API prod pour typer l'`enclosure` : il a figé `image/avif`
   (l'ancienne API ignorait `?variant=share`). Le HTML prérendu était juste (l'URL seule y figure),
   seul le flux portait le mauvais type, jusqu'au redéploiement manuel du front.

**Règles.**
- Une résolution de conflit faite dans l'UI GitHub n'est vérifiée par personne : résoudre en
  local (`git merge origin/master`), rejouer les gates du Dockerfile, pousser, et ne merger
  qu'une fois la CI verte **sur le commit de merge**. Un conflit sur un fichier où les deux
  branches ajoutent au même endroit (fin de fichier, même `Map` de providers, même `enum`) doit
  garder **les deux** ajouts : relire le diff du commit de merge, pas seulement les marqueurs.
- Deux PR qui touchent le même fichier ne sont pas indépendantes, même sans hunk commun
  (cf. leçon du 2026-09-08) : ici la seconde PR aurait dû être rebasée sur `master` avant merge.
- Quand le front dépend d'une évolution de l'API, la dépendance porte aussi sur le **build**
  front : `generate-sitemap.mjs`, `generate-rss.mjs` et le prérendu interrogent l'API **prod**.
  Ordre : merger l'API, attendre le nouveau conteneur (`docker ps` sur `homeserver`, ou tester
  l'endpoint), puis merger le front. Front mergé trop tôt = artefact statique figé sur l'ancienne
  réponse, à redéployer à la main (la CI GitHub ne déclenche pas Dokploy, seul le push ou
  « Redeploy » le fait).
- Ce qui est régénéré au build (sitemap, RSS, HTML prérendu) se vérifie **en prod après
  déploiement**, pas seulement dans `dist/` : un `lastBuildDate` antérieur au déploiement de
  l'API suffit à expliquer un écart.

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
