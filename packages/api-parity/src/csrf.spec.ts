import { beforeAll, describe, expect, it } from 'vitest';
import { expectApiError } from './api-error';
import { EVIL_ORIGIN, SITE_ORIGIN, newVisitor, type FetchSite } from './client';
import {
  ADMIN_ROUTES,
  PUBLIC_READ_ROUTES,
  PUBLIC_WRITE_ROUTES,
  isWrite,
  type Route,
} from './routes';
import { adminSession } from './session';

const label = (route: Route): string => `${route.method} ${route.path}`;
const WRITES = [...ADMIN_ROUTES.filter(isWrite), ...PUBLIC_WRITE_ROUTES];

// ADR-0034 : une écriture n'est acceptée que de la même origine ou d'une origine de confiance.
describe('cross-origin protection (CSRF)', () => {
  let session = '';

  beforeAll(async () => {
    session = await adminSession();
  });

  it.each(WRITES.map((route) => [label(route), route] as const))(
    'Given a valid session, When another site sends %s, Then it is refused with 403',
    async (_, route) => {
      const response = await newVisitor().request(route.method, route.path, {
        json: {},
        session,
        site: 'cross-site',
      });

      expectApiError(response, 403, route.path);
    },
  );

  it.each<[string, FetchSite | null, string | undefined]>([
    ['a sibling subdomain', 'same-site', 'https://evil.nedellec-julien.fr'],
    ['an opaque origin (sandboxed iframe)', 'cross-site', 'null'],
    ['an older browser on another site (Origin only)', null, EVIL_ORIGIN],
  ])('Given a write from %s, When it is sent, Then it is refused', async (_, site, origin) => {
    const response = await newVisitor().request('POST', '/api/auth/logout', {
      session,
      site,
      origin,
    });

    expectApiError(response, 403);
  });

  // 401 et non 403 : le contrôle d'origine laisse passer, c'est la session absente qui est refusée.
  it.each<[string, FetchSite | null, string | undefined]>([
    ['the same origin', 'same-origin', undefined],
    ['a navigation typed by the user', 'none', undefined],
    ['the site through its API subdomain (trusted origin)', 'same-site', SITE_ORIGIN],
    ['an older browser on the site (Origin only)', null, SITE_ORIGIN],
    ['a client that is not a browser (no Origin, no Sec-Fetch-Site)', null, undefined],
  ])(
    'Given a write from %s, When it is sent, Then the origin check lets it through',
    async (_, site, origin) => {
      const response = await newVisitor().request('POST', '/api/auth/change-password', {
        json: {},
        site,
        origin,
      });

      expectApiError(response, 401);
    },
  );

  it.each(PUBLIC_READ_ROUTES.map((route) => [label(route), route] as const))(
    'Given another site, When it reads %s, Then the read is not refused (reads change nothing)',
    async (_, route) => {
      const response = await newVisitor().request(route.method, route.path, {
        site: 'cross-site',
      });

      expect(response.status).not.toBe(403);
    },
  );
});
