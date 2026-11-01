import { z } from 'zod';

export const envSchema = z.object({
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
   * Prod: `https://nedellec-julien.fr` (le domaine `www` redirige vers l'apex côté Traefik, il n'a plus besoin d'être listé ici).
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

  // S3 Storage
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().min(1),
  S3_ACCESS_KEY: z.string().min(4),
  S3_SECRET_KEY: z.string().min(8),

  // Mailer (SMTP)
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_SECURE: z
    .string()
    .default('false')
    .transform((v) => v === 'true' || v === '1'),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  SMTP_FROM: z.string().email(),

  // Observability (Sentry) - all optional, empty DSN keeps Sentry disabled
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_RELEASE: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).optional(),
  // Browser DSN exposed via GET /api/config (separate Sentry project from backend).
  // Public by design (ships in the browser bundle once fetched).
  SENTRY_FRONTEND_DSN: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;
