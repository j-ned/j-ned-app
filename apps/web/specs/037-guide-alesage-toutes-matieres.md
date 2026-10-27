---
id: 037
title: Guide des plaquettes — opération Alésage, lignes « toutes matières », rayon facultatif
type: feature
status: draft
created: 2026-10-27
related: [specs/035-guide-plaquettes-simplifie.md, specs/036-decodeur-plaquettes.md]
---

# 037 — Alésage, toutes matières, rayon facultatif

## Description

### Objectif

Demande du propriétaire (2026-10-27). Certains outils d'alésage font l'ébauche **et** la finition,
par exemple les barres HORN. Ils s'utilisent sur toutes les matières, et leur diamètre se choisit
selon le besoin. Le guide (spec 035) ne sait pas les ranger aujourd'hui, pour trois raisons :

- chaque ligne a une seule opération ;
- chaque ligne a une seule matière ;
- le rayon de bec est obligatoire, alors qu'une ligne générique n'a pas de rayon unique.

### Arbitrages (2026-10-27, décisions de Julien)

1. **Nouvelle opération « Alésage (ébauche et finition) »** (`boring`), rangée juste après
   « Finition intérieure ». « Ébauche intérieure » et « Finition intérieure » restent, pour les outils
   spécialisés. Aucune ligne existante n'est convertie.
2. **Case « Toutes matières »** sur la ligne. Quand elle est cochée, le champ « Matière » est vidé
   et masqué, et la ligne s'affiche dans le guide public sous **chaque** matière, sans être
   recopiée.
3. **Rayon de bec facultatif** : un champ vide veut dire « pas de rayon unique », et le guide
   affiche un tiret. Un rayon saisi garde ses bornes : il doit être strictement positif, au plus
   10 mm, avec deux décimales au plus.
4. **Rien d'autre ne change** dans les champs de saisie. La référence générique (par exemple
   « HORN Supermini 105 ») et la remarque (« choisir le diamètre au besoin ») sont du texte libre,
   que Julien saisit lui-même. Le site n'invente ni ne retire aucune partie d'une référence.

### Parcours

1. **Admin**, `/admin/guide-plaquettes`. Julien ajoute une ligne, choisit « Alésage (ébauche et
   finition) », coche « Toutes matières », tape sa référence et sa remarque, et laisse le rayon
   vide. Il enregistre.
2. **Guide public**, `/atelier/plaquettes`. Le visiteur choisit « Inox 316L ». La ligne d'alésage
   apparaît parmi les lignes propres à l'inox, à la place de son opération, avec la mention
   « Toutes matières » et un tiret pour le rayon. Elle apparaît de la même façon sous chaque autre
   matière.
3. **Guide sans matière propre** : s'il n'y a que des lignes « toutes matières », le choix de
   matière propose la seule entrée « Toutes matières », qui les affiche.

### Exigences

1. **API d'abord** (repo `nest-portfolio-app`) :
   - `boring` est ajouté à `WORKSHOP_GUIDE_OPERATIONS`.
   - La ligne accepte `allMaterials` (booléen facultatif). Quand il est vrai, `material` peut
     manquer ou être vide ; sinon `material` reste obligatoire.
   - `noseRadius` devient facultatif (absent ou `null`), avec les mêmes bornes quand il est
     présent.
   - Stockage : `allMaterials: true` sans `material` ; `noseRadius` omis quand il est absent ;
     jamais de `null` ni de chaîne vide dans le `jsonb`.
   - Lecture : les documents déjà enregistrés restent valides tels quels.
   - Le front d'avant la spec, qui envoie toujours `material` et `noseRadius`, reste accepté.
2. **Front ensuite**, mergé après le déploiement de l'API (CLAUDE.md, workflow item 10) :
   - modèle, DTO et adaptateur suivent l'API ;
   - l'opération a son libellé ;
   - l'admin affiche la case et le rayon facultatif ;
   - le guide public affiche les lignes « toutes matières » sous chaque matière.
   - `ci/api-stub` porte au moins une ligne « toutes matières » sans rayon, et le prerender ou le
     smoke la vérifie.
3. **Suggestions** (#285) :
   - une ligne « toutes matières » n'ajoute rien aux suggestions de matière, puisque c'est
     l'absence de matière ;
   - sa référence entre dans les suggestions de plaquette de l'admin ;
   - côté décodeur, elle ne compte que si elle se décode (règle actuelle des codes du guide).
4. **Garde de confidentialité** : la règle de la spec 035 s'applique aussi aux lignes
   « toutes matières ».
5. **Accessibilité** :
   - la case est un vrai `<input type="checkbox">` avec un `<label>` ;
   - le champ Matière masqué sort de l'arbre d'accessibilité (`@if`, pas `hidden` visuel) ;
   - la mention « Toutes matières » est du texte, pas seulement une couleur ou une icône.

### Hors périmètre

- Plusieurs opérations cochées sur une même ligne.
- Un champ diamètre, ou le décodage des références HORN.
- La remise en forme générale du guide (« on verra plus tard »).

## Plan technique

### API (`nest-portfolio-app`, PR 1)

- `workshop-guide-content.ts` : `boring` est ajouté entre `internal-finishing` et `drilling`. La
  ligne devient
  `{ operation; insert; note?; noseRadius?: number } & ({ material: string; allMaterials?: never } | { allMaterials: true; material?: never })`,
  ou une forme équivalente lisible.
- `dto/update-workshop-guide.dto.ts` :
  - `allMaterials` : `@IsOptional() @IsBoolean()` ;
  - `material` : `@ValidateIf((o) => o.allMaterials !== true)` ;
  - `noseRadius` : `@ValidateIf` sur une valeur non nulle, mêmes validateurs qu'avant.
- `workshop-guide-document.ts` (`toWorkshopGuideContent`) : écrit `allMaterials: true` sans
  `material`, et omet `noseRadius` quand il est absent ou `null`.
- Tests (DTO, service, controller) d'abord en RED. Ils couvrent :
  - la ligne générique valide ;
  - la ligne générique avec une matière vide ;
  - la ligne normale sans matière, refusée ;
  - le rayon absent, puis `null` ;
  - le rayon à 0, refusé ;
  - un corps d'ancien front, toujours accepté ;
  - un document stocké d'avant, relu à l'identique.

### Front (`ng-portfolio-app`, PR 2)

- Domaine :
  - `MachiningOperation` gagne `'boring'` ;
  - `MACHINING_OPERATIONS` gagne `{ id: 'boring', label: 'Alésage (ébauche et finition)' }`
    après `internal-finishing` ;
  - `InsertGuideEntry` a `material?` et `allMaterials?: true`, et `noseRadius?: number` ;
  - `InsertGuideRow` a `noseRadius?: number` et `allMaterials: boolean`.
- `insert-guide-rows.ts` :
  - `materialsOf` ignore les lignes génériques ; s'il ne reste aucune matière et qu'il existe des
    lignes génériques, la liste vaut `['Toutes matières']` (libellé dans la copie, pas dans le
    domaine : le domaine renvoie une liste vide et un booléen, ou la page compose) ;
  - `rowsFor(material)` renvoie les lignes de la matière et les lignes génériques, triées par
    opération.
- Infra :
  - `insert-guide.types.ts` : DTO aligné sur l'API ;
  - `insert-guide.adapter.ts` : recopie champ par champ, sans `null` ni chaîne vide dans le
    modèle.
- Admin :
  - `insert-guide-draft.ts` : le brouillon gagne `allMaterials: boolean` (`false` par défaut) ;
    `noseRadius: number | null` existe déjà ;
  - le payload omet `material` quand la case est cochée, et omet `noseRadius` quand il vaut
    `null` ;
  - une ligne n'est plus écartée parce que son rayon est vide ;
  - `admin-insert-guide-form.ts` : la validation de matière n'exige rien quand `allMaterials` est
    vrai, et le rayon n'est validé que s'il est rempli ;
  - `admin-insert-guide-row.ts` : la case « Toutes matières » ; `@if` autour du champ Matière ;
    l'indice du rayon dit qu'il est facultatif.
- Guide public, `insert-guide.ts` :
  - affiche un tiret quand il n'y a pas de rayon, en adaptant `noseRadiusLabel` si besoin ;
  - porte la mention « Toutes matières » sur les lignes génériques ;
  - le `track` ne dépend plus de `noseRadius` seul : il ajoute l'index du document ou une clé
    stable.
- `ci/api-stub/fixtures/workshop-guide.json` : une ligne `boring` générique sans rayon, avec des
  données fictives, jamais une vraie référence d'employeur (ADR-0032).
- Tests (RED d'abord) :
  - domaine (`insert-guide-rows`) ;
  - adaptateur ;
  - brouillon ;
  - admin (case, payload, validation) ;
  - guide public (ligne générique sous deux matières, tiret, mention).

### Ordre

1. Merger la PR API.
2. Vérifier en prod que `PUT` accepte une ligne générique (test du DTO) et que le `GET` est
   inchangé.
3. Merger la PR front.

### Risques

- Un front d'avant la spec qui lit une ligne générique planterait sur `material` absent. Ce n'est
  possible que si une ligne générique est saisie entre le déploiement de l'API et celui du front,
  et c'est l'admin du nouveau front qui la crée. L'ordre de déploiement suffit.

## Suivi

- **2026-10-27, front, tranche unique** : RED 27 failed / 4945 tests (`pnpm test`, sortie 1 ; tests
  compilés sur les seuls types, comportement d'avant) · GREEN 4945 passed / 4945 (sortie 0) ·
  `pnpm lint` 0 · `pnpm run format:check` 0 · `pnpm run build --configuration production` 0 ·
  rendu serveur contre `ci/api-stub` : la ligne d'alésage générique apparaît sous « Acier témoin »
  et « Laiton témoin », avec la mention et un tiret · refactor : commentaire descriptif retiré.
