import { Readable } from 'node:stream';
import { testApp } from '../common/test-app';
import type { ImageOptimizer } from './image-optimizer.service';
import { ResizedImageService } from './resized-image.service';
import { ShareCardService } from './share-card.service';
import { storageRoutes } from './storage.routes';
import { StorageService } from './storage.service';

describe('storage routes', () => {
  const storage = { get: jest.fn() };
  const shareCards = { get: jest.fn() };
  const resizedImages = { get: jest.fn() };
  const app = testApp(
    '/api/storage',
    storageRoutes(
      storage as unknown as StorageService,
      shareCards as unknown as ShareCardService,
      resizedImages as unknown as ResizedImageService,
    ),
  );

  beforeEach(() => jest.clearAllMocks());

  const call = (variant?: string, bucket = 'portfolio-storage') =>
    app.request(
      `/api/storage/${bucket}/blog/1.avif${variant ? `?variant=${variant}` : ''}`,
    );

  it("sans variante : streame l'objet avec son Content-Type d'origine", async () => {
    storage.get.mockResolvedValue({
      stream: Readable.from(Buffer.from('x')),
      contentType: 'image/avif',
      contentLength: 1,
    });

    const res = await call();

    expect(storage.get).toHaveBeenCalledWith(
      'portfolio-storage',
      'blog/1.avif',
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/avif');
    expect(res.headers.get('content-length')).toBe('1');
    expect(await res.text()).toBe('x');
  });

  it('clé au pourcent-encodage invalide : 404, jamais une erreur serveur', async () => {
    const res = await app.request('/api/storage/portfolio-storage/%E0');

    expect(res.status).toBe(404);
    expect(storage.get).not.toHaveBeenCalled();
  });

  it('variant=share : sert la carte JPEG avec sa taille et le même cache', async () => {
    const buffer = Buffer.from('jpeg-card');
    shareCards.get.mockResolvedValue({ buffer, contentType: 'image/jpeg' });

    const res = await call('share');

    expect(shareCards.get).toHaveBeenCalledWith(
      'portfolio-storage',
      'blog/1.avif',
    );
    expect(storage.get).not.toHaveBeenCalled();
    expect({
      type: res.headers.get('content-type'),
      length: res.headers.get('content-length'),
      cache: res.headers.get('cache-control'),
    }).toEqual({
      type: 'image/jpeg',
      length: String(buffer.length),
      cache: 'public, max-age=31536000, immutable',
    });
  });

  it('variant=w800 : sert la variante AVIF de 800 px avec sa taille et le même cache', async () => {
    const buffer = Buffer.from('avif-800');
    resizedImages.get.mockResolvedValue({ buffer, contentType: 'image/avif' });

    const res = await call('w800');

    expect(resizedImages.get).toHaveBeenCalledWith(
      'portfolio-storage',
      'blog/1.avif',
      800,
    );
    expect(storage.get).not.toHaveBeenCalled();
    expect({
      type: res.headers.get('content-type'),
      length: res.headers.get('content-length'),
      cache: res.headers.get('cache-control'),
    }).toEqual({
      type: 'image/avif',
      length: String(buffer.length),
      cache: 'public, max-age=31536000, immutable',
    });
  });

  it.each(['thumb', 'w801', 'w1600', 'w0800', 'w'])(
    'variante inconnue (%s) → 400, rien n’est dérivé',
    async (variant) => {
      expect((await call(variant)).status).toBe(400);
      expect(storage.get).not.toHaveBeenCalled();
      expect(resizedImages.get).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['blog/1.avif.w800.avif', 'w800'],
    ['blog/1.avif.share.jpg', 'w800'],
    ['blog/1.avif.w800.avif', 'share'],
  ])(
    'variante demandée sur une dérivée (%s?variant=%s) → 404, rien n’est dérivé',
    async (key, variant) => {
      const res = await app.request(
        `/api/storage/portfolio-storage/${key}?variant=${variant}`,
      );
      expect(res.status).toBe(404);
      expect(resizedImages.get).not.toHaveBeenCalled();
      expect(shareCards.get).not.toHaveBeenCalled();
    },
  );

  it('bucket non public → 404, même avec variante', async () => {
    expect((await call('share', 'private')).status).toBe(404);
    expect(shareCards.get).not.toHaveBeenCalled();
  });

  it('clé encodée : chaque segment est décodé', async () => {
    storage.get.mockResolvedValue({
      stream: Readable.from(Buffer.from('x')),
      contentType: 'image/avif',
      contentLength: 1,
    });

    await app.request('/api/storage/portfolio-storage/blog/a%20b.avif');

    expect(storage.get).toHaveBeenCalledWith(
      'portfolio-storage',
      'blog/a b.avif',
    );
  });
});

describe('storage routes, stockage désactivé (preview sans S3)', () => {
  const images = {} as ImageOptimizer;
  const storage = new StorageService(null);
  const app = testApp(
    '/api/storage',
    storageRoutes(
      storage,
      new ShareCardService(storage, images),
      new ResizedImageService(storage, images),
    ),
  );

  it.each(['', '?variant=share', '?variant=w800'])(
    'Given an image request%s, Then it answers a clear 503, never cached for a year',
    async (query) => {
      const res = await app.request(
        `/api/storage/portfolio-storage/projects/1-abcd1234.avif${query}`,
      );

      expect(res.status).toBe(503);
      expect(res.headers.get('cache-control') ?? '').not.toContain('immutable');
      expect(await res.json()).toMatchObject({
        statusCode: 503,
        message: 'File storage is disabled on this environment',
      });
    },
  );
});
