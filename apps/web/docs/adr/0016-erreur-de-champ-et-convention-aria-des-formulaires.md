# ADR-0016 — Erreur de champ partagée et convention ARIA des champs de formulaire

- **Statut** : proposé (2026-10-08)
- **Date** : 2026-10-08
- **Contexte spec** : `specs/017-intake-audit-decoupage.md` (constats F006, F007, F008 ; propositions P3, P4 ; lots L5 et L6)

## Context

Tous les formulaires du dépôt sont en Signal Forms (`@angular/forms/signals`, Angular 22.2.1).
L'affichage de « la première erreur du champ touché, sous lui, en `role="alert"` » (règle de
`CLAUDE.md`) est écrit à la main dans 11 fichiers (23 affichages mesurés sur `acda8c0`), sous trois
formes : `p` avec `id`, `span` sans `id`, `span` avec `id` et `data-testid`.

Faits vérifiés dans `node_modules/@angular/forms` (22.2.1) :

- La directive `FormField` ne pose sur l'élément que `required`, `disabled`, `readonly` et `name` :
  ni `aria-invalid`, ni `aria-describedby` (aucune occurrence de ces attributs dans
  `fesm2022/*.mjs`). L'état invalide et le lien vers le message sont donc à la charge du gabarit.
- `FieldState.errorSummary()` rend les erreurs du champ **et de ses descendants**, triées par
  position dans le DOM de leur premier contrôle lié (`compareErrorPosition`, tri sauté seulement au
  rendu serveur). Chaque erreur porte son `fieldTree`, dont l'état expose `focusBoundControl()`.
- `submission.onInvalid` reçoit le `FieldTree` racine quand la soumission échoue à la validation.

Conséquences observées : les champs obligatoires de l'admin n'annoncent ni l'état invalide ni le
lien vers leur message (F006) ; une soumission invalide depuis la barre d'enregistrement collante,
hors du `<form>`, ne déplace pas le focus vers le champ fautif (F007). Le contact, l'authentification
et la présentation du projet posent déjà `aria-invalid` et `aria-describedby` à la main.

## Decision

1. **Primitive `shared/ui/field-error.ts`** (`FieldError`, sélecteur `app-field-error`) : entrées
   `field` (`ReadonlyFieldTree<unknown>`), `errorId` (obligatoire) et `testId` (facultatif). Elle
   affiche, si le champ est touché et invalide, un seul `<p [id]="errorId" role="alert"
   class="form-error">` portant le premier message. Hôte en `display: contents` : aucune boîte de
   plus dans les grilles existantes. Elle ne fait rien d'autre (pas de libellé, pas d'indication).
2. **Le contrôle porte lui-même `aria-invalid` et `aria-describedby`**, liés à la main dans le
   gabarit, sur le prédicat `touched() && invalid()` lu une fois par `@let`. Quand une indication
   existe, `aria-describedby` vaut « indication erreur » si l'erreur est affichée, « indication »
   sinon. Un groupe de radios porte l'état sur son `fieldset`, qui reçoit `role="radiogroup"`
   (rôle permis sur `fieldset`, et qui admet `aria-invalid` et `aria-required`).
3. **`onInvalid` focalise le premier champ invalide dans l'ordre du DOM** par une fonction pure
   `shared/forms/focus-first-invalid.ts`, appuyée sur `errorSummary()` : contact, formulaire
   d'article, formulaire de projet.
4. **La mention « obligatoire » reste dans le nom accessible** (composant d'admin
   `required-mark.ts`, sans `aria-hidden`) : changement minimal, les libellés testés (« Titre
   obligatoire ») ne bougent pas.
5. Les `id` et `data-testid` d'erreur existants sont repris tels quels par `errorId` / `testId`.

## Consequences

- Une seule forme d'erreur dans le dépôt ; les 23 affichages passent par `FieldError`.
- Le prédicat « erreur affichée » reste écrit deux fois par champ (dans `FieldError` et dans le
  `@let` du gabarit). C'est le prix de l'option 2 ; il est borné par la règle d'écriture ci-dessus.
- Le focus après une soumission invalide suit l'ordre visuel, y compris dans les rangées répétées
  et dans les sous-composants d'un formulaire (les liaisons `[formField]` d'un enfant appartiennent
  au même arbre de champs).
- L'utilitaire `app-select` gagne le style `aria-[invalid=true]` que `form-input` porte déjà.
- happy-dom ne calcule pas le nom accessible d'un `fieldset[role=radiogroup]` : ce point se vérifie
  dans un navigateur à la revue.

## Alternatives considered

- **Directive sur le contrôle** (injecte `FormField` comme `markdown-editor.ts`, pose
  `aria-invalid`/`aria-describedby` en `host`) : supprime le `@let`, mais demande de répéter
  `errorId` sur le contrôle et sur l'erreur, et fusionner les indications existantes. Écartée tant
  que le prédicat ne change pas ; à rouvrir si l'affichage d'erreur devient « touché **ou** soumis ».
- **`FieldError` exportée (`exportAs`) et lue par le contrôle** (`#err="fieldError"`,
  `[attr.aria-invalid]="err.shown()"`) : le contrôle précède l'erreur dans le gabarit, sa liaison est
  évaluée avant que l'entrée obligatoire `field` de `FieldError` soit posée (NG0950 au premier
  rendu). Écartée.
- **`aria-hidden` sur la mention « obligatoire »** : nom accessible plus court (« Titre »), l'état
  requis étant annoncé par l'attribut natif ; conforme WCAG 2.5.3. Écartée par défaut pour limiter
  le changement ; question laissée ouverte au propriétaire.
- **Garder la liste de champs propre à chaque formulaire** (`contact-form.ts:347-352`) : exige de
  tenir la liste à jour à chaque champ ajouté, et ne couvre pas les rangées répétées. Écartée au
  profit de `errorSummary()`.
