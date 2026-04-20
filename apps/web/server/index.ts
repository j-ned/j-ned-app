import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { compress } from 'hono/compress';
import { env } from './lib/env.js';
import { errorHandler } from './lib/errors.js';
import { registerRoutes } from './routes';
import sitemap from './routes/sitemap.js';
import { startCronJobs } from './lib/cron.js';
import { runMigrations } from './lib/migrate.js';

const app = new Hono();

// Gzip compression pour toutes les réponses (API + static)
app.use('*', compress());

// Security headers (Traefik en amont gère HTTPS/HSTS, mais on double les headers applicatifs)
app.use(
  '*',
  secureHeaders({
    crossOriginResourcePolicy: 'cross-origin',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: [],
      payment: [],
      usb: [],
    },
  }),
);

// CORS — limité au domaine public
app.use(
  '*',
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Error handler
app.onError(errorHandler);

// Routes API sous /api/* + sitemap public
const api = new Hono();
registerRoutes(api);
api.route('/sitemap.xml', sitemap);
app.route('/api', api);

// Static Angular (prerendered HTML + assets) depuis le build
const STATIC_ROOT = './dist/angular-portfolio-app/browser';
app.use('*', serveStatic({ root: STATIC_ROOT }));

// SPA fallback : toute route non matchée sert l'index CSR
app.get('*', serveStatic({ path: `${STATIC_ROOT}/index.csr.html` }));

async function main(): Promise<void> {
  if (env.DATABASE_URL) {
    await runMigrations();
  } else {
    console.warn('DATABASE_URL missing — skipping migrations.');
  }

  startCronJobs();

  const port = env.PORT;
  console.log(`Server starting on port ${port}...`);
  serve({ fetch: app.fetch, port });
  console.log(`Server running on http://localhost:${port}`);
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
