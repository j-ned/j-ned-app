import './instrument';
import 'reflect-metadata';
import { serve } from '@hono/node-server';
import { scheduleDailyRollup } from './analytics/analytics.schedule';
import { bootstrap } from './bootstrap';
import { rootLogger } from './common/logger';

const { config, database, s3, services, app } = bootstrap();
const rollup = scheduleDailyRollup(services.analyticsAggregator);

const server = serve({ fetch: app.fetch, port: config.port }, () => {
  rootLogger().info(
    { context: 'Bootstrap' },
    `Listening on http://localhost:${config.port}`,
  );
});

// Arrêt du conteneur (tini relaie SIGTERM) : plus de nouvelle requête, celles en cours se terminent,
// puis tâche planifiée, pool Postgres et S3 sont fermés.
let stopping = false;
function shutdown(signal: string): void {
  if (stopping) return;
  stopping = true;
  rootLogger().info({ context: 'Bootstrap' }, `${signal}: shutting down`);
  rollup.stop();
  server.close(() => {
    s3.destroy();
    void database.close().finally(() => process.exit(0));
  });
}
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
