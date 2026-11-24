import { Hono, type MiddlewareHandler } from 'hono';
import type { User } from '../database/schema';
import { handleError } from './error-handler';
import type { AppEnv } from './http';
import { UnauthorizedException } from './http-errors';
import {
  ADMIN_READ_THROTTLE,
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
  throttleSession,
  type ThrottleConfig,
} from './throttle';

// Horloge pilotée par le test.
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

async function statuses(
  count: number,
  call: () => Response | Promise<Response>,
) {
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
      release: () => Promise.reject(new Error('db down')),
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
    ['admin gallery writes', ADMIN_WRITE_THROTTLE, 60, 60_000, 'allow'],
    ['admin reads, per account', ADMIN_READ_THROTTLE, 60, 60_000, 'allow'],
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

function account(id: string): User {
  return {
    id,
    email: `${id}@example.com`,
    passwordHash: 'hash',
    isTwoFactorEnabled: false,
    twoFactorSecret: null,
    pendingTwoFactorSecret: null,
    twoFactorBackupCodesHash: null,
    tokenVersion: 0,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  };
}

const REVOKED = 'revoked';
const BROKEN = 'broken';

// Session simulée : l'en-tête `x-account` tient lieu de cookie valide, son absence d'un refus 401.
function sessionApp() {
  let now = 0;
  let authRuns = 0;
  const fakeAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
    authRuns += 1;
    const id = c.req.header('x-account');
    if (!id) throw new UnauthorizedException();
    // Jeton bien signé dont le compte n'existe plus : refusé après une lecture en base.
    if (id === BROKEN) throw new Error('users table unreachable');
    if (id === REVOKED) {
      await new Promise((resolve) => setImmediate(resolve));
      throw new UnauthorizedException();
    }
    c.set('user', account(id));
    await next();
  };
  const app = new Hono<AppEnv>()
    .get(
      '/admin',
      throttleSession(
        fakeAuth,
        {
          anonymous: { limit: 2, ttlMs: 60_000 },
          account: { limit: 3, ttlMs: 60_000 },
        },
        () => now,
      ),
      (c) => c.text(c.var.user.id),
    )
    .onError(handleError);
  const read = (ip: string, id?: string) =>
    app.request('/admin', {
      headers: { 'x-forwarded-for': ip, ...(id ? { 'x-account': id } : {}) },
    });
  return {
    read,
    authRuns: () => authRuns,
    advance: (ms: number) => {
      now += ms;
    },
  };
}

describe('throttleSession', () => {
  it('Given a signed-in account, When it reads more often than the anonymous quota from one address, Then it is served up to its own account quota', async () => {
    const { read } = sessionApp();

    expect(await statuses(4, () => read('203.0.113.1', 'admin'))).toEqual([
      200, 200, 200, 429,
    ]);
  });

  it('Given an account, When it spreads its reads over several addresses, Then they share one quota', async () => {
    const { read } = sessionApp();
    await read('203.0.113.1', 'admin');
    await read('203.0.113.2', 'admin');
    await read('203.0.113.3', 'admin');

    const blocked = await read('203.0.113.4', 'admin');
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('retry-after')).toBe('60');
  });

  it('Given two accounts on one address, When one exhausts its quota, Then the other keeps its own', async () => {
    const { read } = sessionApp();
    await statuses(4, () => read('203.0.113.1', 'first'));

    expect((await read('203.0.113.1', 'second')).status).toBe(200);
  });

  it('Given an anonymous visitor, When it exceeds its refusals, Then it gets 429 without the session check running', async () => {
    const { read, authRuns } = sessionApp();

    expect(await statuses(2, () => read('203.0.113.1'))).toEqual([401, 401]);
    const blocked = await read('203.0.113.1');
    expect({
      status: blocked.status,
      retryAfter: blocked.headers.get('retry-after'),
      authRuns: authRuns(),
    }).toEqual({ status: 429, retryAfter: '60', authRuns: 2 });
  });

  it('Given a revoked session refused after a database read, When ten requests arrive at once, Then the session is checked no more often than the refusal quota', async () => {
    const { read, authRuns } = sessionApp();

    const responses = await Promise.all(
      Array.from({ length: 10 }, async () => read('203.0.113.1', REVOKED)),
    );

    expect({
      unauthorized: responses.filter((res) => res.status === 401).length,
      throttled: responses.filter((res) => res.status === 429).length,
      authRuns: authRuns(),
    }).toEqual({ unauthorized: 2, throttled: 8, authRuns: 2 });
  });

  it('Given session checks that failed for a server fault, When an anonymous visitor then calls from the address, Then it still has its full refusal quota', async () => {
    const { read } = sessionApp();
    await statuses(3, () => read('203.0.113.1', BROKEN));

    expect(await statuses(3, () => read('203.0.113.1'))).toEqual([
      401, 401, 429,
    ]);
  });

  it('Given an anonymous visitor throttled on one address, When an account reads from another, Then the account quota is untouched', async () => {
    const { read } = sessionApp();
    await statuses(5, () => read('203.0.113.1'));

    expect(await statuses(3, () => read('203.0.113.2', 'admin'))).toEqual([
      200, 200, 200,
    ]);
  });

  it('Given signed-in reads from an address, When an anonymous visitor then calls from it, Then it still has its full refusal quota', async () => {
    const { read } = sessionApp();
    await statuses(3, () => read('203.0.113.1', 'admin'));

    expect(await statuses(3, () => read('203.0.113.1'))).toEqual([
      401, 401, 429,
    ]);
  });

  it('Given an exhausted account, When the window has passed, Then it is served again', async () => {
    const { read, advance } = sessionApp();
    await statuses(4, () => read('203.0.113.1', 'admin'));
    advance(60_000);

    expect((await read('203.0.113.1', 'admin')).status).toBe(200);
  });

  it('Given a broken counter store, When reads come, Then they are let through rather than blocked', async () => {
    setThrottleStore({
      hit: () => Promise.reject(new Error('db down')),
      release: () => Promise.reject(new Error('db down')),
      reset: () => Promise.resolve(),
    });
    try {
      const { read } = sessionApp();

      expect(await statuses(5, () => read('203.0.113.9', 'admin'))).toEqual([
        200, 200, 200, 200, 200,
      ]);
    } finally {
      setThrottleStore(new MemoryThrottleStore());
    }
  });
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

describe('MemoryThrottleStore, release', () => {
  it('Given a counted key, When the hit is released within its window, Then the next hit counts as the first again', async () => {
    const store = new MemoryThrottleStore();
    const { resetAt } = await store.hit('route1|a', 60_000, 0);
    await store.release('route1|a', resetAt);

    expect(await store.hit('route1|a', 60_000, 10)).toEqual({
      count: 1,
      resetAt: 60_000,
    });
  });

  it('Given a window that has rolled over, When a hit of the old window is released, Then the new window keeps its count', async () => {
    const store = new MemoryThrottleStore();
    const { resetAt } = await store.hit('route1|a', 60_000, 0);
    await store.hit('route1|a', 60_000, 60_000);
    await store.release('route1|a', resetAt);

    expect((await store.hit('route1|a', 60_000, 60_010)).count).toBe(2);
  });

  it('Given an unknown key, When it is released, Then nothing is opened for it', async () => {
    const store = new MemoryThrottleStore();
    await store.release('route1|b', 60_000);

    expect((await store.hit('route1|b', 60_000, 0)).count).toBe(1);
  });
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
  const fullStore = (config: ThrottleConfig) => {
    setThrottleStore(new MemoryThrottleStore(1));
    let now = 0;
    const app = new Hono()
      .get(
        '/x',
        throttle(config, () => now),
        (c) => c.text('ok'),
      )
      .onError(handleError);
    return {
      hit: (ip: string) =>
        app.request('/x', { headers: { 'x-forwarded-for': ip } }),
      at: (ms: number) => {
        now = ms;
      },
    };
  };
  const LOGIN_GRADE: ThrottleConfig = { limit: 2, ttlMs: 60_000 };

  afterEach(() => setThrottleStore(new MemoryThrottleStore()));

  // Une seule allocation (un /48 IPv6 contient 65 536 /64) remplirait la portée et fermerait la route
  // à tous : un nouveau visiteur est alors compté sous un préfixe plus large, son réseau.
  it('Given a login-grade quota and a store full of one network, When a visitor from another network comes, Then it is served', async () => {
    const { hit, at } = fullStore(LOGIN_GRADE);
    await hit('203.0.113.1');
    at(15_000);

    const res = await hit('198.51.100.7');

    expect(res.status).toBe(200);
  });

  it('Given a login-grade quota and a full store, When the filling network keeps sending new addresses, Then its whole /24 shares one quota', async () => {
    const { hit, at } = fullStore(LOGIN_GRADE);
    await hit('203.0.113.1');
    at(15_000);

    const result: number[] = [];
    for (const ip of ['203.0.113.2', '203.0.113.3', '203.0.113.4']) {
      result.push((await hit(ip)).status);
    }

    expect(result).toEqual([200, 200, 429]);
  });

  it('Given a login-grade quota, When both the store and the wider store are full, Then a new visitor gets 429 until a counter expires', async () => {
    const { hit, at } = fullStore(LOGIN_GRADE);
    await hit('203.0.113.1');
    await hit('203.0.113.2');
    at(15_000);

    const res = await hit('198.51.100.7');

    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBe('45');
  });

  it('Given an IPv6 network filling the store, When another /64 of the same /48 comes, Then it shares the /48 quota', async () => {
    const { hit } = fullStore({ limit: 1, ttlMs: 60_000 });
    await hit('2001:db8:1:1::1');

    const statusesOfSameAllocation = [
      (await hit('2001:db8:1:2::1')).status,
      (await hit('2001:db8:1:3::1')).status,
    ];

    expect(statusesOfSameAllocation).toEqual([200, 429]);
  });

  it('Given a quota declared open when full, When the store is full of live counters, Then a new visitor is served uncounted', async () => {
    const { hit, at } = fullStore({
      limit: 5,
      ttlMs: 60_000,
      whenFull: 'allow',
    });
    await hit('203.0.113.1');
    at(15_000);

    expect((await hit('203.0.113.2')).status).toBe(200);
  });
});
