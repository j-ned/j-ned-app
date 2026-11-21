import { Hono } from 'hono';
import { handleError } from './error-handler';
import {
  ADMIN_WRITE_THROTTLE,
  AUTH_ATTEMPT_THROTTLE,
  CONTACT_THROTTLE,
  DEFAULT_THROTTLE,
  PUBLIC_READ_THROTTLE,
  DEFAULT_MAX_KEYS_PER_SCOPE,
  TRACK_THROTTLE,
  MemoryThrottleStore,
  quotaAddress,
  setThrottleStore,
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

  it('Given a throttled visitor, When the window has passed, Then it is served again', async () => {
    const { hit, advance } = throttledApp({ limit: 1, ttlMs: 60_000 });
    await hit('203.0.113.1');
    advance(60_000);

    expect((await hit('203.0.113.1')).status).toBe(200);
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

  it('Given a broken counter store, When a request comes, Then it is let through rather than blocked', async () => {
    setThrottleStore({
      hit: () => Promise.reject(new Error('db down')),
      reset: () => Promise.resolve(),
    });
    try {
      const { hit } = throttledApp({ limit: 1, ttlMs: 60_000 });

      expect(await statuses(3, () => hit('203.0.113.9'))).toEqual([
        200, 200, 200,
      ]);
    } finally {
      setThrottleStore(new MemoryThrottleStore());
    }
  });

  it.each<[string, ThrottleConfig, number, number, 'reject' | 'allow']>([
    ['the default quota', DEFAULT_THROTTLE, 10, 60_000, 'allow'],
    ['public reads', PUBLIC_READ_THROTTLE, 120, 60_000, 'allow'],
    ['login and 2FA attempts', AUTH_ATTEMPT_THROTTLE, 5, 60_000, 'reject'],
    [
      'admin gallery writes (ADR-0009)',
      ADMIN_WRITE_THROTTLE,
      60,
      60_000,
      'allow',
    ],
    ['contact messages', CONTACT_THROTTLE, 3, 3_600_000, 'reject'],
    ['audience beacons', TRACK_THROTTLE, 10, 1_000, 'allow'],
  ])(
    'Given %s, When read, Then it allows %i requests per %i ms and a full store makes it %s new visitors',
    (_, config, limit, ttlMs, whenFull) => {
      expect({ whenFull: 'reject', ...config }).toEqual({
        limit,
        ttlMs,
        whenFull,
      });
    },
  );
});

describe('quota address', () => {
  it.each<[string, string, string]>([
    ['an IPv4 address', '203.0.113.1', '203.0.113.1'],
    ['a full IPv6 address', '2001:db8:1:2:3:4:5:6', '2001:db8:1:2::/64'],
    ['an abbreviated IPv6 address', '2001:DB8::1', '2001:db8:0:0::/64'],
    ['the IPv6 loopback', '::1', '0:0:0:0::/64'],
    ['a zoned IPv6 address', 'fe80::1%eth0', 'fe80:0:0:0::/64'],
    ['an IPv4-mapped address', '::ffff:203.0.113.1', '203.0.113.1'],
    ['an IPv4-mapped address in hex', '::ffff:cb00:7101', '203.0.113.1'],
    [
      'an IPv6 address ending in dotted IPv4',
      '64:ff9b::203.0.113.1',
      '64:ff9b:0:0::/64',
    ],
    ['an unknown address', '', ''],
  ])('Given %s (%s), When keyed, Then its counter is %s', (_, ip, key) => {
    expect(quotaAddress(ip)).toBe(key);
  });

  const second = async (first: string, other: string) => {
    let now = 0;
    const app = new Hono()
      .get(
        '/x',
        throttle({ limit: 1, ttlMs: 60_000 }, () => now),
        (c) => c.text('ok'),
      )
      .onError(handleError);
    const hit = (ip: string) =>
      app.request('/x', { headers: { 'x-forwarded-for': ip } });
    await hit(first);
    now = 1;
    return (await hit(other)).status;
  };

  it.each<[string, string, string, number]>([
    [
      'two addresses of one /64',
      '2001:db8:1:2::1',
      '2001:db8:1:2:ffff::9',
      429,
    ],
    ['two /64 of one /48', '2001:db8:1:2::1', '2001:db8:1:3::1', 200],
    ['two IPv4 addresses', '203.0.113.1', '203.0.113.2', 200],
    ['one IPv4 address twice', '203.0.113.1', '203.0.113.1', 429],
    [
      'an IPv4 address and its mapped form',
      '203.0.113.1',
      '::ffff:203.0.113.1',
      429,
    ],
    ['two zoned addresses of one /64', 'fe80::1%eth0', 'fe80::2%eth1', 429],
  ])(
    'Given %s (%s then %s), When the second calls after the first used the quota, Then it gets %i',
    async (_, first, other, status) => {
      expect(await second(first, other)).toBe(status);
    },
  );
});

describe('MemoryThrottleStore, bounded', () => {
  const TTL = 60_000;

  it('Given a scope at its cap with live counters, When a new key comes, Then it is not tracked and reported saturated until the oldest window ends', async () => {
    const store = new MemoryThrottleStore(2);
    await store.hit('2fa|a', TTL, 0);
    await store.hit('2fa|b', TTL, 10);

    expect(await store.hit('2fa|c', TTL, 20)).toEqual({
      count: Number.POSITIVE_INFINITY,
      resetAt: TTL,
      saturated: true,
    });
  });

  it('Given a blocked key, When an attacker floods the scope with new keys, Then the blocked key keeps its counter', async () => {
    const store = new MemoryThrottleStore(3);
    for (let i = 0; i < 4; i += 1) await store.hit('2fa|attacker', TTL, 0);

    for (let i = 0; i < 50; i += 1) await store.hit(`2fa|flood${i}`, TTL, 1);

    expect(await store.hit('2fa|attacker', TTL, 2)).toEqual({
      count: 5,
      resetAt: TTL,
    });
  });

  it('Given a scope at its cap, When its windows have expired, Then they are dropped and a new key is tracked', async () => {
    const store = new MemoryThrottleStore(2);
    await store.hit('2fa|a', TTL, 0);
    await store.hit('2fa|b', TTL, 0);

    expect(await store.hit('2fa|c', TTL, TTL)).toEqual({
      count: 1,
      resetAt: 2 * TTL,
    });
    expect((await store.hit('2fa|d', TTL, TTL)).count).toBe(1);
  });

  it('Given a scope at its cap, When only its oldest window has expired, Then exactly that one is dropped', async () => {
    const store = new MemoryThrottleStore(2);
    await store.hit('2fa|a', TTL, 0);
    await store.hit('2fa|b', TTL, 30_000);

    expect((await store.hit('2fa|c', TTL, TTL)).count).toBe(1);
    expect((await store.hit('2fa|b', TTL, TTL + 1)).count).toBe(2);
    expect((await store.hit('2fa|d', TTL, TTL + 2)).saturated).toBe(true);
  });

  it('Given a scope at its cap, When a key of another scope comes, Then it is tracked: flooding a public route cannot close the login', async () => {
    const store = new MemoryThrottleStore(1);
    await store.hit('route1|203.0.113.1', TTL, 0);

    expect((await store.hit('route2|203.0.113.1', TTL, 0)).count).toBe(1);
    expect((await store.hit('route1|203.0.113.2', TTL, 0)).saturated).toBe(
      true,
    );
  });

  it('Given a key whose window expired, When it comes back in a full scope, Then it opens a new window', async () => {
    const store = new MemoryThrottleStore(1);
    await store.hit('2fa|a', TTL, 0);

    expect(await store.hit('2fa|a', TTL, TTL)).toEqual({
      count: 1,
      resetAt: 2 * TTL,
    });
  });

  it('Given a full scope, When one of its keys is reset, Then its place is free', async () => {
    const store = new MemoryThrottleStore(1);
    await store.hit('2fa|a', TTL, 0);
    await store.reset('2fa|a');

    expect((await store.hit('2fa|b', TTL, 0)).count).toBe(1);
  });

  it('Given no cap argument, When read, Then a scope keeps 5000 keys at most', () => {
    expect(DEFAULT_MAX_KEYS_PER_SCOPE).toBe(5_000);
  });
});

describe('throttle, counter store full', () => {
  const full = async (config: ThrottleConfig) => {
    setThrottleStore(new MemoryThrottleStore(1));
    let now = 0;
    const app = new Hono()
      .get(
        '/x',
        throttle(config, () => now),
        (c) => c.text('ok'),
      )
      .onError(handleError);
    const hit = (ip: string) =>
      app.request('/x', { headers: { 'x-forwarded-for': ip } });
    await hit('203.0.113.1');
    now = 15_000;
    return hit('203.0.113.2');
  };

  afterEach(() => setThrottleStore(new MemoryThrottleStore()));

  it('Given a login-grade quota, When the store is full of live counters, Then a new visitor gets 429 until a counter expires', async () => {
    const res = await full({ limit: 5, ttlMs: 60_000 });

    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBe('45');
  });

  it('Given a quota declared open when full, When the store is full of live counters, Then a new visitor is served uncounted', async () => {
    const res = await full({ limit: 5, ttlMs: 60_000, whenFull: 'allow' });

    expect(res.status).toBe(200);
  });
});
