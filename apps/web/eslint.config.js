// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");
const prettierConfig = require("eslint-config-prettier");

module.exports = [
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
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
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
  // Prettier en dernier : désactive les règles stylistiques gérées par Prettier.
  prettierConfig,
];
