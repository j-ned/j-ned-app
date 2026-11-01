import { createTransport } from 'nodemailer';
import { createApp } from './create-app';
import { createRootLogger, setRootLogger } from './common/logger';
import { AppConfigService } from './config/app-config.service';
import { validateEnv } from './config/env.validation';
import { connectDatabase } from './database/database';
import { createS3Client } from './storage/s3-client';
import { createServices } from './services';

/**
 * Assemble l'API depuis l'environnement : configuration validée (arrêt lisible si une variable manque),
 * logger, connexions (Postgres, S3, SMTP), services et application Hono. Partagé par le serveur Node
 * (`main.ts`) et la fonction Vercel (`index.ts`).
 */
export function bootstrap(env: Record<string, unknown> = process.env) {
  const config = new AppConfigService(validateEnv(env));
  setRootLogger(
    createRootLogger({ level: config.logLevel, pretty: config.isDevelopment }),
  );

  const database = connectDatabase(config);
  const s3 = createS3Client(config);
  const transporter = createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: { user: config.smtpUser, pass: config.smtpPass },
  });
  const services = createServices({ config, db: database.db, s3, transporter });
  const app = createApp(config, database.db, services);
  return { config, database, s3, transporter, services, app };
}
