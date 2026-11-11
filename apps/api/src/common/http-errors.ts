import { STATUS_CODES } from 'node:http';

export type ErrorMessage = string | string[];

/**
 * Erreur HTTP levée par les services et les routes, rendue par `handleError` au format JSON de l'API.
 * `messages` garde la liste brute (erreurs de validation) ; `message` en est la forme texte.
 */
export class HttpException extends Error {
  readonly messages: ErrorMessage;

  constructor(
    readonly status: number,
    messages: ErrorMessage = STATUS_CODES[status] ?? 'Error',
  ) {
    super(Array.isArray(messages) ? messages.join('; ') : messages);
    this.name = new.target.name;
    this.messages = messages;
  }
}

const httpException = (status: number) =>
  class extends HttpException {
    constructor(messages?: ErrorMessage) {
      super(status, messages);
    }
  };

export class BadRequestException extends httpException(400) {}
export class UnauthorizedException extends httpException(401) {}
export class ForbiddenException extends httpException(403) {}
export class NotFoundException extends httpException(404) {}
export class ConflictException extends httpException(409) {}
export class PayloadTooLargeException extends httpException(413) {}
export class UnprocessableEntityException extends httpException(422) {}
export class TooManyRequestsException extends httpException(429) {}
export class ServiceUnavailableException extends httpException(503) {}
