import type { CookieOptions } from 'hono/utils/cookie';

/**
 * Préfixe `__Host-` : le navigateur n'accepte ce cookie que `Secure`, sur `Path=/` et sans `Domain`.
 * Il reste attaché à l'hôte exact qui l'a posé : aucun sous-domaine ne peut le lire ni l'écraser.
 */
export const AUTH_COOKIE_NAME = '__Host-token';

/**
 * `Secure` aussi en développement : les navigateurs traitent `http://localhost` comme une origine
 * sûre et y acceptent les cookies `Secure`. `SameSite=Strict` : le site et l'API partagent la même
 * origine, aucune requête légitime ne vient d'un autre site. Avec une durée, le cookie expire avec
 * le JWT (`Max-Age` et `Expires`) ; sans, il sert à l'effacer (expiré en 1970).
 */
export function authCookieOptions(
  maxAgeMs?: number,
  now: () => number = Date.now,
): CookieOptions {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    path: '/',
    ...(maxAgeMs === undefined
      ? { expires: new Date(0) }
      : {
          maxAge: Math.floor(maxAgeMs / 1000),
          expires: new Date(now() + maxAgeMs),
        }),
  };
}
