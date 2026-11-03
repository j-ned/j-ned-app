import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const baseValid = {
    DATABASE_URL: 'postgres://u:p@localhost:55432/db',
    JWT_SECRET: '0123456789abcdef0123456789abcdef', // exactly 32 chars
    S3_ENDPOINT: 'http://localhost:9000',
    S3_REGION: 'us-east-1',
    S3_ACCESS_KEY: 'access-key',
    S3_SECRET_KEY: 'secret-key-12345',
    RESEND_API_KEY: 're_test_key',
    MAIL_FROM: 'noreply@test.local',
  };

  it('parse une env valide minimaliste avec défauts', () => {
    const result = validateEnv(baseValid);
    expect(result.NODE_ENV).toBe('development');
    expect(result.PORT).toBe(3000);
    expect(result.DATABASE_URL).toBe(baseValid.DATABASE_URL);
    expect(result.LOG_LEVEL).toBe('debug'); // défaut auto en dev
  });

  it('rejette PORT hors plage', () => {
    expect(() => validateEnv({ ...baseValid, PORT: '99999' })).toThrow(/PORT/);
  });

  it('rejette DATABASE_URL absente', () => {
    expect(() => validateEnv({})).toThrow(/DATABASE_URL/);
  });

  it('rejette DATABASE_URL non-postgres', () => {
    expect(() => validateEnv({ DATABASE_URL: 'mysql://u:p@h/d' })).toThrow(
      /postgres/,
    );
  });

  it('rejette JWT_SECRET trop court', () => {
    expect(() => validateEnv({ ...baseValid, JWT_SECRET: 'short' })).toThrow(
      /JWT_SECRET/,
    );
  });

  it('rejette une env sans RESEND_API_KEY', () => {
    expect(() =>
      validateEnv({ ...baseValid, RESEND_API_KEY: undefined }),
    ).toThrow(/RESEND_API_KEY/);
  });
});
