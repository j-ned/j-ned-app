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
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
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
  // Prettier en dernier : désactive les règles stylistiques gérées par Prettier.
  prettierConfig,

  // Conventions AAK mécanisables (préréglage local, réécrit à chaque /aak-sync)
  ...aak,
];
