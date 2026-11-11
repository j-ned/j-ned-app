import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';
import { PostgresThrottleStore } from './postgres-throttle-store';

const render = (query: unknown) =>
  new PgDialect({ casing: 'snake_case' }).sqlToQuery(query as SQL);

describe('PostgresThrottleStore', () => {
  const execute = jest.fn();
  const store = new PostgresThrottleStore({ execute } as never);

  beforeEach(() => execute.mockReset());

  it('Given a hit, When counted, Then the window is aligned on its length and the count comes from the upsert', async () => {
    execute.mockResolvedValue([{ count: 3 }]);

    const hit = await store.hit('route1|203.0.113.1', 60_000, 125_000);

    expect(hit).toEqual({ count: 3, resetAt: 180_000 });
    const { sql, params } = render((execute.mock.calls as unknown[][])[0]?.[0]);
    expect(sql).toMatch(/INSERT INTO rate_limit/);
    expect(sql).toMatch(/ON CONFLICT \(key\) DO UPDATE/);
    expect(params).toEqual([
      'route1|203.0.113.1',
      new Date(120_000).toISOString(),
    ]);
  });

  it('Given no row returned, When counted, Then the count is 0 (never blocks on a driver oddity)', async () => {
    execute.mockResolvedValue([]);

    expect((await store.hit('k', 1_000, 0)).count).toBe(0);
  });

  it('Given a counter, When reset, Then its row is deleted', async () => {
    execute.mockResolvedValue([]);

    await store.reset('2fa|user-1');

    const { sql, params } = render((execute.mock.calls as unknown[][])[0]?.[0]);
    expect(sql).toMatch(/DELETE FROM rate_limit WHERE key = /);
    expect(params).toEqual(['2fa|user-1']);
  });

  it('Given expired counters, When purged, Then rows whose window closed over a day ago are deleted', async () => {
    execute.mockResolvedValue([]);

    await store.purgeExpired(2 * 86_400_000);

    const { sql, params } = render((execute.mock.calls as unknown[][])[0]?.[0]);
    expect(sql).toMatch(/DELETE FROM rate_limit WHERE window_start < /);
    expect(params).toEqual([new Date(86_400_000).toISOString()]);
  });
});
