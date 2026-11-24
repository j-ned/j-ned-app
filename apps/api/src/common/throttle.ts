import type { Context, MiddlewareHandler } from 'hono';
import { isIP } from 'node:net';
import { clientIp, type AppEnv } from './http';
import { TooManyRequestsException, UnauthorizedException } from './http-errors';
import { Logger } from './logger';

export type ThrottleConfig = {
  readonly limit: number;
  readonly ttlMs: number;
  // Compteurs saturés : `reject` (défaut) refuse le nouveau visiteur, `allow` le sert sans le compter.
  readonly whenFull?: 'reject' | 'allow';
};

// Quota de toute route qui n'en déclare pas d'autre.
export const DEFAULT_THROTTLE: ThrottleConfig = {
  limit: 10,
  ttlMs: 60_000,
  whenFull: 'allow',
};

// Le rendu serveur du front relaie l'IP du visiteur et chaque page en consomme quelques-unes : 120 au
// lieu de 10.
export const PUBLIC_READ_THROTTLE: ThrottleConfig = {
  limit: 120,
  ttlMs: 60_000,
  whenFull: 'allow',
};

// Login et 2FA : freine la force brute sans gêner un utilisateur qui se trompe deux fois.
export const AUTH_ATTEMPT_THROTTLE: ThrottleConfig = {
  limit: 5,
  ttlMs: 60_000,
};

// Par compte, d'où qu'ils viennent (un succès remet à zéro) : le quota par IP ne freine pas un
// attaquant qui a le mot de passe et répartit ses essais sur plusieurs adresses.
export const TWO_FACTOR_ACCOUNT_THROTTLE: ThrottleConfig = {
  limit: 5,
  ttlMs: 900_000,
};

// Mot de passe redemandé sous session (changement de mot de passe, retrait de la 2FA) : une session volée ne sert pas d'oracle.
export const REAUTH_ACCOUNT_THROTTLE: ThrottleConfig = {
  limit: 5,
  ttlMs: 900_000,
};

// Galerie : ajouter cinq captures puis leur `alt` dépasse les 10 requêtes du quota par défaut.
export const ADMIN_WRITE_THROTTLE: ThrottleConfig = {
  limit: 60,
  ttlMs: 60_000,
  whenFull: 'allow',
};

// Lectures de l'admin, par compte et par route : 30 retours par minute (relecture espacée de 2 s par le
// front) laissent 30 lectures aux actions et aux navigations sur la même route.
export const ADMIN_READ_THROTTLE: ThrottleConfig = {
  limit: 60,
  ttlMs: 60_000,
  whenFull: 'allow',
};

// Un vrai visiteur envoie un message ; trois par heure laissent la place à une correction.
export const CONTACT_THROTTLE: ThrottleConfig = { limit: 3, ttlMs: 3_600_000 };

// Rafales de beacons d'une même page.
export const TRACK_THROTTLE: ThrottleConfig = {
  limit: 10,
  ttlMs: 1_000,
  whenFull: 'allow',
};

// Compteur d'une fenêtre après la requête courante, et la fin de cette fenêtre (ms epoch).
export type ThrottleHit = {
  readonly count: number;
  readonly resetAt: number;
  // Clé non suivie faute de place : `count` est infini, toute limite est dépassée.
  readonly saturated?: true;
};

// En mémoire : l'API tourne en un seul process.
export interface ThrottleStore {
  hit(key: string, ttlMs: number, now: number): Promise<ThrottleHit>;
  // Rend un coup compté par `hit`, seulement si la fenêtre qui l'a compté (`resetAt`) est toujours la même.
  release(key: string, resetAt: number): Promise<void>;
  reset(key: string): Promise<void>;
}

// ~235 octets par compteur : 5 000 par portée font ~1,2 Mo, ~56 Mo si les 48 portées sont saturées à la fois.
export const DEFAULT_MAX_KEYS_PER_SCOPE = 5_000;

type ThrottleWindow = { count: number; resetAt: number };

// Fenêtre fixe ouverte à la première requête, en mémoire : suffit pour une instance unique.
export class MemoryThrottleStore implements ThrottleStore {
  // Une portée (préfixe de la clé avant `|`) par route ou par usage : en saturer une ne ferme pas les autres.
  private readonly scopes = new Map<string, Map<string, ThrottleWindow>>();

  constructor(
    private readonly maxKeysPerScope: number = DEFAULT_MAX_KEYS_PER_SCOPE,
  ) {}

  hit(key: string, ttlMs: number, now: number): Promise<ThrottleHit> {
    const windows = this.scopeOf(key);
    const current = windows.get(key);
    if (current && current.resetAt > now) {
      current.count += 1;
      return Promise.resolve({
        count: current.count,
        resetAt: current.resetAt,
      });
    }
    if (current) windows.delete(key);
    const oldest = dropExpired(windows, now);
    // Ni éviction (un flot de clés viderait le compteur d'un attaquant) ni croissance : la clé n'est pas suivie.
    if (oldest && windows.size >= this.maxKeysPerScope) {
      return Promise.resolve({
        count: Number.POSITIVE_INFINITY,
        resetAt: oldest.resetAt,
        saturated: true,
      });
    }
    const opened = { count: 1, resetAt: now + ttlMs };
    windows.set(key, opened);
    return Promise.resolve({ ...opened });
  }

  release(key: string, resetAt: number): Promise<void> {
    const current = this.scopeOf(key).get(key);
    if (current && current.resetAt === resetAt && current.count > 0) {
      current.count -= 1;
    }
    return Promise.resolve();
  }

  reset(key: string): Promise<void> {
    this.scopeOf(key).delete(key);
    return Promise.resolve();
  }

  private scopeOf(key: string): Map<string, ThrottleWindow> {
    const separator = key.indexOf('|');
    const scope = separator === -1 ? '' : key.slice(0, separator);
    let windows = this.scopes.get(scope);
    if (!windows) {
      windows = new Map();
      this.scopes.set(scope, windows);
    }
    return windows;
  }
}

// Une portée n'a qu'une durée : l'ordre d'insertion est l'ordre d'expiration, la purge s'arrête à la première fenêtre vivante (qu'elle rend).
function dropExpired(
  windows: Map<string, ThrottleWindow>,
  now: number,
): ThrottleWindow | undefined {
  for (const [key, window] of windows) {
    if (window.resetAt > now) return window;
    windows.delete(key);
  }
  return undefined;
}

// Un abonné IPv6 dispose d'un /64 entier : compté par adresse, il aurait autant de quotas que d'adresses.
export function quotaAddress(ip: string): string {
  if (isIP(ip) !== 6) return ip;
  const [head = '', tail] = (ip.split('%')[0] ?? '').split('::');
  const leading = ipv6Groups(head);
  const trailing = tail === undefined ? [] : ipv6Groups(tail);
  const groups = [
    ...leading,
    ...new Array<number>(8 - leading.length - trailing.length).fill(0),
    ...trailing,
  ];
  const [g5 = 0, g6 = 0, g7 = 0] = groups.slice(5);
  if (groups.slice(0, 5).every((group) => group === 0) && g5 === 0xffff) {
    return [g6 >> 8, g6 & 0xff, g7 >> 8, g7 & 0xff].join('.');
  }
  const prefix = groups.slice(0, 4).map((group) => group.toString(16));
  return `${prefix.join(':')}::/64`;
}

// Repli d'une portée saturée : une allocation entière (IPv4 /24, IPv6 /48) partage un compteur, ce qui
// coûte à un flot venu d'un même réseau sans fermer la route aux autres réseaux.
export function networkQuotaAddress(ip: string): string {
  const address = quotaAddress(ip);
  if (isIP(address) === 4) {
    return `${address.split('.').slice(0, 3).join('.')}.0/24`;
  }
  if (address.endsWith('::/64')) {
    return `${address.split(':').slice(0, 3).join(':')}::/48`;
  }
  return address;
}

function ipv6Groups(part: string): number[] {
  if (part === '') return [];
  return part.split(':').flatMap((group) => {
    if (!group.includes('.')) return [Number.parseInt(group, 16)];
    const [a = 0, b = 0, c = 0, d = 0] = group.split('.').map(Number);
    return [(a << 8) | b, (c << 8) | d];
  });
}

let store: ThrottleStore = new MemoryThrottleStore();

// Pour les tests : remise à zéro, panne simulée.
export function setThrottleStore(next: ThrottleStore): void {
  store = next;
}

const logger = new Logger('Throttle');
let routeCount = 0;

// Si le stockage échoue, rend `undefined` (journalisé) et l'appelant laisse passer : une panne de base
// ne doit pas fermer toute l'API.
export async function countHit(
  key: string,
  ttlMs: number,
  at: number = Date.now(),
): Promise<ThrottleHit | undefined> {
  try {
    return await store.hit(key, ttlMs, at);
  } catch (error: unknown) {
    logger.warn(
      { err: error as Error },
      'Throttle store unavailable: request let through',
    );
    return undefined;
  }
}

// Un échec du stockage est journalisé, jamais propagé.
export async function resetHits(key: string): Promise<void> {
  try {
    await store.reset(key);
  } catch (error: unknown) {
    logger.warn(
      { err: error as Error },
      'Throttle store unavailable: counter not reset',
    );
  }
}

// Par IP (`clientIp`, par /64 en IPv6), fenêtre fixe. Chaque appel a sa clé, dans l'ordre de
// déclaration des routes (identique d'une instance à l'autre) : chaque route a son quota.
export function throttle(
  config: ThrottleConfig = DEFAULT_THROTTLE,
  now: () => number = Date.now,
): MiddlewareHandler {
  const route = nextRoute();
  return async (c, next) => {
    const at = now();
    const ip = clientIp(c);
    let hit = await countHit(`${route}|${quotaAddress(ip)}`, config.ttlMs, at);
    if (hit?.saturated && config.whenFull !== 'allow') {
      hit = await countHit(
        `${route}:network|${networkQuotaAddress(ip)}`,
        config.ttlMs,
        at,
      );
    }
    rejectOverLimit(c, hit, config, at);
    await next();
  };
}

export type SessionThrottleConfig = {
  // Stockage saturé : la vérification de session a lieu sans être comptée (`whenFull: 'allow'`).
  readonly anonymous: Omit<ThrottleConfig, 'whenFull'>;
  readonly account: ThrottleConfig;
};

// Route sous session : un compte connecté est compté par son identifiant, d'où qu'il vienne ; un refus
// 401 est compté par IP, et l'IP qui a épuisé ses refus reçoit 429 avant toute vérification de session.
// Un anonyme ne touche donc ni au quota d'un compte ni à la base au-delà de son quota.
export function throttleSession(
  requireAuth: MiddlewareHandler<AppEnv>,
  config: SessionThrottleConfig = {
    anonymous: DEFAULT_THROTTLE,
    account: ADMIN_READ_THROTTLE,
  },
  now: () => number = Date.now,
): MiddlewareHandler<AppEnv> {
  const route = nextRoute();
  const { anonymous, account } = config;
  return async (c, next) => {
    const at = now();
    const addressKey = `${route}|${quotaAddress(clientIp(c))}`;
    // Le refus est compté avant la vérification puis rendu si elle aboutit : des requêtes simultanées ne
    // passent pas toutes la vérification avant que le premier 401 soit compté.
    const reserved = await countHit(addressKey, anonymous.ttlMs, at);
    const tracked = reserved?.saturated ? undefined : reserved;
    if (tracked && tracked.count > anonymous.limit) {
      throw tooManyRequests(c, tracked, at);
    }
    let authenticated = false;
    try {
      await requireAuth(c, async () => {
        authenticated = true;
        if (tracked) await releaseHit(addressKey, tracked.resetAt);
        const hit = await countHit(
          `${route}:account|${c.var.user.id}`,
          account.ttlMs,
          at,
        );
        rejectOverLimit(c, hit, account, at);
        await next();
      });
    } catch (error: unknown) {
      // Seul un refus de session reste compté contre l'IP, pas une panne de la vérification.
      if (
        !authenticated &&
        tracked &&
        !(error instanceof UnauthorizedException)
      ) {
        await releaseHit(addressKey, tracked.resetAt);
      }
      throw error;
    }
  };
}

function nextRoute(): string {
  routeCount += 1;
  return `route${routeCount}`;
}

// Un échec du stockage est journalisé, jamais propagé : le coup reste compté.
async function releaseHit(key: string, resetAt: number): Promise<void> {
  try {
    await store.release(key, resetAt);
  } catch (error: unknown) {
    logger.warn({ err: error }, 'Throttle store unavailable: hit not released');
  }
}

function rejectOverLimit(
  c: Context,
  hit: ThrottleHit | undefined,
  config: ThrottleConfig,
  at: number,
): void {
  if (!hit) return;
  if (hit.saturated && config.whenFull === 'allow') return;
  if (hit.count > config.limit) throw tooManyRequests(c, hit, at);
}

function tooManyRequests(
  c: Context,
  hit: ThrottleHit,
  at: number,
): TooManyRequestsException {
  c.header(
    'Retry-After',
    String(Math.max(1, Math.ceil((hit.resetAt - at) / 1000))),
  );
  return new TooManyRequestsException();
}
