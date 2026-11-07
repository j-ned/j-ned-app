import * as z from 'zod';

/**
 * Variables sans lesquelles la production ne démarre pas, facultatives ailleurs : hors production,
 * sans elles, les mails sont journalisés et le stockage de fichiers répond 503.
 */
const REQUIRED_IN_PRODUCTION = [
  'S3_ENDPOINT',
  'S3_REGION',
  'S3_ACCESS_KEY',
  'S3_SECRET_KEY',
  'RESEND_API_KEY',
  'MAIL_FROM',
] as const;

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
  /**
   * Posé par Vercel lui-même (`production`, `preview`, `development` sous `vercel dev`), absent
   * ailleurs. Seule source de la distinction production / preview : `NODE_ENV` peut valoir
   * `production` sur une preview.
   */
  VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .optional(),

  // Auth
  JWT_SECRET: z
    .string()
    .min(32, { message: 'JWT_SECRET must be at least 32 characters' }),
  JWT_EXPIRES_IN: z.string().default('7d'),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_INITIAL_PASSWORD: z
    .string()
    .min(12, {
      message:
        'ADMIN_INITIAL_PASSWORD must be at least 12 characters when provided',
    })
    .optional(),
  TOTP_APP_NAME: z.string().default('J-Ned Portfolio'),

  /**
   * Origines du site, séparées par des virgules : autorisées par CORS (requêtes credentials) et
   * par la protection CSRF (`CrossOriginGuard`) tant que le site appelle l'API sur son sous-domaine,
   * et reconnues comme référents internes par la mesure d'audience.
   * Prod: `https://nedellec-julien.fr` (le domaine `www` redirige en 308 vers l'apex côté Vercel, il n'a pas besoin d'être listé ici).
   * Dev local: `http://localhost:4200` (défaut).
   */
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:4200')
    .transform((v) =>
      v
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),

  /**
   * Secret du cron Vercel (en-tête `Authorization: Bearer …` posé par Vercel) : sans lui, la route
   * `/api/cron/daily` n'existe pas.
   */
  CRON_SECRET: z.string().min(16).optional(),
  /**
   * Secret partagé avec le rendu serveur du site : seul un appel qui le porte fait croire l'IP du visiteur
   * qu'il transmet (quotas par visiteur, ADR-0036). Sans lui, l'en-tête est ignoré.
   */
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
  if (env.VERCEL_ENV !== 'production') return;
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

export type Env = z.infer<typeof envSchema>;
