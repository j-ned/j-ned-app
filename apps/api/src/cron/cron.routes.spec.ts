import { AnalyticsAggregatorService } from '../analytics/analytics-aggregator.service';
import { asDatabase } from '../testing/mock-database';
import { createMockDb } from '../testing/test-utils';
import { testApp } from '../testing/test-app';
import { cronRoutes } from './cron.routes';

const SECRET = 'cron-secret-for-tests';

describe('cron routes', () => {
  // Vrai service sur une base factice : seule l'agrégation, espionnée, est atteinte.
  const aggregator = new AnalyticsAggregatorService(asDatabase(createMockDb()));
  const aggregateYesterday = jest
    .spyOn(aggregator, 'aggregateYesterday')
    .mockResolvedValue(undefined);
  const loginJournal = {
    purgeExpired: jest.fn().mockResolvedValue(undefined),
  };
  const app = (secret: string | undefined) =>
    testApp(
      '/api/cron',
      cronRoutes({
        secret,
        aggregator,
        loginJournal,
      }),
    );

  beforeEach(() => jest.clearAllMocks());

  it('Given the cron bearer, When /daily is called, Then the rollup runs', async () => {
    const res = await app(SECRET).request('/api/cron/daily', {
      headers: { authorization: `Bearer ${SECRET}` },
    });

    expect(res.status).toBe(200);
    expect(aggregateYesterday).toHaveBeenCalledTimes(1);
  });

  it('Given the cron bearer, When /daily is called, Then the expired login journal is purged', async () => {
    const res = await app(SECRET).request('/api/cron/daily', {
      headers: { authorization: `Bearer ${SECRET}` },
    });

    expect(res.status).toBe(200);
    expect(loginJournal.purgeExpired).toHaveBeenCalledTimes(1);
  });

  it('Given the purge of the login journal fails, When /daily is called, Then 500 so the scheduler sees the failure', async () => {
    loginJournal.purgeExpired.mockRejectedValueOnce(new Error('db down'));

    const res = await app(SECRET).request('/api/cron/daily', {
      headers: { authorization: `Bearer ${SECRET}` },
    });

    expect(res.status).toBe(500);
  });

  it.each([undefined, 'Bearer nope', SECRET])(
    'Given the authorization %s, When /daily is called, Then 401 and nothing runs',
    async (authorization) => {
      const res = await app(SECRET).request('/api/cron/daily', {
        headers: authorization ? { authorization } : {},
      });

      expect(res.status).toBe(401);
      expect(aggregateYesterday).not.toHaveBeenCalled();
      expect(loginJournal.purgeExpired).not.toHaveBeenCalled();
    },
  );

  it('Given no CRON_SECRET configured, When /daily is called, Then the route does not exist', async () => {
    const res = await app(undefined).request('/api/cron/daily', {
      headers: { authorization: 'Bearer anything' },
    });

    expect(res.status).toBe(404);
    expect(aggregateYesterday).not.toHaveBeenCalled();
  });
});
