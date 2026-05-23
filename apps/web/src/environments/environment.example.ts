// Template — DO NOT IMPORT. The real environment.ts is generated at build time
// by scripts/generate-env.mjs from ../nest-portfolio-app/.env (gitignored).
//
// If you see TypeScript complaining about a missing environment.ts, run:
//   pnpm generate-env
//
// In CI / deploy : NODE_ENV=production is set in the build env, the script
// generates production: true automatically.

export const environment = {
  production: false,
  sentry: {
    dsn: '',
    environment: 'development',
    release: 'dev',
  },
};
