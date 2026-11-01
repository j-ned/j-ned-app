import * as Sentry from '@sentry/node';
import pino from 'pino';
import {
  LOG_REDACT_PATHS,
  redactLogArguments,
  serializeError,
  serializeRequest,
} from './log-redact';

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

export type LoggerOptions = {
  readonly level: LogLevel | 'silent';
  readonly pretty: boolean;
};

/**
 * Logger racine : JSON structuré (pretty en développement), données sensibles masquées
 * (`LOG_REDACT_PATHS`, sérialiseurs). Tout log `error` qui ne porte pas déjà une exception (`err`,
 * capturée par le gestionnaire d'erreurs) part aussi à Sentry en message.
 */
export function createRootLogger({
  level,
  pretty,
}: LoggerOptions): pino.Logger {
  return pino({
    level,
    redact: [...LOG_REDACT_PATHS],
    serializers: { req: serializeRequest, err: serializeError },
    transport: pretty
      ? {
          target: 'pino-pretty',
          options: { singleLine: true, colorize: true },
        }
      : undefined,
    hooks: {
      logMethod(rawArgs, method, logLevel) {
        const args = redactLogArguments(rawArgs) as typeof rawArgs;
        if (logLevel >= 50) {
          const [first, second] = args as [unknown, string?];
          const ctx =
            typeof first === 'object' && first !== null
              ? (first as Record<string, unknown>)
              : undefined;
          if (!(ctx !== undefined && 'err' in ctx)) {
            Sentry.captureMessage(
              typeof first === 'string' ? first : (second ?? 'pino-log'),
              { level: 'error', extra: ctx ? { context: ctx } : undefined },
            );
          }
        }
        method.apply(this, args);
      },
    },
  });
}

// Silencieux tant que `main.ts` n'a pas posé le logger configuré (tests, scripts).
let root: pino.Logger = pino({ level: 'silent' });

export function setRootLogger(logger: pino.Logger): void {
  root = logger;
}

export function rootLogger(): pino.Logger {
  return root;
}

/**
 * Logger nommé (`context`), même usage que celui de NestJS : `log`/`warn`/`error`/`debug` acceptent
 * un message, ou un objet de contexte puis un message ; `error(message, stack)` garde la pile.
 */
export class Logger {
  constructor(private readonly context: string) {}

  log(first: unknown, message?: string): void {
    this.write('info', first, message);
  }

  warn(first: unknown, message?: string): void {
    this.write('warn', first, message);
  }

  error(first: unknown, messageOrStack?: string): void {
    if (typeof first === 'string' && messageOrStack !== undefined) {
      root.error({ context: this.context, stack: messageOrStack }, first);
      return;
    }
    this.write('error', first, messageOrStack);
  }

  debug(first: unknown, message?: string): void {
    this.write('debug', first, message);
  }

  private write(
    level: 'info' | 'warn' | 'error' | 'debug',
    first: unknown,
    message?: string,
  ): void {
    if (typeof first === 'object' && first !== null) {
      root[level]({ context: this.context, ...first }, message);
    } else {
      root[level]({ context: this.context }, String(first));
    }
  }
}
