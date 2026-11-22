import * as z from 'zod';
import { durationMs } from '../common/duration';
import { APP_ENVS, resolveDeployment } from './deployment';

// Facultatives hors production : sans elles, les mails sont journalisés et le stockage répond 503.
const REQUIRED_IN_PRODUCTION = [
  'S3_ENDPOINT',
  'S3_REGION',
  'S3_ACCESS_KEY',
  'S3_SECRET_KEY',
  'RESEND_API_KEY',
  'MAIL_FROM',
] as const;

const SESSION_MIN_MS = 5 * 60_000;
const SESSION_MAX_MS = 30 * 86_400_000;

function isSessionDuration(value: string): boolean {
  const ms = durationMs(value);
  return ms !== undefined && ms >= SESSION_MIN_MS && ms <= SESSION_MAX_MS;
}

const baseEnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z
    .string()
    .url()
    .refine(
      (u) => u.startsWith('postgres://') || u.startsWith('postgresql://'),
      { message: 'DATABASE_URL must be a postgres:// URL' },
    ),
  // `production` rend obligatoires mail et stockage ; `preview`, environnement de démonstration,
  // n'envoie aucun mail. Absente : exécution locale.
  APP_ENV: z.enum(APP_ENVS).optional(),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .optional(),

  // Auth
  JWT_SECRET: z
    .string()
    .min(32, { message: 'JWT_SECRET must be at least 32 characters' }),
  JWT_EXPIRES_IN: z.string().default('24h').refine(isSessionDuration, {
    message:
      'JWT_EXPIRES_IN must be a duration between 5m and 30d, written <number><ms|s|m|h|d> (e.g. 24h)',
  }),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_INITIAL_PASSWORD: z
    .string()
    .min(12, {
      message:
        'ADMIN_INITIAL_PASSWORD must be at least 12 characters when provided',
    })
    .optional(),
  TOTP_APP_NAME: z.string().default('J-Ned Portfolio'),

  // Origines du site (virgules) : CORS, CSRF tant que le site appelle l'API sur son sous-domaine, et
  // référents internes de l'audience. Prod : l'apex seul (`www` y redirige chez Cloudflare).
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:4200')
    .transform((v) =>
      v
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),

  // Sans lui, la route `/api/cron/daily` n'existe pas.
  CRON_SECRET: z.string().min(16).optional(),
  // Seul un appel qui porte ce secret fait croire l'IP du visiteur qu'il transmet (quotas par
  // visiteur). Sans lui, l'en-tête est ignoré.
  SSR_FORWARD_SECRET: z.string().min(32).optional(),

  // S3 Storage : obligatoire en production (REQUIRED_IN_PRODUCTION)
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().min(1).optional(),
  S3_ACCESS_KEY: z.string().min(4).optional(),
  S3_SECRET_KEY: z.string().min(8).optional(),

  // Mailer (Resend) - MAIL_FROM sur un domaine vérifié dans Resend ; obligatoire en production
  RESEND_API_KEY: z.string().min(1).optional(),
  MAIL_FROM: z.string().email().optional(),

  // Observability (Sentry) - all optional, empty DSN keeps Sentry disabled
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_RELEASE: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).optional(),
  // Browser DSN exposed via GET /api/config (separate Sentry project from backend).
  // Public by design (ships in the browser bundle once fetched).
  SENTRY_FRONTEND_DSN: z.string().url().optional(),
});

export const envSchema = baseEnvSchema.superRefine((env, ctx) => {
  if (resolveDeployment(env) !== 'production') return;
  for (const name of REQUIRED_IN_PRODUCTION) {
    if (env[name] === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: [name],
        message: 'required in production',
      });
    }
  }
});
