import { bootstrapApplication } from '@angular/platform-browser';
import {
  init as sentryInit,
  browserTracingIntegration,
  httpClientIntegration,
} from '@sentry/angular';
import { appConfig } from './app/app.config';
import { App } from './app/app';

type RuntimeConfig = {
  sentry: {
    dsn: string;
    environment: string;
    release: string;
  };
};

const PROD_API_BASE = 'https://api.nedellec-julien.fr/api';

function apiBase(): string {
  const host = location.hostname;
  return host === 'localhost' || host === '127.0.0.1'
    ? '/api'
    : PROD_API_BASE;
}

async function initSentryFromBackend(): Promise<void> {
  let config: RuntimeConfig;
  try {
    const res = await fetch(`${apiBase()}/config`, { credentials: 'omit' });
    if (!res.ok) return;
    config = (await res.json()) as RuntimeConfig;
  } catch {
    return;
  }

  const { dsn, environment, release } = config.sentry;
  if (!dsn) return;

  const isProduction = environment === 'production';

  sentryInit({
    dsn,
    environment,
    release,
    sendDefaultPii: false,
    integrations: [
      browserTracingIntegration({
        enableInp: true,
        enableLongAnimationFrame: true,
      }),
      httpClientIntegration({
        failedRequestStatusCodes: [[500, 599]],
      }),
    ],
    tracesSampleRate: isProduction ? 0.1 : 1.0,
    tracePropagationTargets: [/^\//, /^https:\/\/api\.nedellec-julien\.fr/],
    ignoreErrors: ['ChunkLoadError', /ResizeObserver loop/, 'NG0911'],
    beforeSend(event) {
      const data = event.request?.data as Record<string, unknown> | undefined;
      if (data) {
        for (const key of [
          'password',
          'newPassword',
          'currentPassword',
          'code',
          'token',
          'email',
        ]) {
          if (key in data) data[key] = '[Filtered]';
        }
      }
      if (event.request?.cookies) delete event.request.cookies;
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      return event;
    },
  });
}

void initSentryFromBackend();

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
