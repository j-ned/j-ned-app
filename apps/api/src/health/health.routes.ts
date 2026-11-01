import { sql } from 'drizzle-orm';
import { Hono } from 'hono';
import type { AppEnv } from '../common/http';
import { throttle } from '../common/throttle';
import type { Database } from '../database/drizzle.types';

export type HealthReport = {
  status: 'ok' | 'degraded';
  db: { status: 'up' | 'down'; latencyMs: number | null };
  uptime: number;
  version: string;
  timestamp: string;
};

/**
 * Vivacité et connexion à la base. Toujours 200 : `degraded` distingue « API vivante, base en panne »
 * d'une API injoignable, que le healthcheck du conteneur doit seule sanctionner.
 */
export async function checkHealth(
  db: Pick<Database, 'execute'>,
  bootedAt: number,
): Promise<HealthReport> {
  const start = Date.now();
  let dbStatus: 'up' | 'down' = 'down';
  let dbLatencyMs: number | null = null;
  try {
    await db.execute(sql`SELECT 1`);
    dbStatus = 'up';
    dbLatencyMs = Date.now() - start;
  } catch {
    // Base injoignable : rapport `degraded`, pas d'erreur.
  }
  return {
    status: dbStatus === 'up' ? 'ok' : 'degraded',
    db: { status: dbStatus, latencyMs: dbLatencyMs },
    uptime: Math.round((Date.now() - bootedAt) / 1000),
    version: process.env.npm_package_version ?? 'dev',
    timestamp: new Date().toISOString(),
  };
}

/** `/api/health` */
export function healthRoutes(db: Pick<Database, 'execute'>) {
  const bootedAt = Date.now();
  return new Hono<AppEnv>().get('/', throttle(), async (c) =>
    c.json(await checkHealth(db, bootedAt)),
  );
}
