// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");
const prettierConfig = require("eslint-config-prettier");

module.exports = (async () => {
  // Préréglage AAK vendoré (.mjs/ESM) — importé dynamiquement car cette config
  // est en CommonJS. ESLint 9 flat config accepte un export Promise.
  const aak = (await import("./.claude/eslint/aak-conventions.mjs")).default;

  return [
  {
    files: ["**/*.ts"],
    ...eslint.configs.recommended,
  },
  ...tseslint.configs.recommended.map(config => ({
    files: ["**/*.ts"],
    ...config,
  })),
  ...tseslint.configs.stylistic.map(config => ({
    files: ["**/*.ts"],
    ...config,
  })),
  ...angular.configs.tsRecommended.map(config => ({
    files: ["**/*.ts"],
    ...config,
  })),
  {
    files: ["**/*.ts"],
    processor: angular.processInlineTemplates,
    rules: {
      // Angular selectors
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],

      // TypeScript strict
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ],
    },
  },
  ...angular.configs.templateRecommended.map(config => ({
    files: ["**/*.html"],
    ...config,
  })),
  ...angular.configs.templateAccessibility.map(config => ({
    files: ["**/*.html"],
    ...config,
  })),
  {
    files: ["**/*.html"],
    rules: {},
  },
  // Prettier DOIT être en dernier
  prettierConfig,
  // Préréglage AAK (no-restricted-syntax, …) — après prettier : aucune règle
  // stylistique que prettier désactive.
  ...aak,
  {
    // Point d'entrée SSR : `export default bootstrap` imposé par Angular SSR —
    // hors périmètre de la règle AAK (réservée aux pages routées *-page.ts).
    files: ["**/main.server.ts"],
    rules: { "no-restricted-syntax": "off" },
  },
  ];
})();
