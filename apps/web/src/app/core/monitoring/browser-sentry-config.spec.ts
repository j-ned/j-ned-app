import { describe, expect, it } from 'vitest';
import { toBrowserSentryConfig } from './browser-sentry-config';

const DSN = 'https://public@o0.ingest.sentry.io/2';

const aRuntimeConfig = (sentry: unknown): unknown => ({ sentry });

describe('toBrowserSentryConfig', () => {
  it('given the API runtime config and a site release, when read, then the release is the site one, not the API one', () => {
    const config = toBrowserSentryConfig(
      aRuntimeConfig({ dsn: DSN, environment: 'production', release: 'sha-api' }),
      'sha-web',
    );

    expect(config).toEqual({ dsn: DSN, environment: 'production', release: 'sha-web' });
  });

  it('given a build without release, when read, then no release is set rather than the API one', () => {
    const config = toBrowserSentryConfig(
      aRuntimeConfig({ dsn: DSN, environment: 'development', release: 'sha-api' }),
      '',
    );

    expect(config).toEqual({ dsn: DSN, environment: 'development' });
  });

  it('given an empty DSN, when read, then Sentry stays off', () => {
    const config = toBrowserSentryConfig(
      aRuntimeConfig({ dsn: '', environment: 'production', release: '' }),
      'sha-web',
    );

    expect(config).toBeNull();
  });

  it.each<[string, unknown]>([
    ['null', null],
    ['a string', 'oops'],
    ['an object without sentry', {}],
    ['a null sentry block', aRuntimeConfig(null)],
    ['a numeric DSN', aRuntimeConfig({ dsn: 42, environment: 'production' })],
    ['a missing environment', aRuntimeConfig({ dsn: DSN })],
    ['a numeric environment', aRuntimeConfig({ dsn: DSN, environment: 1 })],
  ])('given %s instead of the runtime config, when read, then Sentry stays off', (_label, raw) => {
    expect(toBrowserSentryConfig(raw, 'sha-web')).toBeNull();
  });
});
