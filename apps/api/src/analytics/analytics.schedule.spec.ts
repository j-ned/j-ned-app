import { Logger } from '../common/logger';
import type { AnalyticsAggregatorService } from './analytics-aggregator.service';
import { runDailyRollup, scheduleDailyRollup } from './analytics.schedule';

describe('analytics daily rollup schedule', () => {
  const aggregator = {
    aggregateYesterday: jest.fn().mockResolvedValue(undefined),
  };
  const asAggregator = aggregator as unknown as AnalyticsAggregatorService;

  afterEach(() => jest.restoreAllMocks());

  it('Given a started schedule, When the next run is computed, Then it is the coming midnight UTC', () => {
    const schedule = scheduleDailyRollup(asAggregator);
    try {
      const next = schedule.nextRun();
      const now = Date.now();

      expect(next).not.toBeNull();
      expect(next!.toISOString()).toMatch(/T00:00:00\.000Z$/);
      expect(next!.getTime()).toBeGreaterThan(now);
      expect(next!.getTime() - now).toBeLessThanOrEqual(24 * 3_600_000);
    } finally {
      schedule.stop();
    }
  });

  it('Given a stopped schedule, When asked for the next run, Then there is none', () => {
    const schedule = scheduleDailyRollup(asAggregator);

    schedule.stop();

    expect(schedule.nextRun()).toBeNull();
  });

  it('Given a run, When it fires, Then it aggregates yesterday', async () => {
    await runDailyRollup(asAggregator);

    expect(aggregator.aggregateYesterday).toHaveBeenCalledTimes(1);
  });

  it('Given a failing run, When it fires, Then the error is logged and not rethrown', async () => {
    const error = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    aggregator.aggregateYesterday.mockRejectedValueOnce(new Error('db down'));

    await expect(runDailyRollup(asAggregator)).resolves.toBeUndefined();

    expect(error).toHaveBeenCalledWith(
      expect.stringContaining('db down'),
      expect.any(String),
    );
  });
});
