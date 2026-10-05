import type { ApplicationRef } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { Monitoring } from './app/core/monitoring/monitoring';

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
  return host === 'localhost' || host === '127.0.0.1' ? '/api' : PROD_API_BASE;
}

async function initSentryFromBackend(appRef: Promise<ApplicationRef>): Promise<void> {
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
  const sentry = await import('@sentry/angular');

  sentry.init({
    dsn,
    environment,
    release,
    sendDefaultPii: false,
    integrations: [
      sentry.browserTracingIntegration({
        enableInp: true,
        enableLongAnimationFrame: true,
      }),
      sentry.httpClientIntegration({
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

  // Un échec du bootstrap est déjà journalisé par son propre catch : rien à rattacher.
  const ref = await appRef.catch(() => null);
  if (!ref) return;
  ref.injector.get(Monitoring).attach(sentry, ref.injector.get(Router));
}

const appRef = bootstrapApplication(App, appConfig);
appRef.catch((err) => console.error(err));
initSentryFromBackend(appRef).catch((err: unknown) => console.warn('Sentry indisponible', err));
