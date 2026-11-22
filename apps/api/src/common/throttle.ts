import type { MiddlewareHandler } from 'hono';
import { isIP } from 'node:net';
import { clientIp } from './http';
import { TooManyRequestsException } from './http-errors';
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
  routeCount += 1;
  const route = `route${routeCount}`;
  return async (c, next) => {
    const at = now();
    const hit = await countHit(
      `${route}|${quotaAddress(clientIp(c))}`,
      config.ttlMs,
      at,
    );
    if (hit?.saturated && config.whenFull === 'allow') return next();
    if (hit && hit.count > config.limit) {
      c.header(
        'Retry-After',
        String(Math.max(1, Math.ceil((hit.resetAt - at) / 1000))),
      );
      throw new TooManyRequestsException();
    }
    await next();
  };
}
