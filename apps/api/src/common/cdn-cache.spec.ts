import { Hono } from 'hono';
import {
  CDN_CACHE_CONTROL,
  CONTENT_CACHE_TAG,
  cdnCache,
  purgeContentCacheOnWrite,
} from './cdn-cache';
import { NotFoundException } from './http-errors';
import { testApp } from './test-app';
import type { AppEnv } from './http';

describe('cdnCache', () => {
  const app = testApp(
    '/api',
    new Hono<AppEnv>()
      .get('/ok', cdnCache, (c) => c.json({ ok: true }))
      .get('/missing', cdnCache, () => {
        throw new NotFoundException('absent');
      })
      .get('/broken', cdnCache, () => {
        throw new Error('boom');
      }),
  );

  it.each(['/api/ok', '/api/missing'])(
    'caches %s on the CDN under the content tag',
    async (path) => {
      const res = await app.request(path);

      expect(res.headers.get('CDN-Cache-Control')).toBe(CDN_CACHE_CONTROL);
      expect(res.headers.get('Vercel-Cache-Tag')).toBe(CONTENT_CACHE_TAG);
    },
  );

  it('never caches a server error', async () => {
    const res = await app.request('/api/broken');

    expect(res.status).toBe(500);
    expect(res.headers.get('CDN-Cache-Control')).toBeNull();
    expect(res.headers.get('Vercel-Cache-Tag')).toBeNull();
  });

  it('leaves the browser cache alone', async () => {
    const res = await app.request('/api/ok');

    expect(res.headers.get('Cache-Control')).toBeNull();
  });
});

describe('purgeContentCacheOnWrite', () => {
  const build = (purge: () => Promise<void>) =>
    testApp(
      '/api',
      new Hono<AppEnv>()
        .use(purgeContentCacheOnWrite(purge))
        .get('/item', (c) => c.json({}))
        .post('/item', (c) => c.json({}, 201))
        .delete('/item', (c) => c.body(null, 204))
        .patch('/item', () => {
          throw new NotFoundException('absent');
        }),
    );

  it.each([
    ['POST', 201],
    ['DELETE', 204],
  ])(
    'purges the content cache after a successful %s',
    async (method, status) => {
      const purge = jest.fn().mockResolvedValue(undefined);

      const res = await build(purge).request('/api/item', { method });

      expect(res.status).toBe(status);
      expect(purge).toHaveBeenCalledTimes(1);
    },
  );

  it('purges before answering, so the next reload reads the new version', async () => {
    const order: string[] = [];
    const purge = jest.fn(async () => {
      await Promise.resolve();
      order.push('purge');
    });

    await build(purge).request('/api/item', { method: 'POST' });
    order.push('response');

    expect(order).toEqual(['purge', 'response']);
  });

  it.each(['GET', 'HEAD'])('never purges on %s', async (method) => {
    const purge = jest.fn().mockResolvedValue(undefined);

    await build(purge).request('/api/item', { method });

    expect(purge).not.toHaveBeenCalled();
  });

  it('never purges when the write failed', async () => {
    const purge = jest.fn().mockResolvedValue(undefined);

    const res = await build(purge).request('/api/item', { method: 'PATCH' });

    expect(res.status).toBe(404);
    expect(purge).not.toHaveBeenCalled();
  });

  it('still answers the write when the purge fails', async () => {
    const purge = jest.fn().mockRejectedValue(new Error('rate limited'));

    const res = await build(purge).request('/api/item', { method: 'POST' });

    expect(res.status).toBe(201);
  });
});
