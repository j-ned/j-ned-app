# ADR-0013 — Édition des projets et des articles en pages dédiées, avec aperçu par les composants publics

- **Statut** : accepté (2026-10-07, PR c1 de la spec 015 mergée, clôture de la spec)
- **Date** : 2026-10-07
- **Contexte spec** : `specs/015-refonte-admin.md` (arbitrages 2 et 3, tranches C1 à C6)
- **Prolonge** : ADR-0010 (champs éditoriaux et présentation par nature)

## Context

L'admin édite un projet dans une ligne dépliée de la liste (`AdminProjectRow` →
`AdminProjectInlineForm`, 15 champs, deux listes répétées, galerie) et un article à la place de la
liste (`AdminBlog.editing`). Le propriétaire a validé (2026-10-07) : pages dédiées
`/admin/projects/new`, `/admin/projects/:id`, `/admin/blog/new`, `/admin/blog/:id`, aperçu en
direct de la carte publique à partir de `lg`, garde contre les modifications non enregistrées.

Faits vérifiés :

- API (`nest-portfolio-app`) : `GET /projects/:id` (UUID, public) existe ; **aucune** lecture
  d'article par identifiant (`GET /blog/posts/:slug` ne sert que les publiés, `GET /blog/posts/admin`
  liste tout, brouillons compris).
- Les cartes publiques sont des composants de `features/projects/application/components/`
  (`ProjectCaseStudy`, `ProjectGridCard`, `ProjectCover`) et
  `features/blog/application/components/blog-post-row.ts`, alimentés par des vues construites par
  des fonctions pures **non exportées** (`toCaseStudyView`, `toCardView`, `toRowView`).
- `ProjectCaseStudy` et `BlogPostRow` basculent en grille sur la **largeur du viewport**
  (`lg:grid-cols-12`, `lg:grid-cols-[minmax(0,1fr)_20rem]`) : dans une colonne de 25 rem sur un écran
  large, ils s'afficheraient en grille écrasée.
- `NgOptimizedImage` refuse les URL `blob:` (`assertNotBlobUrl`, `@angular/common` 22) : une
  couverture choisie localement ne peut pas passer par `ProjectCover`.
- L'admin dépend déjà de `features/projects/application` (`PROJECT_KIND_LABELS`) ; `projects` et
  `blog` n'importent jamais `admin`.

## Decision

1. **Une route par édition**, chargée paresseusement, `canDeactivate: [unsavedChangesGuard]`.
   Le projet se charge par `getProjectById` ; l'article par la liste admin (mise en cache dans le
   gateway, précédent `HttpProjectsGateway.allProjects$`) puis recherche par `id` : aucune
   évolution d'API.
2. **La page possède le brouillon, le formulaire l'édite.** La page d'édition (smart) tient le
   modèle Signal Forms (`linkedSignal` sur la ressource), sa ligne de base et le fichier de
   couverture en attente ; le formulaire (dumb) reçoit le modèle en `model()` (lecture et écriture
   du même objet métier par les deux côtés) et émet le payload à la soumission. L'aperçu, le
   compteur de modifications et la garde dérivent du même modèle par `computed()`.
3. **Aperçu = composants publics, non des copies.** `features/projects` exporte
   `toCaseStudyView` et `toProjectCardView`, `features/blog` exporte `toBlogPostRowView`. L'admin
   construit un `Project` (ou `BlogPost`) d'aperçu à partir du brouillon par une fonction pure
   **côté admin** (`toPreviewProject`, `toPreviewPost`), puis passe par ces builders. Frontière :
   `admin → projects|blog (application + domain)`, jamais l'inverse ; le brouillon est un concept
   admin et n'entre pas dans `features/projects`.
4. **Mise en page intrinsèque des cartes publiques** : `ProjectCaseStudy` et `BlogPostRow`
   passent de requêtes de viewport à des **requêtes de conteneur** Tailwind v4 (`@container` sur
   l'hôte, `@min-[60rem]:` à la place de `lg:`). Seuil calculé : le conteneur public vaut
   `vw − 48 px` sous `lg` et `vw − 64 px` à partir de `lg` (`page-container`), donc 60 rem = 960 px
   est atteint à `vw ≥ 1008 px` au lieu de 1024 px. Aucun seuil ne reproduit exactement `lg`
   (il faudrait ≤ 960 et > 975) ; la bande de 16 px est assumée.
5. **Aperçu inerte** : le bloc d'aperçu porte `inert` (ni focus ni arbre d'accessibilité : les
   liens publics qu'il contient ne doivent pas être activables, et le formulaire reste la source
   accessible). Une couverture en attente n'est pas montrée : mention « visible après
   l'enregistrement ».
6. **Garde** : `CanDeactivateFn<LeaveConfirmable>` où `LeaveConfirmable = { canLeave(): boolean |
   Promise<boolean> }` ; la page ouvre son `ConfirmDialog` et résout la promesse. `beforeunload`
   couvre la fermeture d'onglet.

## Consequences

- Lien direct vers chaque édition, titre de route, retour arrière du navigateur, raccourci
  « Nouveau projet » réel ; la liste redevient une liste.
- Après création, la page navigue vers `/admin/projects/:id` (`replaceUrl`) pour ouvrir la galerie,
  qui exige un identifiant ; la ligne de base est remise à jour **avant** la navigation, sinon la
  garde se déclenche.
- `features/projects` et `features/blog` exposent trois builders de plus ; leurs composants de
  carte changent de mécanisme de bascule (bande de 16 px sur le site public).
- La conversion brouillon → modèle de domaine reste dans l'admin et testée en TypeScript pur.

## Alternatives considered

- **Garder l'édition dépliée** : pas de lien direct, pas de place pour l'aperçu, un seul élément
  en édition. Rejeté par le propriétaire (arbitrage 2).
- **Copier les cartes dans l'admin** : dérive garantie entre l'aperçu et le site. Rejeté.
- **Aperçu dans une `iframe` de la vraie page** : exige que le brouillon soit publié ou un mode
  d'aperçu serveur. Rejeté (pas d'évolution d'API).
- **Réduire l'aperçu par `transform: scale()` d'un rendu pleine largeur** : texte illisible à
  25 rem, et le rendu suit toujours le viewport. Rejeté.
- **Formulaire propriétaire de son modèle, exposé par `viewChild`** : la page lirait l'état d'un
  enfant ; le compteur, la garde et l'aperçu dépendraient d'une requête de vue. Rejeté.
