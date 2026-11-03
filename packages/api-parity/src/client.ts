import { randomBytes } from 'node:crypto';
import { parityEnv } from './env';

export const AUTH_COOKIE = '__Host-token';
export const SITE_ORIGIN = 'https://nedellec-julien.fr';
export const EVIL_ORIGIN = 'https://evil.example';

export type FetchSite = 'same-origin' | 'same-site' | 'cross-site' | 'none';

export type RequestOptions = {
  readonly json?: unknown;
  readonly body?: BodyInit;
  readonly headers?: Readonly<Record<string, string>>;
  /** Valeur du cookie de session. */
  readonly session?: string;
  /**
   * En-têtes qu'un navigateur poserait : `same-origin` par défaut (le site appelle sa propre
   * origine), `null` pour un client hors navigateur (ni `Sec-Fetch-Site` ni `Origin`).
   */
  readonly site?: FetchSite | null;
  readonly origin?: string;
};

export type ApiResponse = {
  readonly status: number;
  readonly headers: Headers;
  readonly setCookies: readonly string[];
  readonly text: string;
  readonly body: unknown;
};

/**
 * Un visiteur = une adresse IP, transmise en `X-Forwarded-For` comme le fait un proxy de confiance.
 * Chaque visiteur reçoit une IPv6 tirée au hasard dans 2001:db8::/32 (plage de documentation, RFC 3849) :
 * 96 bits aléatoires, aucune collision possible entre tests, fichiers ou exécutions, donc aucun quota
 * partagé par accident.
 */
export type Visitor = {
  readonly ip: string;
  readonly request: (
    method: string,
    path: string,
    options?: RequestOptions,
  ) => Promise<ApiResponse>;
};

function nextIp(): string {
  const groups = randomBytes(12).toString('hex').match(/.{4}/g) ?? [];
  return `2001:db8:${groups.join(':')}`;
}

function browserHeaders(
  site: FetchSite | null,
  origin: string | undefined,
): Record<string, string> {
  if (site === null) return origin ? { origin } : {};
  const defaultOrigin = site === 'cross-site' ? EVIL_ORIGIN : SITE_ORIGIN;
  return { 'sec-fetch-site': site, origin: origin ?? defaultOrigin };
}

export async function send(
  ip: string,
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse> {
  const { apiUrl } = parityEnv();
  const headers: Record<string, string> = {
    'x-forwarded-for': ip,
    ...browserHeaders(options.site === undefined ? 'same-origin' : options.site, options.origin),
    ...(options.session ? { cookie: `${AUTH_COOKIE}=${options.session}` } : {}),
    ...(options.json === undefined ? {} : { 'content-type': 'application/json' }),
    ...options.headers,
  };
  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers,
    // `fetch` refuse un corps sur GET/HEAD : il est ignoré pour ces méthodes.
    body: ['GET', 'HEAD'].includes(method)
      ? undefined
      : options.json === undefined
        ? options.body
        : JSON.stringify(options.json),
    redirect: 'manual',
  });
  const text = await response.text();
  let body: unknown = null;
  try {
    body = text === '' ? null : JSON.parse(text);
  } catch {
    body = null;
  }
  return {
    status: response.status,
    headers: response.headers,
    setCookies: response.headers.getSetCookie(),
    text,
    body,
  };
}

export function newVisitor(): Visitor {
  const ip = nextIp();
  return {
    ip,
    request: (method, path, options) => send(ip, method, path, options),
  };
}

/** Attribut d'un `Set-Cookie` (`Max-Age`, `SameSite`…), insensible à la casse ; `true` si sans valeur. */
export function cookieAttribute(setCookie: string, name: string): string | true | undefined {
  for (const part of setCookie.split(';').slice(1)) {
    const [key, ...value] = part.trim().split('=');
    if (key?.toLowerCase() === name.toLowerCase()) return value.length ? value.join('=') : true;
  }
  return undefined;
}

export function cookieNamed(setCookies: readonly string[], name: string): string | undefined {
  return setCookies.find((cookie) => cookie.startsWith(`${name}=`));
}

export function cookieValue(setCookie: string): string {
  return setCookie.slice(setCookie.indexOf('=') + 1).split(';')[0] ?? '';
}
