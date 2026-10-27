---
id: 038
title: Admin du guide des plaquettes regroupée par matière, en blocs repliables
type: feature
status: draft
created: 2026-10-27
related: [specs/035-guide-plaquettes-simplifie.md, specs/037-guide-alesage-toutes-matieres.md]
---

# 038 — Admin du guide par matière

## Description

### Objectif

Demande du propriétaire (2026-10-27), à partir d'une capture de `/admin/guide-plaquettes`. Chaque
outil y est une carte de cinq champs, et sa matière est ressaisie à chaque fois. Avec 50 outils sur
« 1.8522 (33CrMoV12) », il y aurait 50 cartes, ce qui est trop. Julien veut un écran rangé
proprement.

### Arbitrage (2026-10-27, décision de Julien)

**Par matière, en blocs repliables.** La matière se saisit une seule fois, en tête de son bloc.
Le bloc se replie et affiche son nombre d'outils. Une fois ouvert, il liste ses outils en **lignes
compactes**, une par outil, dans les colonnes Opération, Plaquette, Rayon, Remarque et Retirer.
« Toutes matières » a son propre bloc.

**Seule l'interface change.** Les données (`InsertGuide`, `PUT /api/workshop-guide`), l'API, le
guide public et le décodeur restent tels quels.

### Parcours

1. Julien ouvre l'admin. Il voit un bloc par matière, **replié**, avec le nom de la matière et le
   nombre d'outils (« 12 outils », « 1 outil »). Le bloc « Toutes matières » vient en dernier,
   s'il existe.
2. Il ouvre « 1.8522 (33CrMoV12) ». Le nom de la matière est un champ, qu'il peut corriger : la
   correction vaut pour tous les outils du bloc. En dessous, les outils s'affichent un par ligne.
3. « Ajouter un outil » ajoute une ligne vide à la fin du bloc et place le focus sur son
   opération.
4. « Ajouter une matière » crée un bloc ouvert, avec une ligne d'outil vide, et place le focus sur
   le nom de la matière.
5. « Ajouter le bloc Toutes matières » n'apparaît que si ce bloc n'existe pas encore. Le bloc
   créé est ouvert et contient une ligne vide.
6. Retirer le dernier outil d'un bloc retire aussi le bloc. « Retirer la matière » retire le bloc
   avec tous ses outils.
7. À l'enregistrement, si un champ est invalide dans un bloc replié, ce bloc s'ouvre et le focus
   va au premier champ invalide (`focusFirstInvalid`).

### Exigences

1. **Données inchangées** :
   - le brouillon se range par groupes, que l'on reconstruit à la lecture du document ;
   - les lignes avec matière sont regroupées par **texte exact** de la matière, une fois les
     espaces de bord retirés ;
   - les groupes gardent l'ordre de première apparition dans le document, avec le bloc
     « Toutes matières » à la fin ;
   - à l'envoi, les groupes sont remis à plat, champ par champ, dans l'ordre des blocs puis
     des lignes ;
   - le contrat de `toInsertGuidePayload` est inchangé : `allMaterials: true` sans `material`,
     pas de rayon quand il est vide, pas de remarque vide.
2. **Validation** : celle d'aujourd'hui, à deux changements près.
   - La matière est exigée une fois par bloc, sauf pour le bloc « Toutes matières ».
   - Deux blocs ne peuvent pas avoir le même nom de matière une fois les espaces de bord retirés.
     Le message, sur le second, propose de fusionner les outils dans le premier.
   - Les autres règles ne changent pas : opération exigée, limites de longueur, bornes du rayon,
     garde de confidentialité (spec 035, appliquée au nom de matière et à chaque outil) et
     plafond de 300 lignes au total.
3. **Suggestions (#285)** : le nom de matière d'un bloc garde ses suggestions, à partir des
   matières déjà enregistrées. La plaquette garde les siennes.
4. **Repli** :
   - chaque bloc est un `<details>` natif dont le `<summary>` porte le nom et le compte ;
   - l'état ouvert est piloté par un signal, pour les ouvertures automatiques (ajout, erreur à
     l'envoi) ;
   - un bloc qui vient d'être créé s'ouvre ;
   - après un enregistrement réussi, les blocs gardent leur état.
5. **Accessibilité** :
   - les lignes compactes n'ont pas de libellé visible par cellule : chaque champ reçoit un nom
     accessible complet, par `aria-label` ou par `aria-labelledby` vers l'en-tête de colonne et
     le numéro d'outil, par exemple « Plaquette, outil 2 de 1.8522 (33CrMoV12) » ;
   - les messages d'erreur restent sous le champ, avec `role="alert"`, et sont reliés par
     `aria-describedby` ;
   - « Retirer » a un nom qui dit quel outil il retire ;
   - cibles de 44 px minimum ;
   - zéro violation axe ;
   - le compte du `<summary>` est du texte.
6. **Responsive** :
   - à 1024 px et plus, chaque ligne d'outil tient sur une rangée ;
   - en dessous, la ligne passe sur deux rangées : Opération et Plaquette d'abord, puis Rayon,
     Remarque et Retirer ;
   - aucun libellé n'est rogné (remarque de la revue de la spec 037 : « Toutes matières » coupé
     à 1024 px) ;
   - pas de défilement horizontal de la page.
7. **Découpage** : le template de la ligne admin dépasse 150 lignes (revue de la spec 037). Le
   bloc de matière et la ligne d'outil sont deux composants dumb distincts, chacun sous ce seuil.

### Hors périmètre

- Le tri des blocs ou des outils par glisser-déposer.
- La fusion automatique de deux graphies voisines (« inox 316l » et « Inox 316L »).
- Tout changement côté API, guide public ou décodeur.

## Plan technique

- `admin/application/insert-guide-draft.ts` :
  - nouveau brouillon `InsertGuideDraft = { enabled; decoderEnabled; groups: InsertGuideGroupDraft[] }`,
    avec `InsertGuideGroupDraft = { key; material; allMaterials; tools: InsertGuideToolDraft[] }`
    et `InsertGuideToolDraft = { key; operation; insert; noseRadius; note }` ;
  - `toInsertGuideDraft(guide, previous?)` regroupe les lignes et garde les clés des groupes et
    des outils d'après leur position dans `previous`, comme aujourd'hui ;
  - `toInsertGuidePayload` remet à plat ;
  - `newInsertGuideGroup(allMaterials)` et `newInsertGuideTool()`.
- `admin-insert-guide-form.ts` :
  - schéma `applyEach(path.groups, (group) => { … applyEach(group.tools, …) })` ;
  - validation croisée des noms de matière en double ;
  - plafond de 300 sur la somme des outils ;
  - ajout et retrait par `model.update()` ;
  - focus par `afterNextRender` ;
  - état ouvert par groupe dans un `signal<ReadonlySet<string>>` des clés ouvertes ;
  - après un `submit()` invalide, les groupes en erreur s'ouvrent, puis `focusFirstInvalid`
    s'applique après le rendu.
- Nouveaux composants, qui remplacent `admin-insert-guide-row.ts` :
  - `admin-insert-guide-group.ts` : `<details>` et `<summary>`, champ de nom de matière avec
    suggestions (`app-suggest-input`), outils et boutons d'ajout et de retrait ;
  - `admin-insert-guide-tool.ts` : la ligne compacte, en grille Tailwind.
- La copie admin, nouvelle ou dans le fichier existant si le composant en a un :
  - libellés des blocs ;
  - comptes : « 1 outil » / « N outils », via `@shared/format/counted` qui existe déjà ;
  - noms accessibles.
- Tests (RED d'abord, `data-testid`, builders) :
  - brouillon : regroupement, ordre, bloc générique en dernier, remise à plat, clés gardées ;
  - formulaire et page :
    - blocs repliés et leur compte ;
    - ajout d'outil, de matière et du bloc générique, avec le focus ;
    - retrait d'outil et de bloc ;
    - nom en double refusé ;
    - erreur dans un bloc replié : le bloc s'ouvre et le focus arrive sur le champ ;
    - payload du `PUT` complet ;
    - noms accessibles des champs ;
  - mise à jour de `e2e/a11y/interactive-states.spec.ts` si l'admin du guide y figure ;
  - `DESIGN.md` : quelques lignes sur le motif « bloc repliable et lignes compactes » s'il est
    nouveau.

## Suivi

- **RED (2026-10-27)** : tests du brouillon (`insert-guide-draft.spec.ts`) et de la page
  (`admin-insert-guide.spec.ts`) réécrits pour les blocs, contre des bouchons typés (brouillon
  sans groupes, formulaire sans blocs) : `pnpm test` → **64 failed / 4962**, `Test Files 2 failed
  | 245 passed`, code de sortie **1**, uniquement des échecs d'assertion.
- **GREEN** : brouillon par groupes, `admin-insert-guide-group.ts` (`details` natif, état ouvert
  piloté par le formulaire et resynchronisé par `toggle`) et `admin-insert-guide-tool.ts` (ligne
  compacte, `@utility tool-row-grid`), `admin-insert-guide-row.ts` supprimé : `pnpm test` →
  **4962 passed / 4962**, `Test Files 247 passed`, code de sortie **0**. Un seul ajustement de test
  après le RED : le nom accessible des champs se lit par `aria-label` ou par le `label[for]` du
  champ (le composant de suggestion n'expose pas d'`aria-label` ; le libellé court est visible sous
  `lg`, la suite en `sr-only`).
- **Refactor sous vert** : focus du retrait de bloc par l'id du bouton (plus de `viewChild`),
  repérage de confidentialité du nom de matière sans cas particulier ; tests inchangés, toujours
  verts.
- **Gates** : `pnpm test` 0, `pnpm lint` 0, `pnpm run format:check` 0,
  `pnpm run build --configuration production` 0.
- **Vérification visuelle** (dev server + doublure `ci/api-stub` avec `STUB_ADMIN_SESSION=1` et
  l'indice `auth:session` dans le navigateur, Playwright headless) : blocs repliés avec leur compte,
  ouverture au clic et au clavier, erreur dans un bloc replié → le bloc s'ouvre et le focus arrive
  sur le rayon, une rangée par outil à 1280 et 1024 px, deux rangées à 390 px, aucun défilement
  horizontal (`scrollWidth − clientWidth = 0`), axe zéro violation sur le formulaire ouvert (clair
  1280, clair 390, sombre 1280). Console : seul un 404 sur `/api/config`, absent de la doublure,
  sans lien avec cette spec.
- **e2e a11y** : scénario `/admin/guide-plaquettes` attendu sur `admin-insert-guide-group`, nouvel
  état « bloc de matière ouvert » dans `interactive-states.spec.ts`.
- **Reste ouvert** : sous `lg`, une opération longue (« Alésage (ébauche et finition) ») est tronquée
  dans son `select` natif (demi-largeur) ; la liste déroulante l'affiche entière.

## Review code

### PR front — spec 038 (revue du 2026-10-27)

**Verdict** : REJECTED
**Gates CI locaux** : tests ✅ (`pnpm test`, 4962/4962, 247 fichiers, code 0, après `ng cache clean`) / lint ✅ (`pnpm lint`, code 0) / format ✅ (`pnpm run format:check`, code 0) / build ✅ (`pnpm run build --configuration production`, code 0, prerender et CSP compris) ; `pnpm a11y:typecheck` code 0
**Checks mécaniques** : checker non vendoré (`.claude/checks/` absent) : auto-checks joués à la main sur les lignes ajoutées ; un hit d'archéologie (`/**`, point 1), zéro `fakeAsync`/`waitForAsync`, `styles:`, `ngModel`, `innerHTML`, `console.`, `export default`, `effect(`, `.only`/`.skip`
**Warnings de gate** : aucun
**Rendu compilé** : N/A (aucun composant à sélecteur d'attribut sous `shared/ui`, pas de `styles:`)
**Preuve de verify runtime** : ✅ rejouée par le reviewer (image Docker de la branche, `ci/a11y-stack.sh up`, Playwright) : `/admin/guide-plaquettes` à 375, 1024 et 1280 px, trois blocs repliés, ouverture et fermeture par Entrée sur le `summary` (l'attribut `open` suit), « Ajouter un outil » met le focus sur `insert-guide-g1-t4-operation`, `scrollWidth − clientWidth = 0` replié et ouvert. Verdict PASS. Console : un seul 404 sur `/api/config`, route absente de la doublure, hors diff. `pnpm a11y --grep "insert guide|guide-plaquettes"` : 6/6 passés (page admin et nouvel état « bloc de matière ouvert », clair et sombre), code 0
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ❌ (point 1)
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ✅

**Contrat du `PUT`** : vérifié, inchangé. `toInsertGuidePayload` garde le même corps par outil : `allMaterials: true` sans `material`, `material.trim()` sinon, rayon omis s'il est `null` ou `NaN`, remarque vide omise. Les tests qui l'épinglent : `insert-guide-draft.spec.ts` (aplatissement bloc après bloc, champ par champ ; bloc générique sans matière ni rayon ; rayon vide ; aller-retour brouillon → payload → brouillon) et `admin-insert-guide.spec.ts` (payload complet avec version 7, matière corrigée appliquée aux deux outils). Seul changement visible côté API : **l'ordre des entrées**. Les lignes d'une même matière sont désormais contiguës, dans l'ordre de première apparition, le générique en dernier. Le premier enregistrement réordonne donc le document stocké. Le site trie par matière, et la spec (exigence 1) le prévoit.

**Tests de l'ancien `admin-insert-guide.spec.ts`** : rien n'est perdu. Payload, version 8 au second envoi, 409 (toast et brouillon conservé), 400, envoi en cours, interrupteurs du guide et du décodeur, bornes de longueur et du rayon, plafond de 300 (et 300 répartis sur deux blocs acceptés), confidentialité (outil, bloc générique, nom de matière, code ISO décodable ou non, non bloquante) et suggestions (y compris la saisie au clavier puis l'envoi) sont tous là. Seuls ont disparu les tests de la case « Toutes matières » par ligne, car le contrôle n'existe plus. Conséquence fonctionnelle : on ne peut plus faire passer un outil d'une matière vers le bloc générique sans le ressaisir. La spec le permet, mais il faut le savoir.

**Synchronisation `<details>` ↔ signal** : correcte. `[open]` côté hôte écrit la propriété, `(toggle)` filtré sur `event.target === host` écrit le `model()`, le formulaire range les clés ouvertes dans un `ReadonlySet`. Une ouverture programmatique déclenche un `toggle` qui réécrit la même valeur, sans boucle. Les cas couverts par les tests : ouvert puis replié à la main puis rouvert par un ajout, bloc invalide ouvert à l'envoi avec le focus sur le champ, état conservé après un enregistrement réussi. Je l'ai aussi vérifié au clavier dans Chromium. Le `model()` est justifié : le parent et l'enfant écrivent tous les deux l'état ouvert.

**Conventions** : `applyEach` imbriqué (groupes puis outils), doublon validé sur le second bloc par `valueOf(path.groups)`, ajout et retrait par `value.update()`, focus par `afterNextRender({ write })`, aucun `styles:`, `data-testid` partout, composants dumb sous 150 lignes de template (formulaire environ 104, bloc environ 99, outil environ 123). `@utility tool-row-grid` est conforme à ADR-0003 : c'est un conteneur de layout partagé par deux éléments de deux composants (l'en-tête de colonnes du bloc et l'hôte de chaque ligne), qui doivent garder des colonnes identiques. Le bloc de commentaire suit le gabarit de section du fichier.

**Avis sur les points de l'implémenteur** :
1. **Valeurs rognées.** L'exigence « aucun libellé n'est rogné » vise les libellés : titre du `summary`, en-têtes de colonnes, libellés courts, boutons. Elle vient du « Toutes matières » coupé de la revue 037. Les valeurs n'en font pas partie. Un champ texte qui défile reste lisible au curseur. Le `select` sous `lg` coupe la valeur, mais les options restent distinguables (« Ébauche extéri… » / « Ébauche intéri… ») et la liste ouverte les montre entières : ce n'est pas bloquant. En revanche, à 1024 px, la colonne Plaquette (environ 125 px) est la plus étroite des colonnes de texte, alors qu'elle porte la donnée clé (un code ISO fait souvent 14 caractères ou plus). Pendant ce temps, Opération réserve 16rem. Je recommande de rééquilibrer `tool-row-grid` dès `lg` en prenant sur Remarque, par exemple Plaquette en `minmax(9rem,1.5fr)` et Remarque en `minmax(0,1fr)`, à mesurer. Non bloquant.
2. **Libellés.**
   - « Le bloc « X » existe déjà : déplacez-y ces outils et retirez ce bloc » : « déplacez-y » promet une action de déplacement que l'écran n'offre pas (il faut ressaisir). Proposition : « Le bloc « X » existe déjà : ajoutez-y ces outils, puis retirez ce bloc. » À trancher avec Julien : deux blocs du même nom fusionnent naturellement à la relecture, donc les accepter coûterait moins à l'utilisateur que les refuser. C'est un changement de spec, hors de cette PR.
   - « 300 outils au plus » : correct, mais l'erreur s'affiche sous la liste et peut se lire comme une limite par bloc. « 300 outils au plus, toutes matières confondues » lève l'ambiguïté.
   - « Nouvelle matière » : acceptable comme titre provisoire. En revanche, il a le même poids visuel qu'un vrai nom, et les champs du même bloc s'appellent « … du bloc 3 ». Le `summary` et les noms accessibles n'emploient donc pas le même vocabulaire. Le titre pourrait passer en `text-muted`, et les deux noms s'aligner.
3. **Bouton Retirer en icône seule** : acceptable. Le 2.5.3 ne s'applique pas sans texte visible, le nom complet satisfait le 1.1.1 et le 4.1.2, et la cible fait 44 px (`min-w-11`). Il reste toutefois un défaut, objet du point 2 ci-dessous.
4. **345 lignes** : le diff fait passer le fichier de 236 à 343 lignes, au-delà du seuil advisory de 250. Le template reste à environ 104 lignes. Non bloquant (voir « Altitude composant »).
5. **État e2e « bloc de matière ouvert »** : exécuté par le reviewer contre l'image de la branche. Il passe en clair et en sombre, avec zéro violation. Attention : le job a11y ne tourne plus sur les PR (hebdomadaire depuis le 2026-10-26), donc seul ce passage local l'atteste.

**Tests notables** :
- ⚠️ `admin-insert-guide.spec.ts` (helper `accessibleName`) : lit le `textContent` du `label`, pas le nom calculé par le navigateur. Dans Chromium, le nom réel est « Opération , outil 1 de Acier témoin » : une espace avant la virgule, introduite par le `span` `sr-only` hors flux. Le test affirme « Opération, outil 1… ». Ce n'est pas faux pour la synthèse vocale, mais c'est visible en braille, et l'oracle diverge du navigateur.
- ⚠️ Nom accessible : « outil 1 **de** Acier témoin » ne fait pas l'élision devant une voyelle. Une forme sans article, « outil 1, Acier témoin », l'éviterait pour toute matière.
- ✨ `admin-insert-guide.spec.ts`, test « invalid field in a folded block » : il épingle à la fois l'ouverture du seul bloc fautif et le focus sur le champ, c'est-à-dire le cœur de l'exigence de parcours 7.

**Altitude composant** (advisory, non bloquant) :
- ⚠️ `src/app/features/admin/application/components/admin-insert-guide-form.ts` : 343 lignes (contre 236 sur `master`), template d'environ 104 lignes, 2 dépendances. Découpe possible : sortir les validateurs purs (`boundedText`, `radiusError`, `duplicateError`) et la fonction de schéma dans un `insert-guide-validation.ts` sans dépendance DOM. Le composant garderait les commandes d'ajout et de retrait et le focus.

**Risque résiduel** (advisory) :
- réversibilité et monitoring non renseignés dans le profil.
- Le premier enregistrement réordonne les entrées stockées (contiguës par matière). Un revert du front ne restaure pas l'ordre d'origine. C'est sans effet visible tant que le site trie par matière.
- « Retirer la matière » supprime tous les outils du bloc sans confirmation. Seuls « Annuler » et la garde de sortie rattrapent l'erreur avant l'enregistrement.

**Points à corriger** :
1. `src/app/features/admin/application/components/admin-insert-guide-tool.ts:149` : `/** Fin du nom accessible : « de 1.8522 (33CrMoV12) », « du bloc 3 ». */` est un hit du motif d'archéologie du profil (`/\*\*`). C'est un QUOI (exemple de valeur), pas un WHY. Retirer le commentaire. Si le nom `owner` a besoin d'être expliqué, le renommer (par exemple `nameSuffix`) à la place.
2. `src/app/features/admin/application/components/admin-insert-guide-tool.ts:131` : `<span class="sr-only">Retirer</span>` n'est jamais exposé, car l'`aria-label` du bouton le remplace (le snapshot ARIA de Chromium donne le nom « Retirer l'outil 1 de … », avec un contenu « Retirer » ignoré). C'est du balisage mort. Ne garder qu'une source du nom : soit l'`aria-label`, soit, de préférence parce que les outils de traduction le traduisent, le `span` `sr-only` portant le nom complet `removeLabel()` sans `aria-label`. Le motif n'existe qu'une fois dans le diff : les boutons du bloc ont un texte visible.

**Suite** : les points de la revue sont corrigés en session.

- **Bloquant 1** : le JSDoc de `owner` est retiré. Le nom de l'input reste, mais il porte maintenant le nom nu (`Acier témoin`, `bloc 3`).
- **Bloquant 2** : le bouton de retrait d'un outil n'a plus d'`aria-label`. Son nom complet est dans le `span` masqué : « Retirer l'outil 1 (Acier témoin) ».
- **Remarques traitées** :
  - les noms des champs suivent la forme « Plaquette (outil 2, Acier témoin) », ce qui supprime l'espace avant la virgule et le « de » sans élision ;
  - le message de doublon devient « ajoutez-y ces outils, puis retirez ce bloc » ;
  - le plafond devient « 300 outils au plus, toutes matières confondues » ;
  - la colonne Opération passe de 16rem à 15rem, et Plaquette de 1.3fr à 1.6fr.
- **Tests** :
  - RED : 6 failed / 4962, code de sortie 1 (attentes mises à jour avant le code) ;
  - GREEN : 4962 passed / 4962, code de sortie 0 ;
  - lint, format:check et le build de production sortent en 0.
