import type { MiddlewareHandler } from 'hono';
import { clientIp } from './http';
import { TooManyRequestsException } from './http-errors';

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

type Window = { count: number; resetAt: number };

// Au-delà, les fenêtres expirées sont purgées avant d'en ouvrir une nouvelle.
const SWEEP_THRESHOLD = 10_000;

/**
 * Quota d'une route, compté par IP (`clientIp`) sur une fenêtre fixe, en mémoire : chaque appel à
 * `throttle()` a ses propres compteurs, donc chaque route son quota. La requête au-delà de la limite
 * reçoit 429 ; une instance unique de l'API suffit (une seconde instance aurait ses propres compteurs).
 */
export function throttle(
  config: ThrottleConfig = DEFAULT_THROTTLE,
  now: () => number = Date.now,
): MiddlewareHandler {
  const windows = new Map<string, Window>();
  return async (c, next) => {
    const at = now();
    const key = clientIp(c);
    let window = windows.get(key);
    if (!window || window.resetAt <= at) {
      if (windows.size >= SWEEP_THRESHOLD) {
        for (const [ip, w] of windows) if (w.resetAt <= at) windows.delete(ip);
      }
      window = { count: 0, resetAt: at + config.ttlMs };
      windows.set(key, window);
    }
    window.count += 1;
    if (window.count > config.limit) {
      c.header('Retry-After', String(Math.ceil((window.resetAt - at) / 1000)));
      throw new TooManyRequestsException();
    }
    await next();
  };
}
