import { createApp } from './create-app';
import { createRootLogger, setRootLogger } from './common/logger';
import { AppConfigService } from './config/app-config.service';
import { validateEnv } from './config/env.validation';
import { connectDatabase } from './database/database';
import { createS3Client } from './storage/s3-client';
import { createServices } from './services';

/**
 * Assemble l'API depuis l'environnement : configuration validée (arrêt lisible si une variable manque),
 * logger, connexions (Postgres, S3), services et application Hono.
 */
export function bootstrap(env: Record<string, unknown> = process.env) {
  const config = new AppConfigService(validateEnv(env));
  setRootLogger(
    createRootLogger({ level: config.logLevel, pretty: config.isDevelopment }),
  );

  const database = connectDatabase(config);
  // `null` hors production sans configuration S3 complète : stockage de fichiers en 503.
  const s3Settings = config.s3Settings;
  const s3 = s3Settings ? createS3Client(s3Settings) : null;
  const services = createServices({ config, db: database.db, s3 });

  const app = createApp(config, database.db, services);
  return { config, database, s3, services, app };
}
