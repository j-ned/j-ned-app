import type { ApplicationRef } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { Monitoring } from './app/core/monitoring/monitoring';
import { scrubBreadcrumb, scrubEvent } from './app/core/monitoring/scrub-event';

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
    // Un champ omis vaut « tout collecter » depuis la v11 : chaque catégorie est fermée explicitement.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: { request: { allow: ['User-Agent'] }, response: false },
      httpBodies: [],
      urlQueryParams: false,
      graphQL: { document: false, variables: false },
      genAI: { inputs: false, outputs: false },
      databaseQueryData: false,
      queues: false,
      stackFrameVariables: false,
    },
    integrations: [
      sentry.browserTracingIntegration({
        enableLongAnimationFrame: true,
      }),
      sentry.httpClientIntegration({
        failedRequestStatusCodes: [[500, 599]],
      }),
    ],
    tracesSampleRate: isProduction ? 0.1 : 1.0,
    tracePropagationTargets: [/^\//, /^https:\/\/api\.nedellec-julien\.fr/],
    ignoreErrors: ['ChunkLoadError', /ResizeObserver loop/, 'NG0911'],
    beforeSend: scrubEvent,
    beforeBreadcrumb: scrubBreadcrumb,
  });

  // Un échec du bootstrap est déjà journalisé par son propre catch : rien à rattacher.
  const ref = await appRef.catch(() => null);
  if (!ref) return;
  ref.injector.get(Monitoring).attach(sentry, ref.injector.get(Router));
}

const appRef = bootstrapApplication(App, appConfig);
appRef.catch((err) => console.error(err));
initSentryFromBackend(appRef).catch((err: unknown) => console.warn('Sentry indisponible', err));
