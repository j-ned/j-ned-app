// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const prettierConfig = require('eslint-config-prettier');
const fs = require('node:fs');
const path = require('node:path');

// Préréglage AAK : licence propriétaire, non committé (dépôt public). Présent
// en local après /aak-sync, absent en CI → la config s'en passe.
const aakPreset = path.join(__dirname, '.claude/eslint/aak-conventions.mjs');
const aak = fs.existsSync(aakPreset) ? require(aakPreset).default : [];

// Exceptions ici et non en `eslint-disable` : sans préréglage (CI), la directive serait signalée inutile.
const aakSelectors = aak.flatMap((config) =>
  (config.rules?.['no-restricted-syntax'] ?? []).filter((option) => typeof option === 'object'),
);
const aakWithout = (files, isLifted) =>
  aak.length === 0
    ? []
    : [
        {
          files,
          rules: {
            'no-restricted-syntax': [
              'error',
              ...new Set(aakSelectors.filter(({ selector }) => !isLifted(selector))),
            ],
          },
        },
      ];
const isDefaultExport = (selector) => selector === 'ExportDefaultDeclaration';
const isGeneratedTestLoop = (selector) => selector.includes('callee.name=/^(it|test)$/');
const aakExceptions = [
  // Angular SSR et Playwright lisent l'export par défaut de ces deux fichiers.
  ...aakWithout(['src/main.server.ts'], isDefaultExport),
  // Playwright n'a pas de `test.each` : un test par page se déclare par une boucle.
  ...aakWithout(['e2e/a11y/**/*.spec.ts'], isGeneratedTestLoop),
  ...aakWithout(['e2e/playwright.config.ts'], isDefaultExport),
  // Ces specs vérifient la structure du HTML produit à partir du Markdown.
  ...aakWithout(['src/app/features/blog/**/*.spec.ts'], (selector) =>
    selector.includes('"innerHTML"'),
  ),
  // Seul point où le HTML du Markdown, assaini par `parseMarkdown`, est remis au gabarit.
  ...aakWithout(['src/app/features/blog/application/components/blog-article-body.ts'], (selector) =>
    selector.includes('bypassSecurityTrust'),
  ),
];

module.exports = [
  {
    files: ['**/*.ts'],
    ...eslint.configs.recommended,
  },
  ...tseslint.configs.recommended.map((config) => ({
    files: ['**/*.ts'],
    ...config,
  })),
  ...tseslint.configs.stylistic.map((config) => ({
    files: ['**/*.ts'],
    ...config,
  })),
  ...angular.configs.tsRecommended.map((config) => ({
    files: ['**/*.ts'],
    ...config,
  })),
  {
    files: ['**/*.ts'],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: ['element', 'attribute'],
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/prefer-output-emitter-ref': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  ...angular.configs.templateRecommended.map((config) => ({
    files: ['**/*.html'],
    ...config,
  })),
  ...angular.configs.templateAccessibility.map((config) => ({
    files: ['**/*.html'],
    ...config,
  })),
  {
    files: ['**/*.html'],
    rules: {
      '@angular-eslint/template/button-has-type': 'error',
      // `a[app-link-card]` reçoit son texte du gabarit de LinkCard, invisible pour la règle.
      '@angular-eslint/template/elements-content': ['error', { allowList: ['app-link-card'] }],
    },
  },
  // Prettier en dernier : désactive les règles stylistiques gérées par Prettier.
  prettierConfig,

  // Conventions AAK mécanisables (préréglage local, réécrit à chaque /aak-sync)
  ...aak,
  ...aakExceptions,
];
