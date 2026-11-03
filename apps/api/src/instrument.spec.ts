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

  it('Given Sentry initialisé, Then une transaction du flux d’agenda est écartée avant envoi', () => {
    const { sentry } = loadInstrument();
    const hook = jest.mocked(sentry.init).mock.calls[0]?.[0]
      ?.beforeSendTransaction;
    if (!hook) throw new Error('beforeSendTransaction absent');

    expect(
      hook(
        {
          type: 'transaction',
          transaction: 'GET /api/booking/feed/:file',
          request: {
            url: 'https://api.nedellec-julien.fr/api/booking/feed/XYJXH9MoGdppkZYT0jI3g2rP-qFcqKBWL0budyMj488.ics',
          },
        },
        {},
      ),
    ).toBeNull();
  });
});
