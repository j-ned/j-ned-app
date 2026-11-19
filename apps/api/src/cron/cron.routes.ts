import { Hono } from 'hono';
import { timingSafeEqual } from 'node:crypto';
import type { AnalyticsAggregatorService } from '../analytics/analytics-aggregator.service';
import { runDailyRollup } from '../analytics/analytics.schedule';
import type { LoginJournalService } from '../auth/login-journal.service';
import type { AppEnv } from '../common/http';
import {
  NotFoundException,
  UnauthorizedException,
} from '../common/http-errors';

export type CronDeps = {
  /** `CRON_SECRET` ; absent, la route n'existe pas (404). */
  readonly secret: string | undefined;
  readonly aggregator: AnalyticsAggregatorService;
  readonly loginJournal: LoginJournalService;
};

function bearerMatches(header: string | undefined, secret: string): boolean {
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header ?? '');
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * `/api/cron` : tâche quotidienne déclenchée par le service `portfolio-cron` de la pile (ADR-0038),
 * qui envoie `Authorization: Bearer <CRON_SECRET>`. Rollup analytics de la veille, puis purge du
 * journal des connexions : son échec répond 500, pour que la tâche planifiée le voie.
 */
export function cronRoutes({ secret, aggregator, loginJournal }: CronDeps) {
  return new Hono<AppEnv>().get('/daily', async (c) => {
    if (!secret) throw new NotFoundException(`Cannot GET ${c.req.path}`);
    if (!bearerMatches(c.req.header('authorization'), secret)) {
      throw new UnauthorizedException();
    }
    await runDailyRollup(aggregator);
    await loginJournal.purgeExpired();
    return c.json({ ok: true });
  });
}
