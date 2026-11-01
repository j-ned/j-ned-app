import { Hono } from 'hono';
import { handleError } from './error-handler';
import {
  ADMIN_WRITE_THROTTLE,
  AUTH_ATTEMPT_THROTTLE,
  CONTACT_THROTTLE,
  DEFAULT_THROTTLE,
  PUBLIC_READ_THROTTLE,
  throttle,
  type ThrottleConfig,
} from './throttle';

/** Route sous quota, horloge pilotée par le test. */
function throttledApp(config: ThrottleConfig) {
  let now = 0;
  const app = new Hono()
    .get(
      '/x',
      throttle(config, () => now),
      (c) => c.text('ok'),
    )
    .onError(handleError);
  const hit = async (ip: string) =>
    app.request('/x', { headers: { 'x-forwarded-for': ip } });
  return {
    hit,
    advance: (ms: number) => {
      now += ms;
    },
  };
}

async function statuses(count: number, call: () => Promise<Response>) {
  const result: number[] = [];
  for (let i = 0; i < count; i += 1) result.push((await call()).status);
  return result;
}

describe('throttle', () => {
  it('Given a limit of 3, When a visitor calls 4 times in the window, Then the 4th gets 429 with Retry-After', async () => {
    const { hit } = throttledApp({ limit: 3, ttlMs: 60_000 });

    expect(await statuses(3, () => hit('203.0.113.1'))).toEqual([
      200, 200, 200,
    ]);
    const blocked = await hit('203.0.113.1');
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('retry-after')).toBe('60');
  });

  it('Given a throttled visitor, When another visitor calls, Then it is not affected', async () => {
    const { hit } = throttledApp({ limit: 1, ttlMs: 60_000 });
    await hit('203.0.113.1');

    expect((await hit('203.0.113.1')).status).toBe(429);
    expect((await hit('203.0.113.2')).status).toBe(200);
  });

  it('Given a throttled visitor, When the window has passed, Then it is served again', async () => {
    const { hit, advance } = throttledApp({ limit: 1, ttlMs: 60_000 });
    await hit('203.0.113.1');
    advance(60_000);

    expect((await hit('203.0.113.1')).status).toBe(200);
  });

  it('Given a forged first X-Forwarded-For entry, When the visitor is throttled, Then only the last entry counts', async () => {
    const { hit } = throttledApp({ limit: 1, ttlMs: 60_000 });
    await hit('203.0.113.1');

    expect((await hit('198.51.100.9, 203.0.113.1')).status).toBe(429);
  });

  it('Given two routes, When one is exhausted, Then the other keeps its own quota', async () => {
    const app = new Hono()
      .get('/a', throttle({ limit: 1, ttlMs: 60_000 }), (c) => c.text('a'))
      .get('/b', throttle({ limit: 1, ttlMs: 60_000 }), (c) => c.text('b'))
      .onError(handleError);
    const headers = { 'x-forwarded-for': '203.0.113.1' };
    await app.request('/a', { headers });

    expect((await app.request('/a', { headers })).status).toBe(429);
    expect((await app.request('/b', { headers })).status).toBe(200);
  });

  it.each<[string, ThrottleConfig, number, number]>([
    ['the default quota', DEFAULT_THROTTLE, 10, 60_000],
    ['public reads', PUBLIC_READ_THROTTLE, 120, 60_000],
    ['login and 2FA attempts', AUTH_ATTEMPT_THROTTLE, 5, 60_000],
    ['admin gallery writes (ADR-0009)', ADMIN_WRITE_THROTTLE, 60, 60_000],
    ['contact messages', CONTACT_THROTTLE, 3, 3_600_000],
  ])(
    'Given %s, When read, Then it allows %i requests per %i ms',
    (_, config, limit, ttlMs) => {
      expect(config).toEqual({ limit, ttlMs });
    },
  );
});
