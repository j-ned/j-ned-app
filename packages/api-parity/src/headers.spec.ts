import { describe, expect, it } from 'vitest';
import { EVIL_ORIGIN, SITE_ORIGIN, newVisitor } from './client';

describe('response headers', () => {
  it('Given any response, When it is read, Then it does not reveal the framework and forbids MIME sniffing', async () => {
    const response = await newVisitor().request('GET', '/api/projects');

    expect({
      poweredBy: response.headers.get('x-powered-by'),
      nosniff: response.headers.get('x-content-type-options'),
    }).toEqual({ poweredBy: null, nosniff: 'nosniff' });
  });

  it('Given the storage proxy, When it serves an image, Then another origin may embed it', async () => {
    const response = await newVisitor().request(
      'GET',
      '/api/storage/portfolio-storage/parity.avif',
    );

    expect(response.headers.get('cross-origin-resource-policy')).toBe('cross-origin');
  });

  // Transition (ADR-0034) : tant que l'ancien front peut appeler le sous-domaine, CORS reste ouvert au
  // site, et à lui seul.
  it('Given the site origin, When it preflights a credentialed write, Then CORS allows it', async () => {
    const response = await newVisitor().request('OPTIONS', '/api/auth/login', {
      site: null,
      headers: {
        origin: SITE_ORIGIN,
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'content-type',
      },
    });

    expect({
      allowOrigin: response.headers.get('access-control-allow-origin'),
      allowCredentials: response.headers.get('access-control-allow-credentials'),
    }).toEqual({ allowOrigin: SITE_ORIGIN, allowCredentials: 'true' });
  });

  it('Given another origin, When it preflights a credentialed write, Then CORS does not allow it', async () => {
    const response = await newVisitor().request('OPTIONS', '/api/auth/login', {
      site: null,
      headers: {
        origin: EVIL_ORIGIN,
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'content-type',
      },
    });

    expect(response.headers.get('access-control-allow-origin')).toBeNull();
  });
});
