import type { ValidatedEnv } from './env.validation';

/** Configuration typée de l'application, lue une fois au démarrage (`validateEnv`). */
export class AppConfigService {
  constructor(private readonly env: ValidatedEnv) {}

  get nodeEnv() {
    return this.env.NODE_ENV;
  }
  get isProduction() {
    return this.nodeEnv === 'production';
  }
  get isDevelopment() {
    return this.nodeEnv === 'development';
  }
  get port() {
    return this.env.PORT;
  }
  get databaseUrl() {
    return this.env.DATABASE_URL;
  }
  get logLevel() {
    return this.env.LOG_LEVEL;
  }

  get jwtSecret() {
    return this.env.JWT_SECRET;
  }
  get jwtExpiresIn() {
    return this.env.JWT_EXPIRES_IN;
  }
  get totpAppName() {
    return this.env.TOTP_APP_NAME;
  }
  get cronSecret() {
    return this.env.CRON_SECRET;
  }
  get ssrForwardSecret() {
    return this.env.SSR_FORWARD_SECRET;
  }
  get corsOrigins() {
    return this.env.CORS_ORIGINS;
  }

  get s3Endpoint() {
    return this.env.S3_ENDPOINT;
  }
  get s3Region() {
    return this.env.S3_REGION;
  }
  get s3AccessKey() {
    return this.env.S3_ACCESS_KEY;
  }
  get s3SecretKey() {
    return this.env.S3_SECRET_KEY;
  }

  get resendApiKey() {
    return this.env.RESEND_API_KEY;
  }
  get mailFrom() {
    return this.env.MAIL_FROM;
  }

  get sentryRelease() {
    return this.env.SENTRY_RELEASE;
  }
  get sentryFrontendDsn() {
    return this.env.SENTRY_FRONTEND_DSN;
  }
}
