import type { RequireAuth } from '../auth/require-auth';
import type { UploadedFile } from '../common/http';
import {
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '../common/http-errors';
import { testApp } from '../common/test-app';
import { ADMIN_WRITE_THROTTLE } from '../common/throttle';
import type { ProjectImagesService } from './project-images.service';
import { projectsRoutes } from './projects.routes';
import type { ProjectsService } from './projects.service';

const PROJECT_ID = '11111111-1111-4111-8111-111111111111';
const IMAGE_ID = '22222222-2222-4222-8222-222222222222';
// PNG 1×1 réel : le type est vérifié sur les octets magiques, pas seulement le Content-Type.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

const passThrough: RequireAuth = async (_c, next) => {
  await next();
};
const unauthorized: RequireAuth = () => {
  throw new UnauthorizedException();
};

type Part = { name: string; value: string | Blob; filename?: string };

const form = (...parts: Part[]): FormData => {
  const data = new FormData();
  for (const { name, value, filename } of parts) {
    if (typeof value === 'string') data.append(name, value);
    else data.append(name, value, filename);
  }
  return data;
};
const file = (bytes: Buffer, type: string, filename: string): Part => ({
  name: 'file',
  value: new Blob([new Uint8Array(bytes)], { type }),
  filename,
});
const png = () => file(PNG, 'image/png', 'a.png');
const alt = (value: string): Part => ({ name: 'alt', value });

/** Galerie montée avec le vrai gestionnaire d'erreurs ; service et session remplacés. */
describe('project images routes (HTTP)', () => {
  const images = {
    upload: jest.fn(),
    updateAlt: jest.fn(),
    remove: jest.fn(),
    reorder: jest.fn(),
  };
  const build = (requireAuth: RequireAuth) =>
    testApp(
      '/api/projects',
      projectsRoutes(
        {} as ProjectsService,
        images as unknown as ProjectImagesService,
        requireAuth,
      ),
    );
  let app = build(passThrough);

  beforeEach(() => {
    jest.clearAllMocks();
    // Quotas en mémoire par instance : une app neuve par test.
    app = build(passThrough);
  });

  const json = (method: string, path: string, body: unknown) =>
    app.request(path, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

  describe('session', () => {
    it.each([
      ['POST', `/api/projects/${PROJECT_ID}/images`],
      ['PATCH', `/api/projects/${PROJECT_ID}/images/${IMAGE_ID}`],
      ['DELETE', `/api/projects/${PROJECT_ID}/images/${IMAGE_ID}`],
      ['PUT', `/api/projects/${PROJECT_ID}/images/order`],
    ])(
      'Given no session, When %s %s, Then 401 without calling the service',
      async (method, path) => {
        const res = await build(unauthorized).request(path, { method });
        expect(res.status).toBe(401);
        for (const fn of Object.values(images)) {
          expect(fn).not.toHaveBeenCalled();
        }
      },
    );
  });

  describe('quota (AdminWriteThrottle)', () => {
    it(`Given an admin, When it deletes ${ADMIN_WRITE_THROTTLE.limit + 1} times within a minute, Then the last one gets 429`, async () => {
      images.remove.mockResolvedValue(undefined);
      const statuses: number[] = [];
      for (let i = 0; i <= ADMIN_WRITE_THROTTLE.limit; i += 1) {
        const res = await app.request(
          `/api/projects/${PROJECT_ID}/images/${IMAGE_ID}`,
          { method: 'DELETE', headers: { 'x-forwarded-for': '203.0.113.9' } },
        );
        statuses.push(res.status);
      }
      expect(statuses.slice(0, -1).every((s) => s === 204)).toBe(true);
      expect(statuses.at(-1)).toBe(429);
    });
  });

  describe('POST /projects/:id/images', () => {
    const post = (body: FormData, id = PROJECT_ID) =>
      app.request(`/api/projects/${id}/images`, { method: 'POST', body });

    it('Given a PNG and an alt, When posted, Then 201 with the created capture', async () => {
      const created = {
        id: 'x',
        url: '/storage/portfolio-storage/project-images/x.avif',
        alt: 'Tableau de bord',
        width: 1600,
        height: 1000,
        order: 0,
      };
      images.upload.mockResolvedValueOnce(created);

      const res = await post(form(alt('  Tableau de bord '), png()));

      expect(res.status).toBe(201);
      expect(await res.json()).toEqual(created);
      const [id, uploaded, text] = images.upload.mock.calls[0] as [
        string,
        UploadedFile,
        string,
      ];
      expect(id).toBe(PROJECT_ID);
      expect(uploaded.buffer).toEqual(PNG);
      expect(text).toBe('Tableau de bord');
    });

    it('Given a non-image file, When posted, Then 422 without calling the service', async () => {
      const res = await post(
        form(alt('Alt'), file(Buffer.from('%PDF'), 'application/pdf', 'a.pdf')),
      );
      expect(res.status).toBe(422);
      expect(images.upload).not.toHaveBeenCalled();
    });

    it('Given a PDF announced as image/png, When posted, Then 422 (magic bytes checked)', async () => {
      const res = await post(
        form(alt('Alt'), file(Buffer.from('%PDF-1.4\n'), 'image/png', 'a.png')),
      );
      expect(res.status).toBe(422);
      expect(images.upload).not.toHaveBeenCalled();
    });

    it('Given a file over 5 MB, When posted, Then 413 without calling the service', async () => {
      const res = await post(
        form(
          alt('Alt'),
          file(Buffer.alloc(5 * 1024 * 1024 + 1), 'image/png', 'big.png'),
        ),
      );
      expect(res.status).toBe(413);
      expect(images.upload).not.toHaveBeenCalled();
    });

    it('Given no file, When posted, Then 422 without calling the service', async () => {
      const res = await post(form(alt('Alt')));
      expect(res.status).toBe(422);
      expect(images.upload).not.toHaveBeenCalled();
    });

    it.each([
      ['missing', undefined],
      ['blank', '   '],
      ['too long', 'a'.repeat(301)],
    ])(
      'Given an alt %s, When posted, Then 400 (validation) without calling the service',
      async (_, value) => {
        const parts = value === undefined ? [png()] : [alt(value), png()];
        const res = await post(form(...parts));
        expect(res.status).toBe(400);
        expect(images.upload).not.toHaveBeenCalled();
      },
    );

    it('Given an unknown text field, When posted, Then 400 (whitelist)', async () => {
      const res = await post(
        form(alt('Alt'), { name: 'order', value: '3' }, png()),
      );
      expect(res.status).toBe(400);
      expect(images.upload).not.toHaveBeenCalled();
    });

    it('Given a non-UUID project id, When posted, Then 400', async () => {
      const res = await post(form(alt('Alt'), png()), 'not-a-uuid');
      expect(res.status).toBe(400);
      expect(images.upload).not.toHaveBeenCalled();
    });

    it('Given a non-UUID project id and a non-image file, When posted, Then 400 (id checked before the file)', async () => {
      const res = await post(
        form(alt('Alt'), file(Buffer.from('%PDF'), 'application/pdf', 'a.pdf')),
        'not-a-uuid',
      );
      expect(res.status).toBe(400);
    });

    it('Given the gallery is full, When posted, Then the service 422 is returned', async () => {
      images.upload.mockRejectedValueOnce(
        new UnprocessableEntityException('Galerie pleine'),
      );
      const res = await post(form(alt('Alt'), png()));
      expect(res.status).toBe(422);
    });
  });

  describe('PATCH /projects/:id/images/:imageId', () => {
    it('Given a new alt, When patched, Then 200 with the capture', async () => {
      images.updateAlt.mockResolvedValueOnce({
        id: IMAGE_ID,
        alt: 'Nouvel alt',
      });
      const res = await json(
        'PATCH',
        `/api/projects/${PROJECT_ID}/images/${IMAGE_ID}`,
        { alt: ' Nouvel alt ' },
      );
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ id: IMAGE_ID, alt: 'Nouvel alt' });
      expect(images.updateAlt).toHaveBeenCalledWith(
        PROJECT_ID,
        IMAGE_ID,
        'Nouvel alt',
      );
    });

    it.each([
      ['blank alt', { alt: ' ' }],
      ['unknown field', { alt: 'Alt', order: 3 }],
    ])('Given a %s, When patched, Then 400', async (_, body) => {
      const res = await json(
        'PATCH',
        `/api/projects/${PROJECT_ID}/images/${IMAGE_ID}`,
        body,
      );
      expect(res.status).toBe(400);
      expect(images.updateAlt).not.toHaveBeenCalled();
    });

    it('Given a non-UUID image id, When patched, Then 400', async () => {
      const res = await json(
        'PATCH',
        `/api/projects/${PROJECT_ID}/images/nope`,
        { alt: 'Alt' },
      );
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /projects/:id/images/:imageId', () => {
    const remove = () =>
      app.request(`/api/projects/${PROJECT_ID}/images/${IMAGE_ID}`, {
        method: 'DELETE',
      });

    it('Given a capture, When deleted, Then 204 without body', async () => {
      images.remove.mockResolvedValueOnce(undefined);
      const res = await remove();
      expect(res.status).toBe(204);
      expect(await res.text()).toBe('');
      expect(images.remove).toHaveBeenCalledWith(PROJECT_ID, IMAGE_ID);
    });

    it('Given a capture of another project, When deleted, Then the service 404 is returned', async () => {
      images.remove.mockRejectedValueOnce(new NotFoundException());
      expect((await remove()).status).toBe(404);
    });
  });

  describe('PUT /projects/:id/images/order', () => {
    const A = '22222222-2222-4222-8222-222222222222';
    const B = '33333333-3333-4333-8333-333333333333';
    const put = (body: unknown) =>
      json('PUT', `/api/projects/${PROJECT_ID}/images/order`, body);

    it('Given the full list of ids, When put, Then 200 with the reordered gallery', async () => {
      const gallery = [
        { id: B, order: 0 },
        { id: A, order: 1 },
      ];
      images.reorder.mockResolvedValueOnce(gallery);
      const res = await put({ imageIds: [B, A] });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(gallery);
      expect(images.reorder).toHaveBeenCalledWith(PROJECT_ID, [B, A]);
    });

    it.each([
      ['no imageIds', {}],
      ['a non-UUID id', { imageIds: [A, 'nope'] }],
      ['a duplicate id', { imageIds: [A, A] }],
    ])(
      'Given %s, When put, Then 400 without calling the service',
      async (_, body) => {
        const res = await put(body);
        expect(res.status).toBe(400);
        expect(images.reorder).not.toHaveBeenCalled();
      },
    );

    it('Given a list that is not a permutation, When put, Then the service 422 is returned', async () => {
      images.reorder.mockRejectedValueOnce(new UnprocessableEntityException());
      const res = await put({ imageIds: [A] });
      expect(res.status).toBe(422);
    });
  });
});
