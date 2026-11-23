import type { Breadcrumb, BrowserOptions, ErrorEvent } from '@sentry/angular';

type EventRequest = NonNullable<ErrorEvent['request']>;
type StreamedSpan = Parameters<NonNullable<BrowserOptions['beforeSendSpan']>>[0];

const FILTERED = '[Filtered]';
const FILTERED_BODY_KEYS = ['password', 'newPassword', 'currentPassword', 'code', 'token', 'email'];
const DROPPED_HEADERS = ['authorization', 'proxy-authorization', 'cookie', 'set-cookie'];

const withoutQueryAndFragment = (url: string): string => url.replace(/[?#][\s\S]*$/, '');

type EventHeaders = NonNullable<EventRequest['headers']>;

const withoutSensitiveHeaders = (headers: EventHeaders): EventHeaders =>
  Object.fromEntries(
    Object.entries(headers).filter(([name]) => !DROPPED_HEADERS.includes(name.toLowerCase())),
  );

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const withFilteredBody = (data: unknown): unknown =>
  isRecord(data)
    ? Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          FILTERED_BODY_KEYS.includes(key) ? FILTERED : value,
        ]),
      )
    : data;

type EventException = NonNullable<ErrorEvent['exception']>;
type StackFrame = NonNullable<
  NonNullable<NonNullable<EventException['values']>[number]['stacktrace']>['frames']
>[number];

// Une erreur globale sans script (« Script error ») prend location.href comme fichier de frame.
const withScrubbedFrame = ({ filename, abs_path, ...frame }: StackFrame): StackFrame => ({
  ...frame,
  ...(filename !== undefined && { filename: withoutQueryAndFragment(filename) }),
  ...(abs_path !== undefined && { abs_path: withoutQueryAndFragment(abs_path) }),
});

// Une URL citée dans le texte d'une erreur (HttpClient, routeur, rendu) perd sa query string et son
// fragment ; la ponctuation qui la suit (« : 500 ») reste.
const URL_QUERY_IN_TEXT = /((?:https?:\/\/|\/)[^\s?#]*)[?#]\S*?(?=[:,;)]?(?:\s|$))/g;

const withoutUrlQueries = (text: string): string => text.replace(URL_QUERY_IN_TEXT, '$1');

type ExceptionValue = NonNullable<EventException['values']>[number];

const withScrubbedValue = (value: ExceptionValue): ExceptionValue => {
  const withText =
    value.value === undefined ? value : { ...value, value: withoutUrlQueries(value.value) };
  return withText.stacktrace?.frames
    ? {
        ...withText,
        stacktrace: {
          ...withText.stacktrace,
          frames: withText.stacktrace.frames.map(withScrubbedFrame),
        },
      }
    : withText;
};

const withScrubbedFrames = ({ values, ...exception }: EventException): EventException => ({
  ...exception,
  ...(values !== undefined && { values: values.map(withScrubbedValue) }),
});

type EventUser = NonNullable<ErrorEvent['user']>;

const withoutIpAddress = ({ ip_address: _ipAddress, ...user }: EventUser): EventUser => user;

// Partagé par le navigateur et le rendu serveur : côté Node, la requête porte aussi `query_string`.
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  const withFrames = event.exception
    ? { ...event, exception: withScrubbedFrames(event.exception) }
    : event;
  const scrubbed = withFrames.user
    ? { ...withFrames, user: withoutIpAddress(withFrames.user) }
    : withFrames;
  if (!scrubbed.request) return scrubbed;
  const {
    cookies: _cookies,
    query_string: _queryString,
    url,
    headers,
    data,
    ...request
  } = scrubbed.request;
  return {
    ...scrubbed,
    request: {
      ...request,
      ...(url !== undefined && { url: withoutQueryAndFragment(url) }),
      ...(headers !== undefined && { headers: withoutSensitiveHeaders(headers) }),
      ...(data !== undefined && { data: withFilteredBody(data) }),
    },
  };
}

const BREADCRUMB_URL_KEYS: Readonly<Record<string, readonly string[]>> = {
  fetch: ['url'],
  xhr: ['url'],
  navigation: ['from', 'to'],
};

export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  const urlKeys = BREADCRUMB_URL_KEYS[breadcrumb.category ?? ''];
  const { data } = breadcrumb;
  if (!urlKeys || !data) return breadcrumb;
  return {
    ...breadcrumb,
    data: Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        urlKeys.includes(key) && typeof value === 'string' ? withoutQueryAndFragment(value) : value,
      ]),
    ),
  };
}

const SPAN_URL_KEYS = ['url.full', 'http.url'];
const DROPPED_SPAN_KEYS = ['url.query', 'url.fragment'];

export function scrubSpan(span: StreamedSpan): StreamedSpan {
  return {
    ...span,
    attributes: Object.fromEntries(
      Object.entries(span.attributes)
        .filter(([key]) => !DROPPED_SPAN_KEYS.includes(key))
        .map(([key, value]) => [
          key,
          SPAN_URL_KEYS.includes(key) && typeof value === 'string'
            ? withoutQueryAndFragment(value)
            : value,
        ]),
    ),
  };
}
