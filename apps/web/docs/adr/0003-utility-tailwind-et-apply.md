# ADR-0003 — `@utility` de design system et `@apply` : où ils sont légitimes

- **Statut** : accepté
- **Date** : 2026-09-08
- **Contexte spec** : `specs/005-intake-audit-repo.md` (question ouverte « `@apply` dans `@utility` »)

## Context

Deux documents de doctrine se contredisaient. `CLAUDE.md` : « réutilisation = composant Angular,
pas `@apply` ni classe CSS custom ». Le profil-projet : « config dans `@theme`/`@utility` de
`src/styles.css` ». Et `src/styles.css` porte **20 `@utility`** composés de 46 `@apply`
(`page-container`, `form-input`, `form-label`, `admin-th`, `admin-td`, `admin-icon-btn`…), utilisés
dans 1 à 16 composants chacun.

La doc officielle Tailwind v4 tranche en deux temps :

- *Styling with utility classes* : « for anything that's more complicated than just a single HTML
  element, we highly recommend using template partials so the styles and structure can be
  encapsulated in one place » — et, juste après : « writing some custom CSS is totally fine when a
  template partial feels heavy-handed », avec l'exemple d'un `btn-primary` mono-élément.
- *Adding custom styles* / *Functions and directives* : `@utility` est **le** mécanisme v4 pour
  « add custom utilities to your project that work with variants like `hover`, `focus` and `lg` » ;
  `@apply` sert à « inline any existing utility classes into your own custom CSS ».

Le repo confirme le critère : chacune des 20 utilities habille **un seul élément natif** qu'un
composant Angular ne peut pas envelopper sans casser quelque chose — un `<input>`/`<textarea>`
possédé par `[formField]` et lié à son `<label for>`, une cellule `<th>`/`<td>` dont la sémantique
de table interdit l'élément hôte intermédiaire, un conteneur de layout (`page-container`).

## Decision

1. **Par défaut, utility classes dans les templates et `host: { class }`.** Une duplication locale
   se règle au multi-curseur, pas par une abstraction.
2. **Structure réutilisée de plus d'un élément → composant Angular `shared/ui/`.** Jamais une
   classe CSS, jamais un `@utility` multi-éléments.
3. **Liste de classes réutilisée sur un élément natif unique qu'on ne peut pas envelopper**
   (`input`, `textarea`, `select`, `th`/`td`/`tr`, `a` stylé en bouton, conteneur de layout)
   **→ `@utility` dans `src/styles.css`**, nommé par rôle, composé avec `@apply`, et donc
   compatible variantes (`hover:`, `md:`, `group-*`).
4. **`@apply` n'est légitime qu'à l'intérieur d'un bloc `@utility` de `src/styles.css`.** Interdit
   dans un `styles:` de composant, interdit dans une règle `.classe { }` ad hoc, pas de
   `@layer components`.
5. **Seuil advisory** : un `@utility` utilisé dans un seul composant est un candidat à l'inlining,
   sauf s'il compose une autre utility (`admin-icon-btn-danger` sur `admin-icon-btn`) ou porte un
   état multi-sélecteur (`nav-underline` avec `group-hover` / `.is-link-active`).

## Consequences

- `CLAUDE.md` et le profil-projet portent la même règle ; la question ouverte de l'audit 005 est
  close. Les 20 utilities existantes sont conformes, aucune migration.
- L'agent `code-reviewer` peut trancher mécaniquement : `@apply` hors `styles.css` = rejet ;
  `@utility` dont le sélecteur cible plus d'un élément = rejet ; structure multi-éléments dupliquée
  entre fichiers = composant attendu.

## Alternatives considered

- **Interdire `@utility` et tout passer en composants.** Impossible pour `input`/`th`/`td` sans
  casser `[formField]`, `label for` et la sémantique des tables ; contraire à la doc v4. Écarté.
- **Autoriser `@apply` partout, y compris dans `styles:` de composant.** Réintroduit le CSS par
  composant que le repo a éliminé, et contredit le conseil officiel de ne pas utiliser `@apply`
  « just to make things look cleaner ». Écarté.
- **`@layer components` avec des classes `.btn`, `.card`.** Mécanisme v3 ; en v4 les utilities
  custom passent par `@utility` et bénéficient des variantes, ce que `@layer components` ne donne
  pas. Écarté.
