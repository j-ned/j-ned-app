import { createApp } from './create-app';
import type { AppConfigService } from './config/app-config.service';
import type { Database } from './database/drizzle.types';
import type { Services } from './services';

const ERROR_KEYS = ['error', 'message', 'path', 'statusCode', 'timestamp'];
const SITE = 'http://localhost:4200';

/** Application complète, services factices : seul le câblage HTTP commun est éprouvé ici. */
function app() {
  const contact = { create: jest.fn().mockResolvedValue(undefined) };
  const services = {
    contact,
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
  return { app: createApp(config, db, services), contact };
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
      message: ['property isAdmin should not exist'],
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
