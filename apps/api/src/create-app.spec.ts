import { createApp } from './create-app';
import type { AppConfigService } from './config/app-config.service';
import type { Database } from './database/drizzle.types';
import type { Services } from './services';

const ERROR_KEYS = ['error', 'message', 'path', 'statusCode', 'timestamp'];
const SITE = 'http://localhost:4200';

/** Application complète, services factices : seul le câblage HTTP commun est éprouvé ici. */
function app() {
  const contact = { create: jest.fn().mockResolvedValue(undefined) };
  const blog = {
    like: jest.fn().mockResolvedValue({ likesCount: 1 }),
    remove: jest.fn().mockResolvedValue(undefined),
  };
  const jwt = { verify: jest.fn() };
  const users = { findById: jest.fn() };
  const services = { contact, blog, jwt, users } as unknown as Services;
  const signIn = () => {
    jwt.verify.mockReturnValue({ sub: 'u1', tokenVersion: 0 });
    users.findById.mockResolvedValue({ id: 'u1', tokenVersion: 0 });
  };
  const config = {
    corsOrigins: [SITE],
    jwtExpiresIn: '7d',
  } as AppConfigService;
  const db = {
    execute: jest.fn().mockResolvedValue([]),
  } as unknown as Database;
  return {
    app: createApp(config, db, services),
    contact,
    blog,
    signIn,
  };
}

describe('createApp', () => {
  it('Given a known route under /api, When requested, Then it is served', async () => {
    const res = await app().app.request('/api/health');

    expect(res.status).toBe(200);
  });

  it.each(['/api/nope?x=1'])(
    'Given the unknown route %s, When requested, Then the 404 is the API JSON error body',
    async (path) => {
      const res = await app().app.request(path);

      expect(res.status).toBe(404);
      expect(res.headers.get('content-type')).toMatch(/^application\/json/);
      const body = (await res.json()) as object;
      expect(Object.keys(body).sort()).toEqual(ERROR_KEYS);
      expect(body).toMatchObject({
        statusCode: 404,
        error: 'Not Found',
        message: `Cannot GET ${path}`,
        path,
      });
    },
  );
});
