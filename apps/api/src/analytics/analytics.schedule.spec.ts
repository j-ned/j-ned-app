import { Logger } from '../common/logger';
import type { AnalyticsAggregatorService } from './analytics-aggregator.service';
import { runDailyRollup } from './analytics.schedule';

describe('analytics daily rollup schedule', () => {
  const aggregator = {
    aggregateYesterday: jest.fn().mockResolvedValue(undefined),
  };
  const asAggregator = aggregator as unknown as AnalyticsAggregatorService;

  afterEach(() => jest.restoreAllMocks());

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
