// Premier import de main.ts : `.env` local chargé, puis Sentry initialisé avant que `http` et les autres
// modules instrumentés ne soient chargés (sinon les requêtes entrantes ne sont pas tracées).
import { existsSync } from 'node:fs';
import * as Sentry from '@sentry/node';
import {
  isUntracedIncomingRequest,
  sentryBeforeSend,
} from './common/sentry-before-send';

// `.env` local facultatif (absent du conteneur), lu par Node sans dépendance.
if (existsSync('.env')) process.loadEnvFile();

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  const isProduction = process.env.NODE_ENV === 'production';

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    release: process.env.SENTRY_RELEASE,
    // Sentry v11 collecte tout par défaut : chaque catégorie est fermée explicitement.
    // `frameContextLines` (lignes de notre propre code autour de chaque frame) garde son défaut.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: { request: { allow: ['user-agent'] }, response: false },
      httpBodies: [],
      urlQueryParams: false,
      graphQL: { document: false, variables: false },
      genAI: { inputs: false, outputs: false },
      databaseQueryData: false,
      queues: false,
      stackFrameVariables: false,
    },
    integrations: [
      Sentry.httpIntegration({
        ignoreIncomingRequests: isUntracedIncomingRequest,
      }),
    ],
    tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
      ? Number(process.env.SENTRY_TRACES_SAMPLE_RATE)
      : isProduction
        ? 0.2
        : 1.0,
    beforeSend: sentryBeforeSend,
    // v11 diffuse les spans par défaut (`stream`) : le cycle `static` garde des transactions entières.
    traceLifecycle: 'static',
  });
}
