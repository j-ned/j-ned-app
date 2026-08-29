// AAK — préréglage ESLint des conventions *mécanisables*.
//
// Source de vérité : plugin angular-team. Ce fichier est VENDORÉ dans le dépôt
// client (`.claude/eslint/aak-conventions.mjs`) par `/aak-sync` et `/aak-init-profile`,
// et RÉÉCRIT à chaque re-sync — exactement comme les agents. Conséquence : une
// fois le préréglage câblé dans `eslint.config.js` (action unique), toute règle
// AAK future arrive automatiquement au prochain `/aak-sync`, sans rien à reprendre
// côté client.
//
// Ce préréglage ne porte QUE des conventions déterministes (vérifiables sans
// jugement). Les conventions de jugement (builder en test, altitude composant,
// pertinence des tests) restent dans les prompts d'agents — inlintables par nature.
//
// Câblage (flat config, ESLint 9+) :
//
//   import aak from './.claude/eslint/aak-conventions.mjs';
//   export default [
//     // …ta config (typescript-eslint, angular-eslint)…
//     ...aak,
//   ];
//
// ⚠️ Footgun `no-restricted-syntax` : ESLint ne *fusionne* pas deux déclarations
// de la même règle — la dernière config qui matche un fichier gagne. Si ta config
// utilise déjà `no-restricted-syntax`, ne te contente pas de spread `...aak` :
// FUSIONNE les sélecteurs dans une seule entrée, sinon l'un écrase l'autre.
// Les commandes `/aak-sync` et `/aak-init-profile` gèrent cette fusion au câblage.

/** Interdit `export default` — réservé aux pages routées (désactivé sur `*-page.ts`). */
const noDefaultExportHorsPage = {
  selector: 'ExportDefaultDeclaration',
  message:
    "export default est réservé aux pages routées (*-page.ts) — il autorise la forme " +
    "concise loadComponent: () => import('./xxx-page'). Tout autre symbole (composant " +
    'non-page, service, store/facade, directive, pipe, InjectionToken, const, type) ' +
    'est un export nommé, importé par son nom dans imports/providers. (Convention AAK angular-expert.)',
};

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    name: 'aak/export-default-reserve-aux-pages',
    files: ['**/*.ts'],
    ignores: ['**/*-page.ts', 'src/main.server.ts'],
    rules: {
      'no-restricted-syntax': ['error', noDefaultExportHorsPage],
    },
  },
];
