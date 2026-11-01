import type { AnalyticsAggregatorService } from '../analytics/analytics-aggregator.service';
import { testApp } from '../common/test-app';
import { cronRoutes } from './cron.routes';

const SECRET = 'cron-secret-for-tests';

describe('cron routes', () => {
  const aggregator = {
    aggregateYesterday: jest.fn().mockResolvedValue(undefined),
  };
  const purgeRateLimits = jest.fn().mockResolvedValue(undefined);
  const app = (secret: string | undefined) =>
    testApp(
      '/api/cron',
      cronRoutes({
        secret,
        aggregator: aggregator as unknown as AnalyticsAggregatorService,
        purgeRateLimits,
      }),
    );

  beforeEach(() => jest.clearAllMocks());

  it('Given the Vercel cron bearer, When /daily is called, Then the rollup runs, then counters are purged', async () => {
    const res = await app(SECRET).request('/api/cron/daily', {
      headers: { authorization: `Bearer ${SECRET}` },
    });

    expect(res.status).toBe(200);
    expect(aggregator.aggregateYesterday).toHaveBeenCalledTimes(1);
    expect(purgeRateLimits).toHaveBeenCalledTimes(1);
  });

  it.each([undefined, 'Bearer nope', SECRET])(
    'Given the authorization %s, When /daily is called, Then 401 and nothing runs',
    async (authorization) => {
      const res = await app(SECRET).request('/api/cron/daily', {
        headers: authorization ? { authorization } : {},
      });

      expect(res.status).toBe(401);
      expect(aggregator.aggregateYesterday).not.toHaveBeenCalled();
    },
  );

  it('Given no CRON_SECRET configured, When /daily is called, Then the route does not exist', async () => {
    const res = await app(undefined).request('/api/cron/daily', {
      headers: { authorization: 'Bearer anything' },
    });

    expect(res.status).toBe(404);
    expect(aggregator.aggregateYesterday).not.toHaveBeenCalled();
  });
});
