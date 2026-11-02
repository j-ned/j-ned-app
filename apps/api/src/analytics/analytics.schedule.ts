import * as Sentry from '@sentry/node';
import { Logger } from '../common/logger';
import type { AnalyticsAggregatorService } from './analytics-aggregator.service';

/**
 * Tous les jours à minuit UTC (cron `/api/cron/daily` de `vercel.json`) : agrège la veille, rattrape
 * les jours non mesurés, purge le brut. En local, appeler la route avec `CRON_SECRET`.
 */
export const DAILY_ROLLUP_PATTERN = '0 0 * * *';
export const DAILY_ROLLUP_MONITOR = 'analytics-aggregate-yesterday';

const logger = new Logger('AnalyticsSchedule');

/**
 * Un passage du rollup, suivi par le Sentry Cron Monitor. Un échec est journalisé et n'interrompt
 * pas le process : le passage du lendemain repartira normalement.
 */
export async function runDailyRollup(
  aggregator: AnalyticsAggregatorService,
): Promise<void> {
  try {
    await Sentry.withMonitor(
      DAILY_ROLLUP_MONITOR,
      () => aggregator.aggregateYesterday(),
      {
        schedule: { type: 'crontab', value: DAILY_ROLLUP_PATTERN },
        timezone: 'UTC',
        checkinMargin: 5,
        maxRuntime: 30,
      },
    );
  } catch (error) {
    logger.error(
      `Daily analytics rollup failed: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error.stack : undefined,
    );
  }
}
