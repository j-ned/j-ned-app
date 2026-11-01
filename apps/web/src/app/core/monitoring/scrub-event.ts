import type { Breadcrumb, BrowserOptions, ErrorEvent } from '@sentry/angular';

type EventRequest = NonNullable<ErrorEvent['request']>;
type StreamedSpan = Parameters<NonNullable<BrowserOptions['beforeSendSpan']>>[0];

const FILTERED = '[Filtered]';
const FILTERED_BODY_KEYS = ['password', 'newPassword', 'currentPassword', 'code', 'token', 'email'];
const DROPPED_HEADERS = ['authorization', 'cookie'];

const withoutQueryAndFragment = (url: string): string => url.split(/[?#]/, 1)[0];

const withoutSensitiveHeaders = (headers: EventRequest['headers']): EventRequest['headers'] =>
  headers &&
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

const withScrubbedFrames = (exception: EventException): EventException => ({
  ...exception,
  values: exception.values?.map((value) =>
    value.stacktrace?.frames
      ? {
          ...value,
          stacktrace: {
            ...value.stacktrace,
            frames: value.stacktrace.frames.map(withScrubbedFrame),
          },
        }
      : value,
  ),
});

export function scrubEvent(event: ErrorEvent): ErrorEvent {
  const scrubbed = event.exception
    ? { ...event, exception: withScrubbedFrames(event.exception) }
    : event;
  if (!scrubbed.request) return scrubbed;
  const { cookies: _cookies, url, headers, data, ...request } = scrubbed.request;
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
