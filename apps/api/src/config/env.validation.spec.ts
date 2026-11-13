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

  it('rejette un VERCEL_ENV inconnu', () => {
    expect(() => validateEnv({ ...baseValid, VERCEL_ENV: 'staging' })).toThrow(
      /VERCEL_ENV/,
    );
  });

  describe('en production (VERCEL_ENV=production)', () => {
    const production = { ...baseValid, VERCEL_ENV: 'production' };

    it('accepte une env complète', () => {
      expect(validateEnv(production).VERCEL_ENV).toBe('production');
    });

    it.each([
      'RESEND_API_KEY',
      'MAIL_FROM',
      'S3_ENDPOINT',
      'S3_REGION',
      'S3_ACCESS_KEY',
      'S3_SECRET_KEY',
    ])('rejette une env sans %s', (name) => {
      expect(() => validateEnv({ ...production, [name]: undefined })).toThrow(
        new RegExp(`${name}: required in production`),
      );
    });

    it('Given NODE_ENV=development, Then la production reste détectée par VERCEL_ENV', () => {
      expect(() =>
        validateEnv({
          ...production,
          NODE_ENV: 'development',
          RESEND_API_KEY: undefined,
        }),
      ).toThrow(/RESEND_API_KEY/);
    });
  });

  it('rejette un APP_ENV inconnu', () => {
    expect(() => validateEnv({ ...baseValid, APP_ENV: 'prod' })).toThrow(
      /APP_ENV/,
    );
  });

  describe('en production hors Vercel (APP_ENV=production)', () => {
    const production = { ...baseValid, APP_ENV: 'production' };

    it('accepte une env complète', () => {
      expect(validateEnv(production).APP_ENV).toBe('production');
    });

    it.each([
      'RESEND_API_KEY',
      'MAIL_FROM',
      'S3_ENDPOINT',
      'S3_REGION',
      'S3_ACCESS_KEY',
      'S3_SECRET_KEY',
    ])('rejette une env sans %s', (name) => {
      expect(() => validateEnv({ ...production, [name]: undefined })).toThrow(
        new RegExp(`${name}: required in production`),
      );
    });
  });

  it('Given une preview Vercel qui porte APP_ENV=production, Then mail et stockage restent facultatifs', () => {
    expect(() =>
      validateEnv({
        DATABASE_URL: baseValid.DATABASE_URL,
        JWT_SECRET: baseValid.JWT_SECRET,
        VERCEL_ENV: 'preview',
        APP_ENV: 'production',
      }),
    ).not.toThrow();
  });

  describe('hors production', () => {
    const withoutMailNorStorage = {
      DATABASE_URL: baseValid.DATABASE_URL,
      JWT_SECRET: baseValid.JWT_SECRET,
    };

    it.each([
      ['preview', { VERCEL_ENV: 'preview' }],
      ['vercel dev', { VERCEL_ENV: 'development' }],
      ['local', {}],
      [
        'preview avec NODE_ENV=production',
        { VERCEL_ENV: 'preview', NODE_ENV: 'production' },
      ],
    ])('Given %s, Then mail et stockage sont facultatifs', (_, env) => {
      expect(() =>
        validateEnv({ ...withoutMailNorStorage, ...env }),
      ).not.toThrow();
    });

    it('Given une valeur fournie, Then elle reste validée', () => {
      expect(() =>
        validateEnv({ ...withoutMailNorStorage, MAIL_FROM: 'pas-un-email' }),
      ).toThrow(/MAIL_FROM/);
    });
  });
});
