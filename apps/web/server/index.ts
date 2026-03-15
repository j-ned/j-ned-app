import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { env } from './lib/env.js';
import { errorHandler } from './lib/errors.js';
import { registerRoutes } from './routes';
import { startCronJobs } from './lib/cron.js';

const app = new Hono();

// Security headers
app.use('*', secureHeaders({
  crossOriginResourcePolicy: 'cross-origin',
}));

// CORS
app.use('*', cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Error handler
app.onError(errorHandler);

// Health check
app.get('/', (c) => c.text('Hono.js Portfolio API'));

// Register all routes under /api prefix
const api = new Hono();
registerRoutes(api);
app.route('/api', api);

// Start cron jobs
startCronJobs();

// Start server
const port = env.PORT;
console.log(`Server starting on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`Server running on http://localhost:${port}`);
