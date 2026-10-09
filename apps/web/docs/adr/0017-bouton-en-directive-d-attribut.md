# ADR-0017 — Le bouton est une directive d'attribut `appButton` à gabarit unique, pas un `@utility`

- **Statut** : accepté (2026-10-09, arbitrages du propriétaire, spec 017 lot L10)
- **Date** : 2026-10-09
- **Contexte spec** : `specs/017-intake-audit-decoupage.md` (constats F011, F012, F013 ; propositions P8, P12 ; lot L10)
- **Remplace en partie** : ADR-0003 (le cas « `a` stylé en bouton » de sa décision 3)

## Context

Trois mécanismes stylent aujourd'hui un bouton, avec deux gabarits visuels différents :

- `<app-button>` (`shared/ui/button.ts`) : un composant qui enveloppe un `<button>`, avec un bloc
  `styles:` hors des exceptions de `CLAUDE.md` (F012). Gabarit 14 px, graisse 500, `py-2.5`, pleins
  avec bordure et ombre, contour `muted/30`. Il ne rend que des `<button>` et n'expose ni
  `aria-pressed` ni `aria-disabled` ; 38 sites l'utilisent ;
- `@utility link-btn`, `link-btn-primary`, `link-btn-outline` (`src/styles.css`) : gabarit
  « appel », 15 px, graisse 600, contour `foreground/15`, survol teinté primaire. 30 usages, sur
  24 `<a>` et 6 `<button>` natifs ;
- `@utility icon-link` : 4 liens icônes de l'admin.

ADR-0003 rangeait le « `a` stylé en bouton » parmi les cas légitimes d'`@utility`. L'utilisateur a
tranché le 2026-10-09 pour la règle de sa note « Tailwind v4 — Setup & @theme » §4 : un élément
réutilisé est un composant Angular, jamais un `@apply` ni une classe CSS custom. Il a aussi choisi
**un seul gabarit, celui des appels**.

Faits mesurés en préparant le lot (Tailwind 4.3.3 du dépôt) :

- dans un `@utility btn`, une règle `&:disabled { opacity }` imbriquée sort **avant**
  `hover:opacity-90`. Un bouton désactivé survolé passerait à 0,9 d'opacité. En classes posées sur
  l'élément, `disabled:opacity-50` sort après `hover:*` ;
- la règle globale de focus `:where(a, button, [role='button'], summary):focus-visible` est hors
  couche. Son `border-radius: 4px` écrase donc tout `rounded-*` : le bouton de thème rond devient
  un carré à coins arrondis au focus clavier. Les navigateurs actuels font suivre à `outline` le
  rayon de l'élément ; seul le rayon imposé pose problème.

## Decision

1. **Un bouton, ou un lien stylé en bouton, porte la directive `Button`** (`shared/ui/button.ts`,
   sélecteur `button[appButton], a[appButton]`). Elle pose ses classes Tailwind sur l'élément natif
   par `host: { '[class]': 'classes()' }`, à partir de ses entrées : `variant` (`primary`,
   `outlined`, `danger`, `outlined-danger`, `text`, `text-muted`, `text-danger`, `ghost-icon`),
   `size` (`default` | `icon`), `rounded`, `block`. Pas d'enveloppe, pas de gabarit, pas de `role`.
   Chaque entrée existe parce qu'un consommateur l'emploie.
2. **Un seul gabarit, celui des appels** : `inline-flex min-h-11 items-center gap-2 rounded-md px-5 text-[0.9375rem] font-semibold transition-colors`.
   `primary` et `outlined` en prennent les couleurs. Les variantes sans équivalent (danger, texte)
   gardent leurs couleurs et prennent la forme et la typographie. `ghost-icon` (ex-`icon-link`)
   garde sa chaîne propre.
3. **Aucun `@utility`, aucun `@apply`, aucun bloc `styles:` pour un bouton.** Les états passent par
   les variantes Tailwind (`hover:`, `disabled:`, `aria-pressed:`, `aria-disabled:`). L'anneau de
   focus reste porté par la règle globale, pour tous les interactifs.
4. **L'élément garde ses attributs natifs** : `type`, `disabled`, `href` / `routerLink`,
   `aria-pressed`, `aria-disabled`, `aria-label`. La directive ne pose pas de `type`. Chaque
   `<button>` déclare le sien, ce que garantit `@angular-eslint/template/button-has-type`
   (`error`). Un bouton n'est jamais désactivé sur `invalid()` (CLAUDE.md, Signal Forms).
5. **Le focus ne change pas la forme d'un élément** : le `border-radius: 4px` de la règle globale
   passe dans `@layer base`. Un rayon posé par une classe `rounded-*` l'emporte ; un élément sans
   rayon garde 4 px au focus. `outline` et `outline-offset` restent hors couche.
6. **Hors boutons, ADR-0003 reste en vigueur** (`form-input`, `table-head`, `page-container`…). Un
   motif de quelques classes répété sur peu de sites, sans comportement (le lien étiré des
   cartes), reste en ligne (ADR-0003 §1), sans directive.

## Consequences

- `<app-button>`, `@utility link-btn*` et `@utility icon-link` disparaissent. Une seule source de
  vérité, testable sur l'élément natif.
- Changement visible voulu : les 38 anciens `<app-button>` prennent le gabarit d'appel (15 px,
  600, sans ombre, contour `foreground/15`, plus de pression ni de taille `large`). Les éléments
  arrondis gardent leur forme au focus.
- Les 6 boutons natifs à état adoptent la directive sans entrée supplémentaire.
- Le code qui descendait de l'enveloppe vers le `<button>` interne (focus de la galerie, plusieurs
  specs) vise désormais l'élément lui-même.
- Un `disabled:` propre à un site (barre d'enregistrement) concurrence celui de la base à
  variante égale. Il l'emporte aujourd'hui par l'ordre de génération de Tailwind, pas par
  construction.
- `CLAUDE.md` (section CSS) et `.claude/project-profile.md` (§ Styling) doivent retirer le bouton
  de la liste des cas d'`@utility`.

## Alternatives considered

- **`@utility btn`, `btn-primary`, `btn-outline`, composés par `<app-button>`** (proposition P12 de
  l'audit). Contraire à la décision de l'utilisateur, et piégé par l'ordre de cascade (désactivé
  + survol). Écarté.
- **Garder deux gabarits (action et appel) dans la directive.** Aucun changement visuel, mais deux
  familles d'entrées dont certaines sont sans effet selon la variante. Écarté par l'utilisateur au
  profit d'un gabarit unique.
- **Garder `<app-button>` avec `<ng-content />` et y ajouter `pressed` / `ariaDisabled` / un mode
  lien.** L'enveloppe double chaque élément, empêche les attributs natifs de vivre sur le vrai
  `<button>` et ne sait pas rendre un `<a>`. Écarté.
- **Composant à sélecteur d'attribut avec `template: '<ng-content />'`.** Sans gabarit utile, c'est
  une directive : les précédents du dépôt (`textarea[appMarkdownEditor]`, `[appCodeCopy]`) sont
  des `@Directive`. Écarté.
- **Retirer `border-radius` de la règle de focus.** L'anneau suivrait la forme des éléments
  arrondis, mais les liens de texte et de pied de page perdraient leurs coins à 4 px au focus.
  Écarté au profit du passage en `@layer base`.
- **Directive `a[appCardLink]` pour le lien étiré des 4 cartes.** Indirection qui ne porte qu'une
  chaîne de classes, sans comportement. Écarté.
