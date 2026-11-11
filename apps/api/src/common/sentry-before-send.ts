import type { ErrorEvent, Event } from '@sentry/node';
import {
  SENSITIVE_BODY_FIELDS,
  redactQueryParams,
  stripQueryAndFragment,
} from './log-redact';

const FILTERED = '[Filtered]';
const SENSITIVE_KEYS: ReadonlySet<string> = new Set(SENSITIVE_BODY_FIELDS);

const scrubValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(scrubValue);
  if (typeof value !== 'object' || value === null) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, inner]) => [
      key,
      SENSITIVE_KEYS.has(key) ? FILTERED : scrubValue(inner),
    ]),
  );
};

/**
 * Sentry joint le corps des requêtes entrantes aux événements : une chaîne qui n'est pas du JSON
 * (formulaire encodé, texte) ne peut pas être filtrée champ par champ, elle part donc masquée.
 */
const scrubBody = (data: unknown): unknown => {
  if (typeof data !== 'string') return scrubValue(data);
  if (data === '') return data;
  try {
    return JSON.stringify(scrubValue(JSON.parse(data)));
  } catch {
    return FILTERED;
  }
};

/** En-têtes porteurs de secrets, comparés en minuscules : Node les normalise, un événement forgé non. */
const SECRET_HEADERS: ReadonlySet<string> = new Set([
  'authorization',
  'proxy-authorization',
  'cookie',
  'set-cookie',
]);

/** `dataCollection.databaseQueryData` ne touche pas aux messages d'erreur : `redactQueryParams` s'en charge. */
const scrubExceptionValues = (
  exception: ErrorEvent['exception'],
): ErrorEvent['exception'] =>
  exception?.values && {
    ...exception,
    values: exception.values.map((value) =>
      value.value === undefined
        ? value
        : {
            ...value,
            value: redactQueryParams(value.value),
          },
    ),
  };

/**
 * Filet après `dataCollection` (fermé dans `instrument.ts`) : retire l'IP de l'utilisateur, les cookies,
 * les en-têtes d'authentification et de cookies (toute casse), la query string et le fragment de l'URL,
 * les champs sensibles du corps, et les paramètres liés des erreurs de requête SQL, sans muter l'événement.
 */
export function sentryBeforeSend(event: ErrorEvent): ErrorEvent {
  const { exception, request, user } = event;
  const named: ErrorEvent = { ...event };
  if (exception?.values) named.exception = scrubExceptionValues(exception);
  if (user && 'ip_address' in user) {
    const anonymous = { ...user };
    delete anonymous.ip_address;
    named.user = anonymous;
  }
  if (!request) return named;

  const scrubbed: ErrorEvent['request'] = { ...request };
  delete scrubbed.cookies;
  delete scrubbed.query_string;
  if (request.headers) {
    scrubbed.headers = Object.fromEntries(
      Object.entries(request.headers).filter(
        ([name]) => !SECRET_HEADERS.has(name.toLowerCase()),
      ),
    );
  }
  if (request.data !== undefined) scrubbed.data = scrubBody(request.data);
  if (request.url !== undefined) {
    scrubbed.url = stripQueryAndFragment(request.url);
  }
  return { ...named, request: scrubbed };
}

/** Requêtes entrantes jamais tracées : la sonde de santé. */
export function isUntracedIncomingRequest(url: string): boolean {
  return url.startsWith('/api/health');
}
