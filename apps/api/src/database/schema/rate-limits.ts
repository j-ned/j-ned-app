import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Quotas par visiteur et par route, comptés en base quand l'API tourne en fonctions Vercel sans
 * mémoire partagée (ADR-0036) : une ligne par clé (`<route>|<ip>`), fenêtre fixe repartant à 1 quand
 * elle change. Les lignes des fenêtres passées sont purgées par le cron quotidien.
 */
export const rateLimits = pgTable('rate_limit', {
  key: text().primaryKey(),
  windowStart: timestamp({ withTimezone: true }).notNull(),
  count: integer().notNull(),
});

export type RateLimit = typeof rateLimits.$inferSelect;
