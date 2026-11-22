import * as Sentry from '@sentry/node';
import { Logger } from '../common/logger';
import type { AnalyticsAggregatorService } from './analytics-aggregator.service';

// Déclenché chaque jour par le service `portfolio-cron` via `/api/cron/daily` ; en local, appeler
// cette route avec `CRON_SECRET`.
export const DAILY_ROLLUP_PATTERN = '0 0 * * *';
export const DAILY_ROLLUP_MONITOR = 'analytics-aggregate-yesterday';

const logger = new Logger('AnalyticsSchedule');

// Suivi par le Sentry Cron Monitor. Un échec est journalisé sans arrêter le process : le passage du
// lendemain repart normalement.
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
