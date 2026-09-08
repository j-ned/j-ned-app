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
