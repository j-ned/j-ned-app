import { createApp, type AppOptions } from './create-app';
import type { AppConfigService } from './config/app-config.service';
import type { Database } from './database/drizzle.types';
import type { Services } from './services';

const ERROR_KEYS = ['error', 'message', 'path', 'statusCode', 'timestamp'];
const SITE = 'http://localhost:4200';

/** Application complète, services factices : seul le câblage HTTP commun est éprouvé ici. */
function app(options: AppOptions = {}) {
  const contact = { create: jest.fn().mockResolvedValue(undefined) };
  const blog = { like: jest.fn().mockResolvedValue({ likesCount: 1 }) };
  const services = {
    contact,
    blog,
    jwt: { verify: jest.fn() },
    users: { findById: jest.fn() },
  } as unknown as Services;
  const config = {
    corsOrigins: [SITE],
    jwtExpiresIn: '7d',
  } as AppConfigService;
  const db = {
    execute: jest.fn().mockResolvedValue([]),
  } as unknown as Database;
  return { app: createApp(config, db, services, options), contact, blog };
}

const MESSAGE = JSON.stringify({
  name: 'Ada',
  email: 'ada@example.test',
  subject: 'Bonjour',
  message: 'Un message',
});

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

describe('createApp: cache CDN du contenu', () => {
  const sameOrigin = {
    'content-type': 'application/json',
    'sec-fetch-site': 'same-origin',
  };

  it('Given a like, When it is counted, Then the content cache is purged, since the post page shows the count', async () => {
    const purgeContentCache = jest.fn().mockResolvedValue(undefined);
    const { app: api, blog } = app({ purgeContentCache });

    const res = await api.request('/api/blog/posts/mon-article/like', {
      method: 'POST',
      headers: sameOrigin,
    });

    expect(res.status).toBe(201);
    expect(blog.like).toHaveBeenCalledWith('mon-article');
    expect(purgeContentCache).toHaveBeenCalledTimes(1);
  });

  it('Given a contact message, When it is stored, Then the content cache is kept, since no page shows it', async () => {
    const purgeContentCache = jest.fn().mockResolvedValue(undefined);
    const { app: api } = app({ purgeContentCache });

    const res = await api.request('/api/contact/messages', {
      method: 'POST',
      headers: sameOrigin,
      body: MESSAGE,
    });

    expect(res.status).toBe(201);
    expect(purgeContentCache).not.toHaveBeenCalled();
  });

  it('Given a write refused for lack of a session, When answered, Then the content cache is kept', async () => {
    const purgeContentCache = jest.fn().mockResolvedValue(undefined);
    const { app: api } = app({ purgeContentCache });

    const res = await api.request('/api/profile', {
      method: 'PUT',
      headers: sameOrigin,
      body: '{}',
    });

    expect(res.status).toBe(401);
    expect(purgeContentCache).not.toHaveBeenCalled();
  });
});
