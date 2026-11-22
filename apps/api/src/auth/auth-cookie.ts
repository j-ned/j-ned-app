import type { CookieOptions } from 'hono/utils/cookie';

// Préfixe `__Host-` : le navigateur l'exige `Secure`, sur `Path=/` et sans `Domain` ; aucun
// sous-domaine ne peut le lire ni l'écraser.
export const AUTH_COOKIE_NAME = '__Host-token';

// `Secure` même en local (`http://localhost` est une origine sûre) ; `Strict` : site et API partagent
// l'origine. Avec `maxAgeMs`, expire avec le JWT ; sans, efface le cookie (expiré en 1970).
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
