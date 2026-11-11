import * as Sentry from '@sentry/node';
import type { Context, ErrorHandler, NotFoundHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { STATUS_CODES } from 'node:http';
import { originalUrl } from './http';
import {
  HttpException,
  NotFoundException,
  type ErrorMessage,
} from './http-errors';
import { stripQueryAndFragment } from './log-redact';
import { Logger } from './logger';

type ErrorPayload = {
  statusCode: number;
  error: string;
  message: ErrorMessage;
  path: string;
  timestamp: string;
};

const logger = new Logger('HttpExceptionFilter');

function errorResponse(
  c: Context,
  status: number,
  message: ErrorMessage,
): Response {
  const payload: ErrorPayload = {
    statusCode: status,
    // Toujours l'intitulé HTTP du statut (« Unauthorized », « Too Many Requests »).
    error: STATUS_CODES[status] ?? 'Error',
    message,
    path: originalUrl(c),
    timestamp: new Date().toISOString(),
  };
  return c.json(payload, status as ContentfulStatusCode);
}

/**
 * Format JSON unique de toute erreur : les erreurs HTTP gardent leur statut et leur message ; toute
 * autre exception devient un 500 sans détail, journalisé (chemin sans query string) et envoyé à Sentry.
 */
export const handleError: ErrorHandler = (error, c) => {
  if (error instanceof HttpException) {
    return errorResponse(c, error.status, error.messages);
  }
  if (error instanceof HTTPException && error.status < 500) {
    return errorResponse(
      c,
      error.status,
      error.message || (STATUS_CODES[error.status] ?? 'Error'),
    );
  }

  const path = stripQueryAndFragment(originalUrl(c));
  Sentry.captureException(error);
  logger.error(
    { err: error, path, method: c.req.method },
    `Unhandled 500 on ${c.req.method} ${path}`,
  );
  return errorResponse(c, 500, 'Internal server error');
};

/** Route inconnue (préfixe `/api` ou non, méthode non prise en charge) : même 404 JSON. */
export const handleNotFound: NotFoundHandler = (c) =>
  handleError(
    new NotFoundException(`Cannot ${c.req.method} ${originalUrl(c)}`),
    c,
  );
