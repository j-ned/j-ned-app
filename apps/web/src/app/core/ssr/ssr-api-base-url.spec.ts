import { REQUEST_CONTEXT, type Provider } from '@angular/core';
import { HTTP_TRANSFER_CACHE_ORIGIN_MAP } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '@shared/api/api-config';
import { describe, expect, it } from 'vitest';
import { provideSsrApiBaseUrl } from './ssr-api-base-url';

type Resolved = {
  readonly apiBaseUrl: string;
  readonly originMap: Readonly<Record<string, string>>;
};

function resolve(requestContext?: unknown): Resolved {
  const contextProviders: Provider[] =
    requestContext === undefined ? [] : [{ provide: REQUEST_CONTEXT, useValue: requestContext }];
  TestBed.configureTestingModule({ providers: [...contextProviders, provideSsrApiBaseUrl()] });
  return {
    apiBaseUrl: TestBed.inject(API_BASE_URL),
    originMap: TestBed.inject(HTTP_TRANSFER_CACHE_ORIGIN_MAP),
  };
}

describe('provideSsrApiBaseUrl', () => {
  it.each([
    ['http://api:3000/api', 'http://api:3000'],
    ['http://portfolio-api:8080/api', 'http://portfolio-api:8080'],
  ])(
    'Given a request context pointing at %s When the API url is resolved Then the internal url is used and its origin maps to the public one',
    (internalApiBaseUrl, internalOrigin) => {
      const resolved = resolve({
        apiBaseUrl: internalApiBaseUrl,
        visitorForwardedFor: '203.0.113.7',
      });

      expect(resolved).toEqual({
        apiBaseUrl: internalApiBaseUrl,
        originMap: { [internalOrigin]: 'https://api.nedellec-julien.fr' },
      });
    },
  );

  it('Given no request context When the API url is resolved Then the public url is used without any origin mapping', () => {
    expect(resolve()).toEqual({ apiBaseUrl: 'https://api.nedellec-julien.fr/api', originMap: {} });
  });

  it.each<[string, unknown]>([
    ['a null context', null],
    ['a non-string api url', { apiBaseUrl: 42, visitorForwardedFor: null }],
    ['a bare string', 'http://api:3000/api'],
  ])(
    'Given %s When the API url is resolved Then it falls back to the public url without any origin mapping',
    (_label, requestContext) => {
      expect(resolve(requestContext)).toEqual({
        apiBaseUrl: 'https://api.nedellec-julien.fr/api',
        originMap: {},
      });
    },
  );
});
