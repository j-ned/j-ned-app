import { beforeAll, describe, expect, it } from 'vitest';
import { expectApiError } from './api-error';
import { newVisitor } from './client';
import { ADMIN_ROUTES, PUBLIC_READ_ROUTES, type Route } from './routes';
import { adminSession } from './session';

const label = (route: Route): string => `${route.method} ${route.path}`;

describe('access to every route', () => {
  it.each(ADMIN_ROUTES.map((route) => [label(route), route] as const))(
    'Given no session, When %s is called, Then the API answers 401 in its error format',
    async (_, route) => {
      const response = await newVisitor().request(route.method, route.path, {
        json: {},
      });

      expectApiError(response, 401, route.path.split('?')[0]);
    },
  );

  it.each(ADMIN_ROUTES.map((route) => [label(route), route] as const))(
    'Given a forged session cookie, When %s is called, Then the API answers 401',
    async (_, route) => {
      const response = await newVisitor().request(route.method, route.path, {
        json: {},
        session: 'not-a-jwt',
      });

      expectApiError(response, 401);
    },
  );

  it.each(PUBLIC_READ_ROUTES.map((route) => [label(route), route] as const))(
    'Given no session, When %s is read, Then it is neither refused nor failing',
    async (_, route) => {
      const response = await newVisitor().request(route.method, route.path);

      expect([200, 404], response.text).toContain(response.status);
    },
  );

  describe('with an admin session', () => {
    let session = '';

    beforeAll(async () => {
      session = await adminSession();
    });

    it.each(
      ADMIN_ROUTES.filter((route) => route.method === 'GET').map(
        (route) => [label(route), route] as const,
      ),
    )('Given a valid session, When %s is read, Then it is served', async (_, route) => {
      const response = await newVisitor().request(route.method, route.path, {
        session,
      });

      expect(response.status, response.text).toBe(200);
    });
  });

  it.each(['/api/nope', '/api/projects/x/y/z', '/nope', '/'])(
    'Given the unknown path %s, When it is read, Then the 404 is in the API error format',
    async (path) => {
      expectApiError(await newVisitor().request('GET', path), 404, path);
    },
  );

  it('Given a known path with an unknown method, When it is called, Then the API answers 404', async () => {
    expectApiError(await newVisitor().request('DELETE', '/api/health'), 404, '/api/health');
  });

  it('Given a production API, When the Swagger UI is requested, Then it does not exist', async () => {
    for (const path of ['/docs', '/docs-json', '/api/docs']) {
      expect((await newVisitor().request('GET', path)).status, path).toBe(404);
    }
  });
});
