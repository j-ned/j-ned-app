import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

// Migrations appliquées par l'image de production (`node dist/database/scripts/migrate.js`), sans
// drizzle-kit, qui reste une dépendance de développement. Même dossier et même table de suivi que
// `drizzle-kit migrate` : les deux s'enchaînent sur une même base.

// `.env` local facultatif, lu par Node sans dépendance.
if (existsSync('.env')) process.loadEnvFile();

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('Missing DATABASE_URL');
  const client = postgres(databaseUrl, { max: 1, onnotice: () => {} });
  try {
    await migrate(drizzle(client), {
      migrationsFolder: resolve(__dirname, '../../../drizzle'),
    });
    console.log('Migrations applied.');
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
