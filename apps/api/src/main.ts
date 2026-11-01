import './instrument';
import 'reflect-metadata';
import { serve } from '@hono/node-server';
import { createTransport } from 'nodemailer';
import { createApp } from './app';
import { scheduleDailyRollup } from './analytics/analytics.schedule';
import { createRootLogger, rootLogger, setRootLogger } from './common/logger';
import { AppConfigService } from './config/app-config.service';
import { validateEnv } from './config/env.validation';
import { connectDatabase } from './database/database';
import { createS3Client } from './storage/s3-client';
import { createServices } from './services';

// Variables invalides ou manquantes : l'API s'arrête au démarrage avec un message lisible.
const config = new AppConfigService(validateEnv(process.env));
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
const rollup = scheduleDailyRollup(services.analyticsAggregator);

const server = serve({ fetch: app.fetch, port: config.port }, () => {
  rootLogger().info(
    { context: 'Bootstrap' },
    `Listening on http://localhost:${config.port}`,
  );
});

// Arrêt du conteneur (tini relaie SIGTERM) : plus de nouvelle requête, celles en cours se terminent,
// puis tâche planifiée, pool Postgres, SMTP et S3 sont fermés.
let stopping = false;
function shutdown(signal: string): void {
  if (stopping) return;
  stopping = true;
  rootLogger().info({ context: 'Bootstrap' }, `${signal}: shutting down`);
  rollup.stop();
  server.close(() => {
    transporter.close();
    s3.destroy();
    void database.close().finally(() => process.exit(0));
  });
}
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
