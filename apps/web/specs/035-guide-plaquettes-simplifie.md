---
id: 035
title: Guide des plaquettes simplifié, saisi depuis l'admin
type: feature
status: draft
created: 2026-10-26
related: [specs/034-guide-plaquettes.md, specs/032-atelier.md, docs/adr/0032-confidentialite-verifiable-du-contenu-d-atelier.md, docs/adr/0033-referentiel-d-usinage-source-par-le-type.md, docs/adr/0024-rendu-a-la-requete-des-pages-de-contenu.md]
---

# 035 — Guide des plaquettes simplifié

## Description

### Objectif

Demande du propriétaire (2026-10-26) : le guide des plaquettes de la spec 034 est **trop complexe**
(référentiel sourcé, groupes ISO, citations, codes déduits). Il est **simplifié** :
ce que Julien utilise vraiment à l'atelier, **saisi par lui dans l'admin**, et qu'il peut **activer
ou désactiver**. Le contenu vient de Julien (exigence 1 de la spec 032 : « vient de Julien ou d'une
source citée ») : plus de source fabricant, plus de déduction.

### Arbitrages (2026-10-26)

1. **Simplifier, pas supprimer** : le guide garde son nom et son adresse `/atelier/plaquettes`, et
   sa carte reste sur l'accueil de l'atelier. Son contenu devient ce que Julien saisit.
   **À ne pas confondre** avec les fiches métier du volet V5 de la spec 032 (pages de référence :
   lexique, explication du tour), qui restent un sujet à part, inchangé.
2. **Une ligne du guide** = matière (texte libre), opération (liste fermée), plaquette (code, texte
   libre, par exemple `CNMG 120408`), rayon de bec (mm), remarque (facultative).
3. **Côté public** : on choisit une matière dans une liste, un tableau simple affiche, pour cette
   matière, opération / plaquette / rayon / remarque.

### Parcours

**Admin** (`/admin/guide-plaquettes`, nouvelle entrée du menu admin) :

1. Un interrupteur **« Guide des plaquettes visible sur le site »**.
2. Un tableau éditable de lignes : ajouter, modifier, supprimer, réordonner n'est pas requis (ordre
   d'affichage : matière, puis ordre des opérations de la liste fermée).
3. Enregistrer : un seul document, comme le parcours (`/admin/profile`).

**Public** (`/atelier/plaquettes`) :

1. Une liste déroulante des matières saisies (sans doublon, ordre alphabétique).
2. Le tableau des lignes de la matière choisie. La matière choisie reste dans l'URL
   (`?matiere=…`) pour partager la page.
3. Une phrase d'avertissement courte : ce sont les choix de Julien à l'atelier, à adapter à sa
   machine, sa pièce et le catalogue de son fournisseur.

### Opérations (liste fermée)

Ébauche extérieure, finition extérieure, ébauche intérieure, finition intérieure, perçage, gorge,
tronçonnage, filetage.

### Exigences

1. **Interrupteur** : guide désactivé = `/atelier/plaquettes` répond 404, la carte disparaît de
   l'accueil de l'atelier, la page sort du sitemap. Activé sans aucune ligne = la page dit « guide en
   cours de remplissage ».
2. **API** (dépôt `nest-portfolio-app`, modèle du profil) : un document unique « guide des plaquettes »
   (`enabled`, `entries[]`), `GET` public, `PUT` réservé à l'admin, validation Zod (longueurs
   bornées, rayon positif, opération dans la liste fermée). Livrée et déployée **avant** le front
   (CLAUDE.md, ordre API puis front).
3. **Rendu** : la page et l'accueil de l'atelier lisent l'API à la requête (ADR-0024, catégorie des
   pages de contenu) ; l'accueil `/atelier` passe donc de prérendu à rendu à la requête.
4. **Confidentialité (ADR-0032)** : l'éditeur avertit avec `findConfidentialReferences` (références
   de pièce, de plan, d'OF) comme l'éditeur d'articles ; jamais de nom de client ni de pièce.
5. **Mêmes standards** : SSR, SEO de la page, WCAG AA (tableau avec `caption` et en-têtes, liste
   déroulante étiquetée), tutoiement, Signal Forms dans l'admin (lignes ajoutées et retirées par
   `model.update()`, comme `admin-pair-rows`).

### Ce qui disparaît (spec 034)

Le référentiel sourcé et tout ce qui le sert : sources, groupes ISO, matières à désignations,
recommandations par situation, citations et mentions « déduit », champ matière à suggestions, garde
des sources IA et des noms commerciaux, `specs/assets/034/`. ADR-0033 passe au statut « remplacé
par la spec 035 ». La garde de confidentialité (`findConfidentialReferences`) reste.

### Découpage en PR (proposé)

| # | Dépôt | Périmètre | Dépend de |
|---|---|---|---|
| 1 | front | cette spec | — |
| 2 | API | document guide des plaquettes (`GET` public, `PUT` admin), migration, tests | 1 |
| 3 | front | retrait du référentiel 034 + guide public lu dans l'API + interrupteur (404, carte, sitemap) | 2 en prod |
| 4 | front | page admin `/admin/guide-plaquettes` (interrupteur et lignes) | 3 |

Les PR front 3 et 4 partent chacune de `master` à jour, l'une après le merge de l'autre (jamais de
PR empilée).

### Hors périmètre

- Conditions de coupe (vitesse, avance, profondeur de passe).
- Photos, liens vers des catalogues, fiches par machine.
- Import de l'ancien référentiel de la spec 034.

### Arbitrages complémentaires (2026-10-26)

1. **Nom** : « Guide des plaquettes », simplifié ; « fiche atelier » reste réservé aux fiches
   métier du volet V5 de la spec 032.
2. **Opérations** : la liste fermée ci-dessus, en attendant un ajout de Julien.
3. **Rayon** : saisi et affiché en mm (0,4 / 0,8 / 1,2).

## Journal des tranches

- **PR front 3 — retrait du référentiel 034, guide public lu dans l'API, interrupteur** : RED 42 failed / 4642 total (code de sortie 1), puis 2 RED ajoutés au fil de la vérification (option choisie absente du HTML serveur, tableau qui élargissait la page à 375 px) ; GREEN 4643 passed / 4643 total (code de sortie 0) · refactor : lecture des lignes du guide factorisée dans `_entries`, `InsertGuideEntryDto` et le builder inutilisé `anInsertGuide` retirés de l'export

## Verify

Image `ng-portfolio-app:ci` (`docker buildx bake ci`) servie devant la doublure (`ci/a11y-stack.sh up ng-portfolio-app:ci`), parcours joués par Playwright (Chromium headless). Verdict : **PASS**.

1. `/atelier` : carte « Guide des plaquettes » présente (capture `01-atelier.png`).
2. `/atelier/plaquettes`, choix « Acier témoin » dans la liste : l'URL devient `?matiere=Acier%20t%C3%A9moin` (remplacée), le tableau liste « Ébauche extérieure / PLAQUETTE-TEMOIN-1 / 0,8 mm / Ligne fictive de la doublure. » puis « Filetage / PLAQUETTE-TEMOIN-2 / 0,2 mm » ; le choix vide retire `?matiere` et le tableau (capture `02-choix-matiere.png`).
3. URL partagée `?matiere=Laiton%20t%C3%A9moin` en rendu serveur, JavaScript coupé, 375 px : 200, option « Laiton témoin » marquée `selected`, `caption` « Plaquettes pour Laiton témoin », largeur de page 375 px sans défilement horizontal (captures `03-url-partagee-ssr-sans-js-375.png`, `06-mobile-375.png`).
4. Matière inconnue : 200, texte jamais réaffiché, aucun tableau.
5. Doublure passée temporairement à `enabled: false` (non commitée) : `/atelier/plaquettes` (avec ou sans `/`, avec `?matiere`) répond **404** avec la page introuvable ; `/atelier` en 200 sans carte ni section « Les outils » ; `sitemap.xml` sans `/atelier/plaquettes`, avec `/atelier` (captures `04-guide-eteint-404.png`, `05-atelier-sans-carte.png`).
6. Console : aucune erreur venant de l'atelier. Seule erreur : `GET /api/config` en 404, sur toutes les pages, parce que la doublure ne sert pas cette route (antérieur à cette PR).
7. `pnpm a11y -g atelier` : 6 passed (clair et sombre, `/atelier`, `/atelier/plaquettes`, `?matiere=Acier%20t%C3%A9moin`).

Limite constatée : dans le volet navigateur de l'application (masqué), `requestAnimationFrame` ne se déclenche pas et les transitions de vue du routeur restent bloquées. La navigation côté client y semblait cassée sur toutes les pages, `/mentions-legales` compris. Le parcours a donc été rejoué dans Playwright.

## Review code

**Verdict** : APPROVED
**Gates CI locaux** : tests ✅ (`pnpm test` exit 0, 4643/4643 ; `tsc --noEmit -p tsconfig.spec.json` exit 0) / lint ✅ (`pnpm lint` exit 0) / build ✅ (`pnpm run build --configuration production` exit 0) ; `pnpm install --frozen-lockfile` 0, `pnpm run format:check` 0, `docker buildx bake ci` 0
**Checks mécaniques** : checker non vendoré : auto-checks joués à la main (archéologie, export default, effect, zone, snapshot, getByTestId, fireEvent, boucles de tests, innerHTML/console/any) : 0 hit
**Warnings de gate** : aucun induit par le diff ; (b) pré-existant : `pnpm install` « Ignored build scripts » (@parcel/watcher, @sentry/cli, lmdb, msgpackr-extract)
**Rendu compilé** : N/A (aucun composant `shared/ui` à sélecteur attribut touché)
**Preuve de verify runtime** : ✅ (section Verify complète, rejouée par la revue sur `ng-portfolio-app:ci` : guide activé 200 + `X-Cache-Status`, option `selected` et `caption` dans le HTML serveur, CSP sans `unsafe-inline` ; guide éteint 404 avec ou sans `/` et `?matiere`, `/atelier` 200 sans carte ni section, sitemap sans la page ; doublure arrêtée : 503 sur les deux routes ; `/atelier/plaquettes/autre` 404 nginx)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ✅
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ✅ (exigences 1, 3, 4, 5 tenues pour la PR 3 ; la spec n'a ni `## Plan technique` ni `## Plan de test`, alignement jugé sur la Description)

**Tests notables** :
- ✨ `src/app/features/workshop/pages/insert-guide/insert-guide.spec.ts:256` : 404 serveur, page introuvable et aucune fuite du guide éteint, sur le statut réel `RESPONSE_INIT`.
- ✨ `src/server/feeds/feed-handler.spec.ts:92` : interrupteur du sitemap triangulé par `it.each`, et lecture en échec du guide ajoutée aux cas 503.

**Risque résiduel** (advisory) :
- monitoring : Sentry
- au déploiement, `/atelier/plaquettes` répond 404 et la carte disparaît (production `enabled: false`) jusqu'à l'activation, qui passe par `PUT` tant que la PR 4 (admin) n'est pas livrée
- `/atelier` dépend désormais de `GET /api/workshop-guide` : une panne de ce seul endpoint met l'accueil de l'atelier en 503 (copie nginx servie si elle existe)

**Suite (2026-10-27, session principale)** : remarque 1 appliquée, `track` sur une clé stable (opération, plaquette, rayon) au lieu de l'objet recréé.
