import type { CookieOptions } from 'express';

/**
 * Préfixe `__Host-` : le navigateur n'accepte ce cookie que `Secure`, sur `Path=/` et sans `Domain`.
 * Il reste attaché à l'hôte exact qui l'a posé : aucun sous-domaine ne peut le lire ni l'écraser.
 */
export const AUTH_COOKIE_NAME = '__Host-token';

/**
 * `Secure` aussi en développement : les navigateurs traitent `http://localhost` comme une origine
 * sûre et y acceptent les cookies `Secure`. `SameSite=Strict` : le site et l'API partagent la même
 * origine, aucune requête légitime ne vient d'un autre site.
 */
export function authCookieOptions(maxAgeMs?: number): CookieOptions {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    ...(maxAgeMs === undefined ? {} : { maxAge: maxAgeMs }),
  };
}
