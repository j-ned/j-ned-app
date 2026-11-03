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

const post = (
  path: string,
  body: string,
  headers: Record<string, string> = {},
) =>
  app().app.request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body,
  });

describe('createApp', () => {
  it('Given a known route under /api, When requested, Then it is served', async () => {
    const res = await app().app.request('/api/health');

    expect(res.status).toBe(200);
  });

  it.each(['/api/nope?x=1', '/api', '/random', '/', '/docs'])(
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

  it('Given malformed JSON, When posted, Then the 400 is the API JSON error body', async () => {
    const res = await post('/api/contact/messages', '{bad');

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      path: '/api/contact/messages',
    });
  });

  it('Given a JSON body over 100 kB, When posted, Then the 413 is the API JSON error body', async () => {
    const res = await post(
      '/api/contact/messages',
      JSON.stringify({ message: 'x'.repeat(200 * 1024) }),
    );

    expect(res.status).toBe(413);
    expect(await res.json()).toMatchObject({
      statusCode: 413,
      error: 'Payload Too Large',
      message: 'request entity too large',
      path: '/api/contact/messages',
    });
  });

  it('Given a field the DTO does not declare, When posted, Then it is refused', async () => {
    const res = await post(
      '/api/contact/messages',
      JSON.stringify({ ...(JSON.parse(MESSAGE) as object), isAdmin: true }),
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      message: ['Clé non reconnue : "isAdmin"'],
    });
  });

  it('Given a cross-site write, When posted, Then the 403 is the API JSON error body', async () => {
    const { app: api, contact } = app();
    const res = await api.request('/api/contact/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'sec-fetch-site': 'cross-site',
        origin: 'https://evil.example',
      },
      body: MESSAGE,
    });

    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({
      statusCode: 403,
      error: 'Forbidden',
    });
    expect(contact.create).not.toHaveBeenCalled();
  });

  it.each<[string, Record<string, string>]>([
    ['same-origin', { 'sec-fetch-site': 'same-origin' }],
    [
      'from the trusted site origin',
      { 'sec-fetch-site': 'same-site', origin: SITE },
    ],
  ])(
    'Given a %s write, When posted, Then it reaches the handler',
    async (_, headers) => {
      expect(
        (await post('/api/contact/messages', MESSAGE, headers)).status,
      ).toBe(201);
    },
  );

  it('Given any response, When read, Then it hides the framework, forbids sniffing and lets the site embed images', async () => {
    const res = await app().app.request('/api/health');

    expect({
      poweredBy: res.headers.get('x-powered-by'),
      nosniff: res.headers.get('x-content-type-options'),
      corp: res.headers.get('cross-origin-resource-policy'),
    }).toEqual({ poweredBy: null, nosniff: 'nosniff', corp: 'cross-origin' });
  });

  it.each<[string, string | null]>([
    [SITE, SITE],
    ['https://evil.example', null],
  ])(
    'Given a preflight from %s, When answered, Then CORS allows only the site',
    async (origin, allowed) => {
      const res = await app().app.request('/api/contact/messages', {
        method: 'OPTIONS',
        headers: {
          origin,
          'access-control-request-method': 'POST',
          'access-control-request-headers': 'content-type',
        },
      });

      expect(res.headers.get('access-control-allow-origin')).toBe(allowed);
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
