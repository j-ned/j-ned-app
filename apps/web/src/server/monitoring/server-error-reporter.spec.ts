// @vitest-environment node
/// <reference types="node" />
import { createServer, get, type Server } from 'node:http';
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
  readonly sentItemTypes: () => string[];
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
  const sentItemTypes = (): string[] =>
    envelopes.flatMap(([, items]) => items.map(([header]) => header.type));
  return { factory, sentEvents, sentItemTypes };
}

type ProcessHook = 'unhandledRejection' | 'uncaughtException';
const PROCESS_HOOKS: readonly ProcessHook[] = ['unhandledRejection', 'uncaughtException'];

// `Sentry.init` pose ses écouteurs sur `process` : ceux de chaque test sont retirés après lui.
function addedListeners<E extends ProcessHook>(
  hook: E,
  before: readonly unknown[],
): ReturnType<typeof process.listeners<E>> {
  return process.listeners(hook).filter((listener) => !before.includes(listener));
}

function removeAddedListeners<E extends ProcessHook>(hook: E, before: readonly unknown[]): void {
  for (const listener of addedListeners(hook, before)) process.removeListener(hook, listener);
}

async function serveOnce(): Promise<void> {
  const server: Server = createServer((_req, res) => res.end('ok'));
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (typeof address !== 'object' || address === null) throw new Error('server not listening');
  const { port } = address;
  await new Promise<void>((resolve) =>
    get(`http://127.0.0.1:${port}/healthz`, (res) => res.resume().on('end', resolve)),
  );
  await new Promise<void>((resolve) => server.close(() => resolve()));
}

describe('createServerErrorReporter', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;
  let listenersBefore: Readonly<Record<ProcessHook, readonly unknown[]>>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    // Isolé de l'environnement ambiant : la CI pose `GITHUB_SHA`, le SDK en ferait une release.
    vi.stubEnv('SENTRY_RELEASE', undefined);
    vi.stubEnv('GITHUB_SHA', undefined);
    listenersBefore = {
      unhandledRejection: process.listeners('unhandledRejection'),
      uncaughtException: process.listeners('uncaughtException'),
    };
  });

  afterEach(() => {
    for (const hook of PROCESS_HOOKS) removeAddedListeners(hook, listenersBefore[hook]);
    vi.unstubAllEnvs();
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
    vi.stubEnv('GITHUB_SHA', 'deadbeefcafe');
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

  it('given an error carrying the raw request URL, when reported, then its container log line does not travel as a breadcrumb', async () => {
    const transport = recordingTransport();
    const reporter = createServerErrorReporter(PRODUCTION_ENV, { transport: transport.factory });
    const invalidUrl = Object.assign(new TypeError('Invalid URL'), {
      input: '//[?token=secret&email=a@b.c',
    });

    reporter.report(invalidUrl, { message: 'SSR render failed:' });
    await reporter.flush();

    const [event] = transport.sentEvents();
    expect(event).not.toEqual(
      expect.objectContaining({
        breadcrumbs: expect.arrayContaining([expect.objectContaining({ category: 'console' })]),
      }),
    );
  });

  it('given a DSN and an undefined release, when a render error is reported, then no release is detected from the CI commit', async () => {
    vi.stubEnv('GITHUB_SHA', 'deadbeefcafe');
    const transport = recordingTransport();
    const reporter = createServerErrorReporter(
      { ...PRODUCTION_ENV, SENTRY_RELEASE: undefined },
      { transport: transport.factory },
    );

    reporter.report(new Error('render failed'), { message: 'SSR render failed:' });
    await reporter.flush();

    const [event] = transport.sentEvents();
    expect(event).not.toHaveProperty('release');
  });

  it('given a DSN, when a request is served (health probe included), then no request session is sent', async () => {
    const transport = recordingTransport();
    const reporter = createServerErrorReporter(PRODUCTION_ENV, { transport: transport.factory });

    await serveOnce();
    await reporter.flush();

    expect(transport.sentItemTypes()).not.toContain('sessions');
  });

  it('given a DSN, when a promise rejection is left unhandled, then it is sent as fatal and Node exits with 1', async () => {
    const transport = recordingTransport();
    const exit = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => undefined) as typeof process.exit);
    const reporter = createServerErrorReporter(PRODUCTION_ENV, { transport: transport.factory });
    const [onRejection] = addedListeners('unhandledRejection', listenersBefore.unhandledRejection);

    onRejection?.(new Error('forgotten await'), Promise.resolve());
    await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(1));
    await reporter.flush();
    exit.mockRestore();

    expect(transport.sentEvents()).toEqual([
      expect.objectContaining({
        level: 'fatal',
        exception: { values: [expect.objectContaining({ value: 'forgotten await' })] },
      }),
    ]);
  });
});
