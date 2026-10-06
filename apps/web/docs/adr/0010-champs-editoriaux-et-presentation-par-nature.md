# ADR-0010 — Champs éditoriaux d'un projet et page Réalisations organisée par nature

- **Statut** : accepté (2026-10-06, arbitrages du propriétaire, spec 012)
- **Date** : 2026-10-06
- **Contexte spec** : `specs/012-refonte-realisations.md`
- **Prolonge** : ADR-0008 (nature `kind`), ADR-0009 (galerie)

## Context

La page `/projects` est refondue d'après une maquette validée : études de cas pour les projets en
production, grille de cartes pour les démos et les scripts, légende et filtres par nature. Chaque
projet y montre une **accroche** et deux **repères** (« Point fort », « Périmètre ») en plus de sa
stack. Le propriétaire a tranché : ce sont de **nouveaux champs** de l'API, saisis dans l'admin, et
non des valeurs dérivées de la description.

Faits vérifiés :

- `project` (Drizzle, repo `nest-portfolio-app`) stocke ses textes en `text`, et les bornes vivent
  dans le DTO (`title` : `text` + `@MaxLength(200)`). Les liens facultatifs sont des `text`
  nullables. Le DTO les accepte à `null` (`@IsOptional` + `@ValidateIf(v !== null)`).
- `UpdateProjectDto` étend `PartialType(CreateProjectDto, { skipNullProperties: false })` : un
  champ n'accepte `null` que s'il le déclare lui-même.
- `ValidationPipe({ whitelist, forbidNonWhitelisted, transform: true })` : un champ inconnu de
  l'API fait répondre 400, et un `@Transform` s'applique à la valeur réellement passée au service.
  Le précédent `ProjectImageAltDto` normalise déjà par `@Transform` (trim).
- Le front n'a pas de validation runtime aux frontières. L'adapter `toProject` est l'unique point
  de normalisation (ADR-0008 §5 : `kind` absent ou inconnu → `null`).
- En production, l'ordre des `tags` ne suit pas l'ordre d'importance. Les quatre premiers de
  DashFlow sont `Angular, TypeScript, TailwindCSS, Docker`, alors que la maquette montre
  `Angular · NestJS · PostgreSQL · Docker`.
- Le filtre actuel de `/projects` (par catégorie) est un signal local, absent de l'URL. La page est
  prérendue une seule fois (`/projects`) et nginx sert ce HTML statique quelle que soit la query.

## Decision

1. **Trois colonnes nullables** sur `project` : `pitch` (accroche), `highlight` (point fort),
   `scope` (périmètre), en `text` sans défaut. `NULL` veut dire « pas encore rédigé ». Aucune
   migration de contenu : la saisie passe par l'admin.
2. **Bornes dans le DTO**, en constantes nommées : `PROJECT_PITCH_MAX = 160`,
   `PROJECT_FACT_MAX = 80` (pour `highlight` comme pour `scope`). Le front reprend les mêmes
   valeurs pour la validation du formulaire. Les deux côtés comptent en `string.length`.
3. **Normalisation au bord de l'API** : `@Transform` coupe les espaces aux extrémités, puis une
   chaîne vide devient `null`. Ainsi `''` et `'   '` effacent le champ comme `null`, et la base ne
   contient jamais de chaîne vide. Absent (`undefined`) dans un PATCH : la valeur reste inchangée.
   Tout autre type répond 400.
4. **Front : `string | null`, jamais `undefined`**. L'adapter ramène à `null` un champ absent, vide
   ou fait d'espaces. Quand l'accroche manque, la page montre la **première phrase de la
   description**, qui est un contenu réel. Un repère manquant est **omis** : sa ligne `dt`/`dd`
   n'est pas rendue. Le front n'écrit jamais de texte de remplacement.
5. **La stack reste dérivée des `tags`**, dans leur ordre : 4 sur une étude de cas, 2 sur une
   carte. Pour obtenir l'affichage de la maquette, il faut réordonner les tags dans l'admin. Ce
   n'est pas un champ de plus.
6. **Présentation par nature** : une étude de cas pour chaque projet `kind === 'production'`,
   quelle que soit la valeur de `featured`. `featured` reste le réglage de la home
   (`isShowcaseProject`). Les autres projets vont dans la grille. Un projet sans nature (`null`)
   va dans la grille, sans tampon. Il n'est visible que sous le filtre « Tous ».
7. **Filtre par nature local**, dans un signal, hors de l'URL, comme le filtre qu'il remplace. Le
   HTML prérendu sert donc toujours l'état « Tous », sans écart d'hydratation ni URL en double à
   indexer.
8. **Introduction générée** à partir des comptes par nature. Une fonction pure n'énumère que les
   natures présentes. Elle reste vraie quand les projets changent, puisque le prérendu la
   recalcule à chaque build.

## Consequences

- L'API doit être déployée **avant** le front (`forbidNonWhitelisted`). Un admin qui envoie
  `pitch` à l'ancienne API reçoit un 400. Un ancien front, lui, ignore les nouveaux champs.
- `ProjectInput` hérite des trois champs (`string | null`). Le formulaire admin doit les envoyer,
  sinon il ne compile pas.
- Tant que les champs ne sont pas saisis, la page s'affiche correctement : première phrase de la
  description, repères absents. Après la saisie, il faut redéployer le front pour que le HTML
  prérendu les montre.
- L'ordre des tags devient un contenu éditorial. La sélection dans l'admin conserve l'ordre de
  saisie (un `Set`) : pour réordonner, on désélectionne puis on resélectionne.
- La pagination de `/projects` disparaît. Le composant partagé `AppPaginator` reste, puisque le
  blog s'en sert.

## Alternatives considered

- **Dériver l'accroche et les repères de la description** : refusé par le propriétaire
  (arbitrage 2). Une coupe automatique ne garantit ni le sens ni la longueur.
- **`varchar(160)` / `varchar(80)` en base** : écarté. Le repo borne ses textes dans le DTO, et une
  contrainte en base doublerait la règle pour un seul écrivain, l'admin. Changer la borne
  demanderait en plus une migration.
- **Rejeter `''` par un 400 au lieu de le normaliser** : écarté. Vider un champ dans l'admin est
  une intention d'effacement légitime. Normaliser au bord garde une seule représentation de
  l'absence (`null`).
- **Un champ `stack` dédié** : écarté. Il ferait doublon avec `tags` pour une différence d'ordre
  seulement.
- **Filtre dans la query (`?nature=demo`)** : écarté. Le HTML prérendu est celui de « Tous », et
  l'hydratation sur une autre branche de rendu provoquerait un écart. Le filtre actuel n'est pas
  dans l'URL non plus.
- **Introduction rédigée en dur** : écartée. Une phrase sans chiffres serait vague, et une phrase
  avec chiffres deviendrait fausse au premier projet ajouté.
- **Études de cas réservées aux projets `featured`** : écarté. La section s'intitule « En
  production » et doit les montrer tous. `featured` sert à composer la home, pas à classer les
  projets.
