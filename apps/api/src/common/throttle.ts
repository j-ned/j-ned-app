import type { MiddlewareHandler } from 'hono';
import { clientIp } from './http';
import { TooManyRequestsException } from './http-errors';
import { Logger } from './logger';

export type ThrottleConfig = { readonly limit: number; readonly ttlMs: number };

/** Quota par défaut de toute route qui n'en déclare pas d'autre : 10 requêtes par minute et par IP. */
export const DEFAULT_THROTTLE: ThrottleConfig = { limit: 10, ttlMs: 60_000 };

/**
 * Lectures publiques (projets, articles) : 120 req/min au lieu des 10 par défaut. Le rendu serveur
 * du front relaie l'IP du visiteur, chaque page en consomme quelques-unes.
 */
export const PUBLIC_READ_THROTTLE: ThrottleConfig = {
  limit: 120,
  ttlMs: 60_000,
};

/**
 * Tentatives d'authentification (login, vérification 2FA) : 5 par minute et par IP. Freine la force
 * brute sans gêner un utilisateur qui se trompe deux fois.
 */
export const AUTH_ATTEMPT_THROTTLE: ThrottleConfig = {
  limit: 5,
  ttlMs: 60_000,
};

/** Écritures admin de galerie : 60 req/min, car ajouter cinq captures puis leur `alt` dépasse 10 (ADR-0009). */
export const ADMIN_WRITE_THROTTLE: ThrottleConfig = {
  limit: 60,
  ttlMs: 60_000,
};

/** Un vrai visiteur envoie un message ; trois par heure laissent la place à une correction. */
export const CONTACT_THROTTLE: ThrottleConfig = { limit: 3, ttlMs: 3_600_000 };

/** Mesure d'audience : rafales de beacons d'une même page (10 par seconde). */
export const TRACK_THROTTLE: ThrottleConfig = { limit: 10, ttlMs: 1_000 };

/** Compteur d'une fenêtre après la requête courante, et la fin de cette fenêtre (ms epoch). */
export type ThrottleHit = { readonly count: number; readonly resetAt: number };

/** Où les compteurs vivent : en mémoire (un seul process) ou en base (fonctions Vercel, ADR-0036). */
export interface ThrottleStore {
  hit(key: string, ttlMs: number, now: number): Promise<ThrottleHit>;
}

// Au-delà, les fenêtres expirées sont purgées avant d'en ouvrir une nouvelle.
const SWEEP_THRESHOLD = 10_000;

/** Fenêtre fixe ouverte à la première requête, en mémoire : suffit pour une instance unique. */
export class MemoryThrottleStore implements ThrottleStore {
  private readonly windows = new Map<
    string,
    { count: number; resetAt: number }
  >();

  hit(key: string, ttlMs: number, now: number): Promise<ThrottleHit> {
    let window = this.windows.get(key);
    if (!window || window.resetAt <= now) {
      if (this.windows.size >= SWEEP_THRESHOLD) {
        for (const [k, w] of this.windows)
          if (w.resetAt <= now) this.windows.delete(k);
      }
      window = { count: 0, resetAt: now + ttlMs };
      this.windows.set(key, window);
    }
    window.count += 1;
    return Promise.resolve({ count: window.count, resetAt: window.resetAt });
  }
}

let store: ThrottleStore = new MemoryThrottleStore();

/** Choisi au démarrage (`bootstrap`) : la base sur Vercel, la mémoire sinon. */
export function setThrottleStore(next: ThrottleStore): void {
  store = next;
}

const logger = new Logger('Throttle');
let routeCount = 0;

/**
 * Quota d'une route, compté par IP (`clientIp`) sur une fenêtre fixe : chaque appel à `throttle()` a sa
 * propre clé (dans l'ordre de déclaration des routes, identique d'une instance à l'autre), donc chaque
 * route son quota. La requête au-delà de la limite reçoit 429. Si le stockage des compteurs échoue, la
 * requête passe (journalisé) : une panne de base ne doit pas fermer toute l'API.
 */
export function throttle(
  config: ThrottleConfig = DEFAULT_THROTTLE,
  now: () => number = Date.now,
): MiddlewareHandler {
  routeCount += 1;
  const route = `route${routeCount}`;
  return async (c, next) => {
    const at = now();
    let hit: ThrottleHit | undefined;
    try {
      hit = await store.hit(`${route}|${clientIp(c)}`, config.ttlMs, at);
    } catch (error: unknown) {
      logger.warn(
        { err: error as Error },
        'Throttle store unavailable: request let through',
      );
    }
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
