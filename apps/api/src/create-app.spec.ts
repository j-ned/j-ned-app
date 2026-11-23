import { createApp } from './create-app';
import { createServices } from './services';
import { asDatabase } from './testing/mock-database';
import { createTestConfig } from './testing/test-config';
import { createMockDb } from './testing/test-utils';

const ERROR_KEYS = ['error', 'message', 'path', 'statusCode', 'timestamp'];
const SITE = 'http://localhost:4200';

// Vrais services sur une base factice : seul le câblage HTTP commun est éprouvé ici.
function app() {
  const config = createTestConfig({ CORS_ORIGINS: SITE, JWT_EXPIRES_IN: '7d' });
  const mockDb = createMockDb();
  mockDb.execute.mockResolvedValue([]);
  const db = asDatabase(mockDb);
  return {
    app: createApp(config, db, createServices({ config, db, s3: null })),
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
