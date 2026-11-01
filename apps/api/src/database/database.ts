import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import type { AppConfigService } from '../config/app-config.service';
import type { Database } from './drizzle.types';
import { schema } from './schema';

export type DatabaseConnection = {
  readonly db: Database;
  /** Ferme le pool en laissant 5 s aux requêtes en cours (arrêt du conteneur). */
  readonly close: () => Promise<void>;
};

export function connectDatabase(config: AppConfigService): DatabaseConnection {
  const client = postgres(config.databaseUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: true,
  });
  const db = drizzle(client, {
    schema,
    casing: 'snake_case',
    logger: !config.isProduction,
  });
  return { db, close: () => client.end({ timeout: 5 }) };
}
