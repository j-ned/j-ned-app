import type { RequireAuth } from '../auth/require-auth';
import type { UploadedFile } from '../common/http';
import {
  UnauthorizedException,
  UnprocessableEntityException,
} from '../common/http-errors';
import { ADMIN_WRITE_THROTTLE } from '../common/throttle';
import { testApp } from '../common/test-app';
import { blogContentImagesRoutes } from './blog-content-images.routes';
import type { BlogContentImagesService } from './blog-content-images.service';

// PNG 1×1 réel : le type est vérifié sur les octets magiques, pas seulement sur le Content-Type.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

const form = (bytes: Buffer, filename: string, type: string) => {
  const body = new FormData();
  body.append('file', new File([new Uint8Array(bytes)], filename, { type }));
  return body;
};

/** Routes montées avec le gestionnaire d'erreurs de l'API ; service et session remplacés. */
describe('blog content images routes (HTTP)', () => {
  const images = { upload: jest.fn() };
  const passThrough: RequireAuth = async (_c, next) => {
    await next();
  };
  const app = testApp(
    '/api/blog/content-images',
    blogContentImagesRoutes(
      images as unknown as BlogContentImagesService,
      passThrough,
    ),
  );

  beforeEach(() => jest.clearAllMocks());

  // Une IP par requête : le quota admin (60/min) ne doit pas fausser les autres cas.
  let ip = 0;
  const post = (body?: FormData) =>
    app.request('/api/blog/content-images', {
      method: 'POST',
      headers: { 'x-forwarded-for': `198.51.100.${(ip += 1)}` },
      body,
    });

  it('Given no session, When posted, Then 401 without calling the service', async () => {
    const denied: RequireAuth = () => {
      throw new UnauthorizedException();
    };
    const guarded = testApp(
      '/api/blog/content-images',
      blogContentImagesRoutes(
        images as unknown as BlogContentImagesService,
        denied,
      ),
    );

    const res = await guarded.request('/api/blog/content-images', {
      method: 'POST',
      body: form(PNG, 'a.png', 'image/png'),
    });

    expect(res.status).toBe(401);
    expect(images.upload).not.toHaveBeenCalled();
  });

  it('Given an admin, When it posts more than the admin write quota in a minute, Then it gets 429', async () => {
    images.upload.mockResolvedValue({ url: '/x', width: 1, height: 1 });
    const statuses: number[] = [];
    for (let i = 0; i <= ADMIN_WRITE_THROTTLE.limit; i += 1) {
      const res = await app.request('/api/blog/content-images', {
        method: 'POST',
        headers: { 'x-forwarded-for': '192.0.2.1' },
        body: form(PNG, 'a.png', 'image/png'),
      });
      statuses.push(res.status);
    }

    expect(ADMIN_WRITE_THROTTLE).toEqual({ limit: 60, ttlMs: 60_000 });
    expect(statuses.at(-2)).toBe(201);
    expect(statuses.at(-1)).toBe(429);
  });

  it.each([
    ['image/png', 'a.png'],
    ['image/jpeg', 'a.jpg'],
    ['image/webp', 'a.webp'],
    ['image/avif', 'a.avif'],
  ])(
    'Given a %s file, When posted, Then 201 with the url and dimensions',
    async (contentType, filename) => {
      const created = {
        url: '/storage/portfolio-storage/blog-content/x-a1b2c3d4-1600x900.avif',
        width: 1600,
        height: 900,
      };
      images.upload.mockResolvedValueOnce(created);

      const res = await post(form(PNG, filename, contentType));

      expect(res.status).toBe(201);
      expect(res.headers.get('content-type')).toMatch(/^application\/json/);
      expect(await res.json()).toEqual(created);
      const [file] = images.upload.mock.calls[0] as [UploadedFile];
      expect(file.buffer).toEqual(PNG);
    },
  );

  it.each([
    ['application/pdf', 'a.pdf'],
    ['image/gif', 'a.gif'],
    ['image/svg+xml', 'a.svg'],
  ])(
    'Given a %s file, When posted, Then 422 without calling the service',
    async (contentType, filename) => {
      const res = await post(form(Buffer.from('%PDF'), filename, contentType));
      expect(res.status).toBe(422);
      expect(images.upload).not.toHaveBeenCalled();
    },
  );

  it('Given no file, When posted, Then 422 without calling the service', async () => {
    const res = await post();
    expect(res.status).toBe(422);
    expect(images.upload).not.toHaveBeenCalled();
  });

  it('Given a file over 4 MB, When posted, Then 413 without calling the service', async () => {
    const res = await post(
      form(Buffer.alloc(4 * 1024 * 1024 + 1), 'big.png', 'image/png'),
    );
    expect(res.status).toBe(413);
    expect(images.upload).not.toHaveBeenCalled();
  });

  it('Given an unreadable image, When posted, Then the optimizer 422 is returned', async () => {
    images.upload.mockRejectedValueOnce(
      new UnprocessableEntityException('Image illisible'),
    );
    const res = await post(form(PNG, 'a.png', 'image/png'));
    expect(res.status).toBe(422);
  });
});
