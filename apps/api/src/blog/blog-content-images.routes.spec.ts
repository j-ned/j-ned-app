import type { UploadedFile } from '../common/http';
import { UnprocessableEntityException } from '../common/http-errors';
import { testApp } from '../testing/test-app';
import { blogContentImagesRoutes } from './blog-content-images.routes';
import type { BlogContentImagesService } from './blog-content-images.service';
import { fileForm } from '../testing/multipart';
import { passThrough } from '../testing/require-auth';

// PNG 1×1 réel : le type est vérifié sur les octets magiques, pas seulement sur le Content-Type.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

/** Routes montées avec le gestionnaire d'erreurs de l'API ; service et session remplacés. */
describe('blog content images routes (HTTP)', () => {
  const images = { upload: jest.fn() };
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
      ...(body ? { body } : {}),
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

      const res = await post(fileForm(PNG, filename, contentType));

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
      const res = await post(
        fileForm(Buffer.from('%PDF'), filename, contentType),
      );
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
      fileForm(Buffer.alloc(4 * 1024 * 1024 + 1), 'big.png', 'image/png'),
    );
    expect(res.status).toBe(413);
    expect(images.upload).not.toHaveBeenCalled();
  });

  it('Given an unreadable image, When posted, Then the optimizer 422 is returned', async () => {
    images.upload.mockRejectedValueOnce(
      new UnprocessableEntityException('Image illisible'),
    );
    const res = await post(fileForm(PNG, 'a.png', 'image/png'));
    expect(res.status).toBe(422);
  });
});
