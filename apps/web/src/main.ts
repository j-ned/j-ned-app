import type { ApplicationRef } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { Monitoring } from './app/core/monitoring/monitoring';
import { toBrowserSentryConfig } from './app/core/monitoring/browser-sentry-config';
import { scrubBreadcrumb, scrubEvent, scrubSpan } from './app/core/monitoring/scrub-event';

// Release du site (`sha-<commit>`), fixée au build par `define` (angular.json, Dockerfile) ; vide hors image.
declare const APP_RELEASE: string;

// Même origine partout : relais `/api` de nginx en production, `proxy.conf.cjs` sous `ng serve`.
const API_BASE = '/api';

async function initSentryFromBackend(appRef: Promise<ApplicationRef>): Promise<void> {
  let raw: unknown;
  try {
    const res = await fetch(`${API_BASE}/config`, { credentials: 'omit' });
    if (!res.ok) return;
    raw = await res.json();
  } catch {
    return;
  }

  const config = toBrowserSentryConfig(raw, APP_RELEASE);
  if (!config) return;
  const { dsn, environment } = config;

  const isProduction = environment === 'production';
  const sentry = await import('./app/core/monitoring/sentry-sdk');

  sentry.init({
    dsn,
    environment,
    ...(config.release && { release: config.release }),
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
    tracePropagationTargets: [/^\//, /^https:\/\/nedellec-julien\.fr\/api\//],
    ignoreErrors: ['ChunkLoadError', /ResizeObserver loop/, 'NG0911'],
    beforeSend: scrubEvent,
    beforeBreadcrumb: scrubBreadcrumb,
    // En `traceLifecycle: 'stream'` (défaut v11), aucune transaction n'est émise : `beforeSendTransaction` serait ignoré.
    beforeSendSpan: scrubSpan,
  });

  // Un échec du bootstrap est déjà journalisé par son propre catch : rien à rattacher.
  const ref = await appRef.catch(() => null);
  if (!ref) return;
  ref.injector.get(Monitoring).attach(sentry, ref.injector.get(Router));
}

// Délai maximal avant le démarrage du suivi si le navigateur ne devient jamais inactif.
const IDLE_TIMEOUT_MS = 4000;

// Le suivi attend l'application hydratée puis un moment d'inactivité : sa configuration et son SDK
// (~55 kB compressés) ne disputent plus le réseau ni le fil principal à l'hydratation et au LCP. Rien
// n'est perdu : `Monitoring` rejoue les erreurs survenues avant, et les métriques de chargement sont
// lues dans les entrées de performance déjà enregistrées.
async function whenBootstrappedAndIdle(appRef: Promise<ApplicationRef>): Promise<void> {
  await appRef.catch(() => null);
  await new Promise<void>((resolve) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => resolve(), { timeout: IDLE_TIMEOUT_MS });
    } else {
      setTimeout(resolve, 0);
    }
  });
}

const appRef = bootstrapApplication(App, appConfig);
appRef.catch((err) => console.error(err));
whenBootstrappedAndIdle(appRef)
  .then(() => initSentryFromBackend(appRef))
  .catch((err: unknown) => console.warn('Sentry indisponible', err));
