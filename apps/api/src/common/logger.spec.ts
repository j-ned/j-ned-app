import * as Sentry from '@sentry/node';
import pino, { type LoggerOptions } from 'pino';
import { createRootLogger } from './logger';

jest.mock('@sentry/node', () => ({ captureMessage: jest.fn() }));
// Le vrai pino, mais sans écrire sur stdout ni démarrer le worker de `pino-pretty`.
jest.mock('pino', () => {
  const actual = jest.requireActual<typeof import('pino')>('pino');
  return {
    __esModule: true,
    default: Object.assign(
      jest.fn((options: LoggerOptions) =>
        options.transport
          ? actual.pino({ level: 'silent' })
          : actual.pino(options, { write: () => undefined }),
      ),
      { stdSerializers: actual.stdSerializers },
    ),
  };
});

describe('createRootLogger', () => {
  const lastPinoOptions = () => {
    const options = jest.mocked(pino).mock.calls.at(-1)?.[0];
    if (options === undefined) throw new Error('pino non appelé');
    return options;
  };

  beforeEach(() => jest.clearAllMocks());

  it('Given pretty désactivé, Then aucun transport n’est demandé à pino', () => {
    createRootLogger({ level: 'info', pretty: false });

    expect(lastPinoOptions()).toHaveProperty('level', 'info');
    expect(lastPinoOptions()).not.toHaveProperty('transport.target');
  });

  it('Given pretty activé, Then pino reçoit le transport pino-pretty', () => {
    createRootLogger({ level: 'info', pretty: true });

    expect(lastPinoOptions()).toHaveProperty('transport', {
      target: 'pino-pretty',
      options: { singleLine: true, colorize: true },
    });
  });

  describe('logs error et Sentry', () => {
    const logger = () => createRootLogger({ level: 'info', pretty: false });

    it('Given un message seul, Then il part à Sentry sans contexte', () => {
      logger().error('boom');

      expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
      expect(Sentry.captureMessage).toHaveBeenCalledWith('boom', {
        level: 'error',
      });
    });

    it('Given un objet de contexte, Then il part à Sentry dans `extra.context`', () => {
      logger().error({ jobId: 'j-1' }, 'job failed');

      expect(Sentry.captureMessage).toHaveBeenCalledWith('job failed', {
        level: 'error',
        extra: { context: { jobId: 'j-1' } },
      });
    });

    it('Given un log qui porte déjà `err`, Then rien ne part en message', () => {
      logger().error({ err: new Error('boom') }, 'handled');

      expect(Sentry.captureMessage).not.toHaveBeenCalled();
    });

    it('Given un log sous le niveau error, Then rien ne part à Sentry', () => {
      logger().warn('attention');

      expect(Sentry.captureMessage).not.toHaveBeenCalled();
    });
  });
});
