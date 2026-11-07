import type { S3Settings } from '../storage/s3-client';
import type { ValidatedEnv } from './env.validation';

/**
 * Où tourne l'API, d'après `VERCEL_ENV` seul (jamais `NODE_ENV`, qui peut valoir `production` sur
 * une preview) : `preview` couvre toute exécution Vercel hors production, `local` tout le reste.
 */
export type Deployment = 'production' | 'preview' | 'local';

/** Resend en production ; journal seul en preview (quoi que contiennent ses variables) ou sans clé. */
export type MailTransport =
  | { readonly kind: 'resend'; readonly apiKey: string; readonly from: string }
  | { readonly kind: 'log' };

/** Configuration typée de l'application, lue une fois au démarrage (`validateEnv`). */
export class AppConfigService {
  constructor(private readonly env: ValidatedEnv) {}

  get deployment(): Deployment {
    const vercelEnv = this.env.VERCEL_ENV;
    if (vercelEnv === undefined) return 'local';
    return vercelEnv === 'production' ? 'production' : 'preview';
  }
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

  /** `null` : configuration incomplète hors production, stockage de fichiers désactivé (503). */
  get s3Settings(): S3Settings | null {
    const { S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY } = this.env;
    if (!S3_ENDPOINT || !S3_REGION || !S3_ACCESS_KEY || !S3_SECRET_KEY) {
      return null;
    }
    return {
      s3Endpoint: S3_ENDPOINT,
      s3Region: S3_REGION,
      s3AccessKey: S3_ACCESS_KEY,
      s3SecretKey: S3_SECRET_KEY,
    };
  }

  get mailTransport(): MailTransport {
    const { RESEND_API_KEY, MAIL_FROM } = this.env;
    if (this.deployment === 'preview' || !RESEND_API_KEY || !MAIL_FROM) {
      return { kind: 'log' };
    }
    return { kind: 'resend', apiKey: RESEND_API_KEY, from: MAIL_FROM };
  }

  get sentryRelease() {
    return this.env.SENTRY_RELEASE;
  }
  get sentryFrontendDsn() {
    return this.env.SENTRY_FRONTEND_DSN;
  }
}
