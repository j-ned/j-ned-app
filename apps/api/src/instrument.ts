// Premier import de main.ts : `.env` chargé, puis Sentry initialisé avant que `http` et les autres
// modules instrumentés ne soient chargés (sinon les requêtes entrantes ne sont pas tracées).
import 'dotenv/config';
import * as Sentry from '@sentry/node';
import {
  isUntracedIncomingRequest,
  sentryBeforeSend,
  sentryBeforeSendTransaction,
} from './common/sentry-before-send';

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
    ignoreErrors: ['ThrottlerException'],
    beforeSend: sentryBeforeSend,
    beforeSendTransaction: sentryBeforeSendTransaction,
    // v11 diffuse les spans par défaut (`stream`) et ignore alors `beforeSendTransaction` :
    // le cycle `static` garde les transactions entières, donc passées à ce hook.
    traceLifecycle: 'static',
  });
}
