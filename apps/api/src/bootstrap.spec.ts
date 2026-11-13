import pino from 'pino';
import { bootstrap } from './bootstrap';
import { setRootLogger } from './common/logger';

const PREVIEW_WITHOUT_STORAGE_NOR_MAIL = {
  APP_ENV: 'preview',
  NODE_ENV: 'production',
  LOG_LEVEL: 'fatal',
  DATABASE_URL: 'postgres://u:p@127.0.0.1:1/preview',
  JWT_SECRET: '0123456789abcdef0123456789abcdef',
};

describe('bootstrap', () => {
  afterEach(() => setRootLogger(pino({ level: 'silent' })));

  it('Given a preview without S3 nor Resend, When the API starts, Then it serves and storage answers 503', async () => {
    const { s3, app, database } = bootstrap(PREVIEW_WITHOUT_STORAGE_NOR_MAIL);
    try {
      expect(s3).toBeNull();
      const res = await app.request(
        '/api/storage/portfolio-storage/blog/1-abcd1234.avif',
      );
      expect(res.status).toBe(503);
    } finally {
      await database.close();
    }
  });

  it('Given production without Resend, When the API starts, Then it refuses with a readable message', () => {
    expect(() =>
      bootstrap({
        ...PREVIEW_WITHOUT_STORAGE_NOR_MAIL,
        APP_ENV: 'production',
      }),
    ).toThrow(/RESEND_API_KEY: required in production/);
  });
});
