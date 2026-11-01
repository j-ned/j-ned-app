import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts'],
    globalSetup: ['src/global-setup.ts'],
    // Une seule API et un seul admin pour toute la suite : les fichiers ne tournent pas en parallèle
    // (la 2FA activée par l'un changerait la connexion des autres).
    fileParallelism: false,
    // L'attente de la fenêtre TOTP suivante peut prendre jusqu'à 30 s.
    testTimeout: 45_000,
  },
});
