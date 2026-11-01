import { Readable } from 'node:stream';
import { testApp } from '../common/test-app';
import type { ShareCardService } from './share-card.service';
import { storageRoutes } from './storage.routes';
import type { StorageService } from './storage.service';

describe('storage routes', () => {
  const storage = { get: jest.fn() };
  const shareCards = { get: jest.fn() };
  const app = testApp(
    '/api/storage',
    storageRoutes(
      storage as unknown as StorageService,
      shareCards as unknown as ShareCardService,
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

  it('variante inconnue → 400', async () => {
    expect((await call('thumb')).status).toBe(400);
    expect(storage.get).not.toHaveBeenCalled();
  });

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
