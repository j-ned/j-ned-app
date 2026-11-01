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

## Review code

### PR front — spec 037 (revue du 2026-10-27)

**Verdict** : REJECTED
**Gates CI locaux** : tests ✅ (`pnpm test`, sortie 0, 4945/4945, 247 fichiers) / lint ✅ (`pnpm lint`, sortie 0, « All files pass linting ») / format ✅ (`pnpm run format:check`, sortie 0) / build ✅ (`pnpm run build --configuration production`, sortie 0, postbuild CSP 3 pages)
**Checks mécaniques** : checker non vendoré (`.claude/checks/` absent) : auto-checks joués à la main sur les lignes ajoutées — archéologie 0 hit (motif du profil), `export default`/`effect(`/`fakeAsync`/`innerHTML`/`console.`/snapshot/`any` 0 hit, `.sort` 1 hit sur une copie (`[...new Set()]`, pas de mutation partagée)
**Warnings de gate** : aucun (test, lint, format et build sans warning)
**Rendu compilé** : N/A (ni `shared/ui/**` ni nouvelle page)
**Preuve de verify runtime** : ✅ (rejouée par la revue, la section Suivi n'avait ni capture ni console). Steps : doublure `ci/api-stub` (`PORT=4931`, `STUB_ADMIN_SESSION=1`) ; serveur SSR de `dist/` avec `API_UPSTREAM` (HTML serveur de `/atelier/plaquettes?matiere=Acier témoin` et `Laiton témoin` : ligne « Alésage (ébauche et finition) / Toutes matières / BARRE-TEMOIN-1 / — » au rang de son opération sous les deux matières) ; `ng serve` relayé à la doublure, navigateur 1024×768 : page publique hydratée (« Angular hydrated 8 component(s) »), même tableau ; admin `/admin/guide-plaquettes` : la case coche et décoche, le champ Matière sort du DOM puis revient vide, le focus reste sur la case ; rayon vidé puis « Enregistrer » : le `PUT` part en 200 avec `{ allMaterials: true, operation, insert, note }`, sans `material` ni `noseRadius`. Verdict PASS. Console : seule erreur, `GET /api/config` 404, route que la doublure ne sert pas (hors diff). Captures prises dans la session de revue.
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ✅
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ❌ (le `track` du guide public, voir point 1)

**Contrat API** (`nest-portfolio-app`, `ecda69b`) : conforme. `boring` est entre `internal-finishing` et `drilling` des deux côtés. Le DTO front (`material?`, `allMaterials?: boolean`, `noseRadius?: number | null`) accepte tout ce que l'API renvoie : les documents stockés n'ont jamais de `null`, et `material` est absent sur une ligne générique. Le payload (`allMaterials: true` sans `material`, `noseRadius` omis quand il est vide) passe les `@ValidateIf` du DTO API. Vérifié en vrai par le `PUT` ci-dessus contre la doublure.

**Points signalés par l'implémenteur** :
1. Handler `(change)` à côté de `[formField]` sur la case : **accepté**. La règle de CLAUDE.md interdit les attributs qui disputent sa valeur à `[formField]` (`[value]`, `disabled`, `required`…), pas un écouteur. Ici le handler écrit un autre champ du modèle, au geste de l'utilisateur, ce qu'exige l'arbitrage 2. Le vidage sert aussi à la garde de confidentialité, qui lit `material`. Un `effect()` qui réécrirait le modèle serait le contre-modèle. Lire `event.target.checked` ne dépend pas de l'ordre des deux écouteurs, ce qui le rend plus sûr que de lire `allMaterials().value()`. Vérifié dans le navigateur.
2. Libellés admin écrits dans le template : **accepté**, c'est cohérent avec « Matière », « Remarque (facultative) » et l'avertissement de confidentialité du même composant. La copie centralisée (`INSERT_GUIDE_COPY`) ne sert qu'au guide public.
3. Légende « Plaquettes pour Toutes matières » : **à corriger, non bloquant**. La majuscule en milieu de phrase vient de ce que le libellé sert aussi d'entrée de liste. Correction en deux lignes : passer la légende à « Plaquettes pour toutes les matières » quand `material() === copy.allMaterials`, ou la mettre en minuscule dans `caption`. À faire dans le même passage que le point 1.
4. Tests existants modifiés (rayon non requis) : **légitime**. C'est la recalibration de l'arbitrage 3, un changement de contrat assumé, pas une « adaptation mécanique ». Les attentes `required: 'true'` deviennent `null` et l'alerte « Ce champ est obligatoire » du rayon devient `null`, avec des titres de test réécrits. Le balayage (`grep` sur `noseRadius: null`, `radius.*required`, `sans rayon`) ne trouve plus aucune suite qui exige le rayon. Le test qui écartait du payload une ligne au rayon `null` est remplacé par deux cas : avec matière et toutes matières.

**Tests notables** :
- ✨ `insert-guide.spec.ts` (`Given a boring line for all materials`) : `it.each` sur deux matières qui lit les cellules rendues. Le rang d'opération, la mention et le tiret sont épinglés au DOM.
- ✨ `admin-insert-guide.spec.ts` (`toutes matières`) : la case est cochée par un vrai clic, et le test vérifie la sortie du champ du DOM, son retour à vide et le payload émis.
- ⚠️ `insert-guide-draft.spec.ts:161-205` : les brouillons d'entrée sont des littéraux. Il n'existe pas de builder de `InsertGuideRowDraft` et le fichier faisait déjà ainsi : constat informatif, non bloquant.

**Altitude composant** (advisory, non bloquant) :
- ⚠️ `admin-insert-guide-row.ts` : le template passe de 133 à 150 lignes (seuil 150), pour 190 LOC. Découpe possible : le bloc « Matière + Toutes matières » (`@if` + case) ou le bloc rayon (champ, indice, erreur) en sous-composant.

**Risque résiduel** (advisory) :
- réversibilité : déploiement continu (Dokploy) · monitoring : Sentry.
- Ordre de merge : ce front se merge **après** la mise en prod de l'API `ecda69b`. Sinon le `PUT` d'une ligne générique ou sans rayon est refusé par l'ancien DTO (CLAUDE.md, workflow item 10).
- Non couvert par les gates : le rendu admin à 1024 px. La colonne Matière y fait 63 px (grille d'avant le diff) et le libellé « Toutes matières » y est rogné. C'est cosmétique, et l'audit axe hebdomadaire le verra s'il touche au contraste ou au focus.

**Points à corriger** :
1. `src/app/features/workshop/pages/insert-guide/insert-guide.ts:94` : `track row.operation + row.insert + row.noseRadius + row.allMaterials` ne suit pas le plan technique (« il ajoute l'index du document ou une clé stable »). Deux lignes génériques de même opération et de même référence sans rayon donnent la même clé, puisque les deux tirets sont identiques et que seules leurs remarques diffèrent : c'est le cas que la spec introduit (une barre « au besoin », plusieurs remarques). On aurait alors des clés dupliquées (avertissement NG0955 en dev) et un recyclage de DOM faux. Correction attendue : `rowsFor` porte l'index de la ligne dans le document (par exemple `key: number`, posé avant le `filter`), et le `track` s'appuie dessus. Ajouter un test du domaine et un test de page avec deux lignes génériques de même opération et de même plaquette, aux remarques différentes, qui s'affichent toutes les deux dans l'ordre.

**Suite** : #286 a été mergée avant la fin de cette revue, donc les corrections arrivent dans une PR de suivi qui part de master.

- **Point bloquant** : `rowsFor` donne à chaque ligne sa place dans le document comme `key`, posée avant le filtre, et le tableau suit `track row.key`.
- **Légende** : quand seule « Toutes matières » est proposée, la légende lit « Plaquettes pour toutes les matières ».
- **Tests RED** : 6 failed / 4947, code de sortie 1, uniquement des échecs d'assertion (avec `key: 0` en bouchon). Le test de page change de matière pour que la liste soit réconciliée, parce qu'Angular ne signale NG0955 qu'à la mise à jour. Au premier rendu, ce test passait sans la correction.
- **GREEN** : 4947 passed / 4947, code de sortie 0.
- **Remarques non bloquantes non traitées** : le template de la ligne admin fait 150 lignes, et la colonne Matière est rognée à 1024 px.
