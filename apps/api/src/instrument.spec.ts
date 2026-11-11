import { IncomingMessage } from 'node:http';
import { Socket } from 'node:net';
import type * as SentryModule from '@sentry/node';

// Un `.env` local ne doit pas fausser les variables posées par les tests.
jest.mock('node:fs', () => ({
  ...jest.requireActual<typeof import('node:fs')>('node:fs'),
  existsSync: () => false,
}));
jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  httpIntegration: jest.fn(() => ({ name: 'Http' })),
}));

describe('instrument', () => {
  const previousDsn = process.env.SENTRY_DSN;

  afterEach(() => {
    if (previousDsn === undefined) delete process.env.SENTRY_DSN;
    else process.env.SENTRY_DSN = previousDsn;
  });

  const loadInstrument = () => {
    process.env.SENTRY_DSN = 'https://public@o0.ingest.sentry.io/0';
    let sentry: typeof SentryModule | undefined;
    jest.isolateModules(() => {
      sentry = jest.requireMock<typeof SentryModule>('@sentry/node');
      jest.requireActual('./instrument');
    });
    if (!sentry) throw new Error('instrument non chargé');
    return { sentry };
  };

  it('Given Sentry initialisé, Then la sonde de santé n’est jamais tracée', () => {
    const { sentry } = loadInstrument();
    const options = jest.mocked(sentry.httpIntegration).mock.calls[0]?.[0];
    if (!options?.ignoreIncomingRequests) {
      throw new Error('ignoreIncomingRequests absent');
    }

    const request = new IncomingMessage(new Socket());

    expect(options.ignoreIncomingRequests('/api/health', request)).toBe(true);
  });
});
