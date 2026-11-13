import { AppConfigService } from './app-config.service';
import { validateEnv } from './env.validation';

const BASE = {
  DATABASE_URL: 'postgres://u:p@localhost:55432/db',
  JWT_SECRET: '0123456789abcdef0123456789abcdef',
};
const MAIL = { RESEND_API_KEY: 're_test_key', MAIL_FROM: 'noreply@test.local' };
const S3 = {
  S3_ENDPOINT: 'http://localhost:9000',
  S3_REGION: 'auto',
  S3_ACCESS_KEY: 'access-key',
  S3_SECRET_KEY: 'secret-key-12345',
};

const config = (env: Record<string, unknown>) =>
  new AppConfigService(validateEnv({ ...BASE, ...env }));

describe('AppConfigService', () => {
  describe('deployment', () => {
    it.each([
      [{ APP_ENV: 'preview', NODE_ENV: 'production' }, 'preview'],
      [{}, 'local'],
      [{ NODE_ENV: 'production' }, 'local'],
      [{ APP_ENV: 'production', ...MAIL, ...S3 }, 'production'],
      [{ APP_ENV: 'preview' }, 'preview'],
    ])('Given %o, Then %s', (env, expected) => {
      expect(config(env).deployment).toBe(expected);
    });
  });

  describe('mailTransport', () => {
    it('Given a preview with Resend variables, Then no mail is really sent', () => {
      expect(config({ APP_ENV: 'preview', ...MAIL }).mailTransport).toEqual({
        kind: 'log',
      });
    });

    it('Given a preview flagged NODE_ENV=production, Then no mail is really sent', () => {
      expect(
        config({ APP_ENV: 'preview', NODE_ENV: 'production', ...MAIL })
          .mailTransport,
      ).toEqual({ kind: 'log' });
    });

    it('Given production, Then mails go through Resend', () => {
      expect(
        config({ APP_ENV: 'production', ...MAIL, ...S3 }).mailTransport,
      ).toEqual({
        kind: 'resend',
        apiKey: 're_test_key',
        from: 'noreply@test.local',
      });
    });

    it('Given a local run with Resend variables, Then mails go through Resend', () => {
      expect(config(MAIL).mailTransport).toEqual({
        kind: 'resend',
        apiKey: 're_test_key',
        from: 'noreply@test.local',
      });
    });

    it('Given a local run without Resend variables, Then mails are only logged', () => {
      expect(config({}).mailTransport).toEqual({ kind: 'log' });
      expect(config({ MAIL_FROM: MAIL.MAIL_FROM }).mailTransport).toEqual({
        kind: 'log',
      });
    });
  });

  describe('s3Settings', () => {
    const expected = {
      s3Endpoint: S3.S3_ENDPOINT,
      s3Region: S3.S3_REGION,
      s3AccessKey: S3.S3_ACCESS_KEY,
      s3SecretKey: S3.S3_SECRET_KEY,
    };

    it.each([
      ['production', { APP_ENV: 'production', ...MAIL }],
      ['preview', { APP_ENV: 'preview' }],
      ['local', {}],
    ])(
      'Given %s with a complete S3 configuration, Then storage is enabled',
      (_, env) => {
        expect(config({ ...env, ...S3 }).s3Settings).toEqual(expected);
      },
    );

    it('Given no S3 configuration outside production, Then storage is disabled', () => {
      expect(config({ APP_ENV: 'preview' }).s3Settings).toBeNull();
    });

    it('Given a partial S3 configuration outside production, Then storage is disabled', () => {
      expect(
        config({ APP_ENV: 'preview', ...S3, S3_SECRET_KEY: undefined })
          .s3Settings,
      ).toBeNull();
    });
  });
});
