import { z } from 'zod';

// Variables d'environnement : chargées via `node --env-file-if-exists=.env`
// (dev) ou injectées par Docker Swarm/Dokploy (prod). Pas de dotenv au runtime.
const envSchema = z.object({
  // Server
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:4200'),

  // Database
  DATABASE_URL: z.string(),

  // JWT
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),

  // 2FA
  TOTP_APP_NAME: z.string().default('Portfolio'),

  // S3
  S3_ENDPOINT: z.string(),
  S3_REGION: z.string().default('garage'),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  S3_CV_BUCKET: z.string(),
  S3_PROJECTS_BUCKET: z.string(),
  S3_BLOG_BUCKET: z.string(),
  S3_ABOUT_BUCKET: z.string(),

  // SMTP
  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  SMTP_FROM: z.string(),

  // Contact Info
  CONTACT_EMAIL: z.string(),
  CONTACT_PHONE: z.string(),
  CONTACT_LOCATION: z.string(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

// Derived S3 public URLs
export const s3PublicUrl = (bucket: string): string => `${env.S3_ENDPOINT}/${bucket}`;
