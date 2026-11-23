import * as Sentry from '@sentry/node';
import { scrubEvent } from '@core/monitoring/scrub-event';

export type ServerMonitoringEnv = Readonly<
  Record<'SENTRY_SSR_DSN' | 'SENTRY_RELEASE' | 'NODE_ENV', string | undefined>
>;

export type ServerErrorReport = {
  readonly message: string;
  readonly request?: { readonly method: string | undefined; readonly url: string | undefined };
};

export type ServerErrorReporter = {
  readonly report: (error: unknown, report: ServerErrorReport) => void;
  readonly flush: () => Promise<void>;
};

type ServerErrorReporterOptions = { readonly transport?: Sentry.NodeOptions['transport'] };

// Délai laissé à l'envoi des erreurs en attente quand le conteneur s'arrête.
const FLUSH_TIMEOUT_MS = 2_000;

const logToContainer = (error: unknown, { message }: ServerErrorReport): void =>
  console.error(message, error);

// Sans DSN, le journal du conteneur reste la seule trace : rien n'est initialisé ni envoyé.
export function createServerErrorReporter(
  env: ServerMonitoringEnv,
  { transport }: ServerErrorReporterOptions = {},
): ServerErrorReporter {
  const dsn = env.SENTRY_SSR_DSN;
  if (!dsn) return { report: logToContainer, flush: () => Promise.resolve() };

  Sentry.init({
    dsn,
    environment: env.NODE_ENV ?? 'development',
    ...(env.SENTRY_RELEASE && { release: env.SENTRY_RELEASE }),
    ...(transport && { transport }),
    // Sentry v11 collecte tout par défaut : chaque catégorie est fermée explicitement, comme l'API.
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
    // Sans fil d'Ariane console : la ligne du journal porterait l'erreur brute (URL demandée complète).
    // Rejet non géré : le SDK ne fait qu'avertir par défaut, `strict` garde l'arrêt de Node.
    integrations: (defaults) => [
      ...defaults.filter(({ name }) => name !== 'Console'),
      Sentry.onUnhandledRejectionIntegration({ mode: 'strict' }),
    ],
    beforeSend: scrubEvent,
  });

  return {
    report: (error, report): void => {
      logToContainer(error, report);
      const { request } = report;
      Sentry.withScope((scope) => {
        if (request) {
          scope.addEventProcessor((event) => ({
            ...event,
            request: {
              ...event.request,
              ...(request.method !== undefined && { method: request.method }),
              ...(request.url !== undefined && { url: request.url }),
            },
          }));
        }
        Sentry.captureException(error);
      });
    },
    flush: async (): Promise<void> => {
      await Sentry.close(FLUSH_TIMEOUT_MS);
    },
  };
}
