import * as Sentry from '@sentry/node';
import { Cron } from 'croner';
import { Logger } from '../common/logger';
import type { AnalyticsAggregatorService } from './analytics-aggregator.service';

/** Tous les jours à minuit UTC : agrège la veille, rattrape les jours non mesurés, purge le brut. */
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

/** Démarre le rollup quotidien ; `stop()` l'arrête (à l'arrêt de l'API). */
export function scheduleDailyRollup(aggregator: AnalyticsAggregatorService): {
  stop(): void;
  nextRun(): Date | null;
} {
  const job = new Cron(
    DAILY_ROLLUP_PATTERN,
    { name: DAILY_ROLLUP_MONITOR, timezone: 'UTC', protect: true },
    () => runDailyRollup(aggregator),
  );
  return {
    stop: () => job.stop(),
    nextRun: () => job.nextRun(),
  };
}
