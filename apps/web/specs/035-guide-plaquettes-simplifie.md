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
