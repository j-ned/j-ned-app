// @vitest-environment node
import { setUser, type NodeOptions } from '@sentry/node';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { createServerErrorReporter, type ServerMonitoringEnv } from './server-error-reporter';

type Transport = ReturnType<NonNullable<NodeOptions['transport']>>;
type Envelope = Parameters<Transport['send']>[0];

const DSN = 'https://public@o0.ingest.sentry.io/1';

const PRODUCTION_ENV: ServerMonitoringEnv = {
  SENTRY_SSR_DSN: DSN,
  SENTRY_RELEASE: 'sha-0123abc',
  NODE_ENV: 'production',
};

type RecordingTransport = {
  readonly factory: Mock<NonNullable<NodeOptions['transport']>>;
  readonly sentEvents: () => unknown[];
};

// Transport doublé : les enveloppes restent en mémoire, rien ne part sur le réseau.
function recordingTransport(): RecordingTransport {
  const envelopes: Envelope[] = [];
  const factory = vi.fn<NonNullable<NodeOptions['transport']>>(() => ({
    send: (envelope): Promise<object> => {
      envelopes.push(envelope);
      return Promise.resolve({});
    },
    flush: (): Promise<boolean> => Promise.resolve(true),
  }));
  const sentEvents = (): unknown[] =>
    envelopes.flatMap(([, items]) =>
      items.filter(([header]) => header.type === 'event').map(([, payload]) => payload),
    );
  return { factory, sentEvents };
}

describe('createServerErrorReporter', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('given no DSN, when a render error is reported, then it is only written to the container log', async () => {
    const transport = recordingTransport();
    const reporter = createServerErrorReporter(
      { SENTRY_SSR_DSN: undefined, SENTRY_RELEASE: 'sha-0123abc', NODE_ENV: 'production' },
      { transport: transport.factory },
    );
    const error = new Error('render failed');

    reporter.report(error, { message: 'SSR render failed:' });
    await reporter.flush();

    expect(consoleError).toHaveBeenCalledWith('SSR render failed:', error);
    expect(transport.factory).not.toHaveBeenCalled();
  });

  it('given an empty DSN, when a render error is reported, then nothing is sent', async () => {
    const transport = recordingTransport();
    const reporter = createServerErrorReporter(
      { ...PRODUCTION_ENV, SENTRY_SSR_DSN: '' },
      { transport: transport.factory },
    );

    reporter.report(new Error('render failed'), { message: 'SSR render failed:' });
    await reporter.flush();

    expect(transport.factory).not.toHaveBeenCalled();
  });

  it('given a DSN, when a render error is reported, then it is logged and sent under the site release and environment', async () => {
    const transport = recordingTransport();
    const reporter = createServerErrorReporter(PRODUCTION_ENV, { transport: transport.factory });
    const error = new Error('render failed');

    reporter.report(error, { message: 'SSR render failed:' });
    await reporter.flush();

    expect(consoleError).toHaveBeenCalledWith('SSR render failed:', error);
    expect(transport.sentEvents()).toEqual([
      expect.objectContaining({
        release: 'sha-0123abc',
        environment: 'production',
        exception: {
          values: [expect.objectContaining({ type: 'Error', value: 'render failed' })],
        },
      }),
    ]);
  });

  it('given a DSN and no release, when a render error is reported, then the event carries no release', async () => {
    const transport = recordingTransport();
    const reporter = createServerErrorReporter(
      { ...PRODUCTION_ENV, SENTRY_RELEASE: '' },
      { transport: transport.factory },
    );

    reporter.report(new Error('render failed'), { message: 'SSR render failed:' });
    await reporter.flush();

    const [event] = transport.sentEvents();
    expect(event).not.toHaveProperty('release');
  });

  it('given a request with a query string and a visitor IP on the scope, when reported, then the event keeps the path only and no IP', async () => {
    const transport = recordingTransport();
    const reporter = createServerErrorReporter(PRODUCTION_ENV, { transport: transport.factory });
    setUser({ ip_address: '203.0.113.7' });

    reporter.report(new Error('render failed'), {
      message: 'SSR render failed:',
      request: { method: 'GET', url: '/blog/article?token=secret#frag' },
    });
    await reporter.flush();
    setUser(null);

    const [event] = transport.sentEvents();
    expect(event).toHaveProperty('request', { method: 'GET', url: '/blog/article' });
    expect(event).not.toHaveProperty('user.ip_address');
  });
});
