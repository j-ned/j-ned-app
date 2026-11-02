import { existsSync } from 'node:fs';
import { defineConfig } from 'drizzle-kit';

// `.env` local facultatif (absent sur Vercel), lu par Node sans dépendance.
if (existsSync('.env')) process.loadEnvFile();

export default defineConfig({
  out: './drizzle',
  schema: './src/database/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
  casing: 'snake_case',
  verbose: true,
  strict: true,
});
