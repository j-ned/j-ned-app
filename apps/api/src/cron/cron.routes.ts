import { Hono } from 'hono';
import { timingSafeEqual } from 'node:crypto';
import type { AnalyticsAggregatorService } from '../analytics/analytics-aggregator.service';
import { runDailyRollup } from '../analytics/analytics.schedule';
import type { AppEnv } from '../common/http';
import {
  NotFoundException,
  UnauthorizedException,
} from '../common/http-errors';

export type CronDeps = {
  /** `CRON_SECRET` ; absent, la route n'existe pas (404). */
  readonly secret: string | undefined;
  readonly aggregator: AnalyticsAggregatorService;
  /** Purge des compteurs de quotas en base, s'ils y sont (Vercel). */
  readonly purgeRateLimits?: () => Promise<void>;
};

function bearerMatches(header: string | undefined, secret: string): boolean {
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header ?? '');
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * `/api/cron` : tâches quotidiennes déclenchées par Vercel Cron (ADR-0036), qui envoie
 * `Authorization: Bearer <CRON_SECRET>`. Rollup analytics de la veille, puis purge des quotas.
 */
export function cronRoutes({ secret, aggregator, purgeRateLimits }: CronDeps) {
  return new Hono<AppEnv>().get('/daily', async (c) => {
    if (!secret) throw new NotFoundException(`Cannot GET ${c.req.path}`);
    if (!bearerMatches(c.req.header('authorization'), secret)) {
      throw new UnauthorizedException();
    }
    await runDailyRollup(aggregator);
    await purgeRateLimits?.();
    return c.json({ ok: true });
  });
}
