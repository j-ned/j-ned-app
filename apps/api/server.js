// Point d'entrée déclaré du service Vercel « api ». Vercel exécute en fait `dist/index.js`, remplacé par
// le bundle de `pnpm build:vercel` (scripts/build-vercel.mjs).
module.exports = require('./dist/index.js').default;
