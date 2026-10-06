# ADR-0008 — Nature d'un projet : champ `kind` fermé côté API, aucune inférence côté front

- **Statut** : accepté (2026-10-06, arbitrage du propriétaire, spec 011)
- **Date** : 2026-10-06
- **Contexte spec** : `specs/011-realisations-nature-galerie.md`
- **Amende** : la règle d'honnêteté de la spec 010 (« aucun visuel de démo dans `/projects` ») et
  le *Don't* correspondant de `DESIGN.md`

## Context

Les Réalisations listent six projets servis par l'API (`project`, repo `nest-portfolio-app`).
Deux sont des applications en service (DashFlow, CandiDash), deux des sites de démonstration à
l'activité fictive (Coaching Life, Le Vieux Comptoir), deux des scripts Bash. Rien ne les
distingue : l'en-tête du détail affiche même « Voir la démo » sur DashFlow, qui est en production.

Faits vérifiés :

- `category` (`text` libre, 7 valeurs proposées par l'admin) sert de filtre « Application Web /
  Script ». Elle ne dit pas si le service est réel.
- Le précédent de colonne à valeurs fermées est `blog_post.status` : `text('status', { enum })`
  côté Drizzle, `@IsIn([...])` côté DTO (`class-validator`, pas Zod, dans ce module).
- `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` : un champ inconnu de l'API
  fait répondre 400. Un front qui envoie `kind` à une API qui ne le connaît pas casse
  l'enregistrement d'un projet.
- `@IsOptional()` laisse passer `null` : sur une colonne `NOT NULL`, un `kind: null` finirait en
  erreur 500.
- Les migrations Drizzle sont jouées au démarrage du conteneur (`CMD pnpm db:migrate && node …`).
- La spec 010 interdisait toute démo dans `/projects`. Or Coaching Life et Le Vieux Comptoir y sont
  déjà, et la spec 011 les y garde en les marquant. La règle visait à ce qu'une démo ne passe
  jamais pour une référence client. Le tampon « Démo » atteint ce but sans retirer les projets.

## Decision

1. **Champ `kind` sur `project`**, union fermée `'production' | 'demo' | 'script'`, distincte de
   `category`. Colonne `text('kind', { enum: PROJECT_KINDS })`, `NOT NULL DEFAULT 'demo'`, plus une
   contrainte `CHECK` qui reproduit l'union en base.
2. **Défaut `demo`** : la valeur qui affirme le moins. Le défaut ne sert qu'au moment où la colonne
   est ajoutée et pour un client qui crée un projet sans envoyer `kind`. Un projet n'est jamais
   « en production » par défaut.
3. **Backfill dans une migration personnalisée** (`drizzle-kit generate --custom`), par slug :
   `dashflow` et `candidash` passent en `production`, `labelsync-pro` et `gitpush-auto` en
   `script`. Les autres gardent `demo`. Ainsi la valeur juste est en base dès que l'API redémarre,
   avant que le front affiche un seul badge. En local, un slug absent ne fait rien.
4. **DTO** : `kind` est optionnel, mais `null` est refusé (`@ValidateIf((_, v) => v !== undefined)`
   puis `@IsIn`). `UpdateProjectDto` en hérite par `PartialType`.
5. **Front : jamais d'inférence.** Si l'API n'envoie pas `kind` ou envoie une valeur inconnue,
   l'adapter donne `kind: null`. Avec `null`, aucun tampon ne s'affiche et le lien reçoit un
   libellé neutre. Le front ne déduit jamais la nature de `category`, de `liveUrl` ou d'un slug.
6. **Écriture typée** : `ProjectInput.kind` est un `ProjectKind` non nul. Un envoi de `null` ne
   compile pas.
7. **Honnêteté** : une démo peut figurer dans les Réalisations (liste et détail) si elle porte le
   tampon « Démo » dans le gabarit. Elle n'apparaît **jamais sur la home**. La section « Des
   projets en production » ne retient que les projets `featured` **et** `kind === 'production'`
   (prédicat pur `isShowcaseProject`, appliqué côté front) : son titre reste vrai quel que soit le
   réglage `featured`. Aucune donnée structurée ne présente une démo comme travail pour un client
   (avis, témoignage, référence).
   Cette règle remplace celle de la spec 010 (§ 2, critère 6) et de `DESIGN.md`, réécrites dans le
   même esprit.
8. **Ordre de déploiement** : l'API d'abord, puis le front (CLAUDE.md, item 10). Si on inverse, le
   champ `kind` envoyé par le nouveau formulaire d'administration fait répondre 400 à l'ancienne
   API.

## Consequences

- La nature se modifie dans l'admin (sélecteur obligatoire). Un nouveau projet n'a aucune nature
  présélectionnée.
- `Record<ProjectKind, string>` pour les libellés : ajouter une nature fait échouer la compilation
  à chaque endroit qui doit lui donner un libellé.
- La colonne garde une valeur par défaut. Un client ancien qui crée un projet obtient `demo`, et
  l'admin corrige la valeur ensuite.
- `DESIGN.md` : le *Don't* « aucune démo dans les Réalisations » devient « aucune démo sans
  tampon, aucune sur la home ».
- Un projet `featured` dont la nature n'est pas `production` (ou est absente) disparaît de la
  home sans message. L'admin doit le savoir : c'est voulu.

## Alternatives considered

- **Table statique côté front** (slug → nature). Rejeté par le propriétaire le 2026-10-06 : la
  nature est une donnée du projet, modifiable dans l'admin.
- **Déduire la nature de `category`.** Rejeté : `Application Web` couvre à la fois des
  applications en production et des démos.
- **`pgEnum`.** Rejeté : le repo n'en a aucun, et le précédent `blog_post.status` (`text` + `enum`
  Drizzle) suffit. Faire évoluer un `pgEnum` exige un `ALTER TYPE` à part.
- **Défaut `production`.** Rejeté : en cas d'oubli, un site fictif passerait pour un service réel.
- **Booléen `isDemo`.** Rejeté : il ne peut pas représenter le troisième cas, le script.
- **Backfill fait à la main dans l'admin après le déploiement.** Rejeté : pendant ce délai, le
  front afficherait « Démo » sur DashFlow et CandiDash.
