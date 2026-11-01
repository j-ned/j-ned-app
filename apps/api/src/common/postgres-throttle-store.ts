import { sql } from 'drizzle-orm';
import type { Database } from '../database/drizzle.types';
import type { ThrottleHit, ThrottleStore } from './throttle';

/**
 * Compteurs de quotas en base (table `rate_limit`), pour les fonctions Vercel qui ne partagent aucune
 * mémoire : une requête par appel, fenêtres alignées sur leur durée (minute, heure…), compteur remis
 * à 1 quand la fenêtre change. Les lignes anciennes sont purgées par `purgeExpired` (cron).
 */
export class PostgresThrottleStore implements ThrottleStore {
  constructor(private readonly db: Pick<Database, 'execute'>) {}

  async hit(key: string, ttlMs: number, now: number): Promise<ThrottleHit> {
    const windowStart = Math.floor(now / ttlMs) * ttlMs;
    const rows = await this.db.execute<{ count: number }>(sql`
      INSERT INTO rate_limit (key, window_start, count)
      VALUES (${key}, ${new Date(windowStart).toISOString()}, 1)
      ON CONFLICT (key) DO UPDATE SET
        count = CASE WHEN rate_limit.window_start = EXCLUDED.window_start
                     THEN rate_limit.count + 1 ELSE 1 END,
        window_start = EXCLUDED.window_start
      RETURNING count`);
    return { count: Number(rows[0]?.count ?? 0), resetAt: windowStart + ttlMs };
  }

  /** Supprime les compteurs dont la fenêtre est close depuis plus d'un jour. */
  async purgeExpired(now: number = Date.now()): Promise<void> {
    const before = new Date(now - 86_400_000).toISOString();
    await this.db.execute(
      sql`DELETE FROM rate_limit WHERE window_start < ${before}`,
    );
  }
}
