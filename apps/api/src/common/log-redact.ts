import pino from 'pino';

// Secrets d'authentification et coordonnées du visiteur, jamais transmis tels quels hors du processus.
// Source unique des masques pino (`LOG_REDACT_PATHS`) et du filtre Sentry (`sentryBeforeSend`).
export const SENSITIVE_BODY_FIELDS = [
  'password',
  'newPassword',
  'currentPassword',
  'code',
  'token',
  'refreshToken',
  'jwt',
  'name',
  'email',
  'phone',
  'company',
  'message',
  'website',
] as const;

export const LOG_REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  ...SENSITIVE_BODY_FIELDS.map((field) => `req.body.${field}` as const),
  // Le cookie de session (JWT complet) était écrit dans les logs à chaque login.
  'res.headers["set-cookie"]',
] as const;

const FILTERED = '[Filtered]';

// Coupe la query string et le fragment : ils peuvent porter un e-mail, un jeton ou un terme recherché.
export function stripQueryAndFragment(url: string): string {
  const [path = ''] = url.split(/[?#]/, 1);
  return path;
}

type SerializedRequest = {
  id?: string | undefined;
  method?: string | undefined;
  url?: string | undefined;
};

// Ni en-têtes (`authorization`, `cookie`, `x-forwarded-for`), ni IP, ni corps, ni query string.
export function serializeRequest(req: SerializedRequest): SerializedRequest {
  return {
    id: req.id,
    method: req.method,
    url: req.url && stripQueryAndFragment(req.url),
  };
}

// `DrizzleQueryError` écrit les paramètres liés (valeurs saisies) après `\nparams: ` : jusqu'à la fin
// d'un message, jusqu'à la première frame (`\n    at `) d'une pile, pour garder la trace d'appel.
const QUERY_PARAMS = {
  message: /\nparams: [\s\S]*$/,
  stack: /\nparams: [\s\S]*?(?=\n {4}at |$)/g,
} as const;

export const redactQueryParams = (
  text: string,
  kind: keyof typeof QUERY_PARAMS = 'message',
): string => text.replace(QUERY_PARAMS[kind], `\nparams: ${FILTERED}`);

// Champs porteurs de valeurs : `params` (Drizzle), `parameters` (postgres.js en debug), `detail`
// (Postgres : « Key (email)=(…) already exists », « Failing row contains (…) »).
const ERROR_VALUE_FIELDS = ['params', 'parameters', 'detail'] as const;

type SerializedError = Record<string, unknown> & {
  message?: unknown;
  stack?: unknown;
};

const scrubSerializedError = (err: SerializedError): SerializedError => {
  // Paramètres connus (DrizzleQueryError) : remplacement exact, qui garde le message de la cause que
  // pino ajoute après (`params: …: relation "x" does not exist`) et résiste à une valeur saisie imitant
  // une frame. Sinon (pile recopiée dans une autre erreur), l'expression sert de filet.
  const exact = Array.isArray(err.params)
    ? `\nparams: ${String(err.params)}`
    : undefined;
  const scrub = (text: unknown, kind: 'message' | 'stack'): unknown => {
    if (typeof text !== 'string') return text;
    return exact
      ? text.split(exact).join(`\nparams: ${FILTERED}`)
      : redactQueryParams(text, kind);
  };
  const scrubbed: SerializedError = {
    ...err,
    message: scrub(err.message, 'message'),
    stack: scrub(err.stack, 'stack'),
  };
  for (const field of ERROR_VALUE_FIELDS) {
    if (scrubbed[field] !== undefined) scrubbed[field] = FILTERED;
  }
  return scrubbed;
};

// Valeurs liées masquées aussi dans les causes, que pino concatène à la pile. pino-http passe l'erreur
// déjà sérialisée (`wrapErrorSerializer`) ; une `Error` brute (pino seul) est d'abord sérialisée.
export function serializeError(err: unknown): SerializedError {
  const serialized =
    err instanceof Error
      ? (pino.stdSerializers.err(err) as unknown as SerializedError)
      : (err as SerializedError);
  return scrubSerializedError(serialized);
}

// Un message chaîne qui recopie `err.message` (`track failed: ${e.message}`) perd ses paramètres liés.
export const redactLogArguments = (args: readonly unknown[]): unknown[] =>
  args.map((arg) => (typeof arg === 'string' ? redactQueryParams(arg) : arg));
