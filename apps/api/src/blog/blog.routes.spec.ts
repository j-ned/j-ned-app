import type { RequireAuth } from '../auth/require-auth';
import type { UploadedFile } from '../common/http';
import {
  NotFoundException,
  UnauthorizedException,
} from '../common/http-errors';
import { DEFAULT_THROTTLE, PUBLIC_READ_THROTTLE } from '../common/throttle';
import { testApp } from '../common/test-app';
import type { BlogContentImagesService } from './blog-content-images.service';
import { blogRoutes } from './blog.routes';
import type { BlogService } from './blog.service';

const ID = '11111111-1111-4111-8111-111111111111';
const POST = { id: ID, slug: 'mon-article', title: 'Mon article' };
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);
const VALID = {
  title: 'Titre',
  excerpt: 'Résumé',
  contentMarkdown: '# Corps',
};

const form = (bytes: Buffer, filename = 'a.png', type = 'image/png') => {
  const body = new FormData();
  body.append('file', new File([new Uint8Array(bytes)], filename, { type }));
  return body;
};

describe('blog routes (HTTP)', () => {
  const blog = {
    findAllPublished: jest.fn(),
    findAllForAdmin: jest.fn(),
    findBySlug: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    uploadCoverImage: jest.fn(),
    like: jest.fn(),
  };
  const passThrough: RequireAuth = async (_c, next) => {
    await next();
  };
  const denied: RequireAuth = () => {
    throw new UnauthorizedException();
  };
  const build = (auth: RequireAuth) =>
    testApp(
      '/api/blog',
      blogRoutes(
        blog as unknown as BlogService,
        {} as BlogContentImagesService,
        auth,
      ),
    );
  let app = build(passThrough);

  beforeEach(() => {
    jest.clearAllMocks();
    app = build(passThrough);
  });

  // Une IP par requête : les quotas par route ne doivent pas fausser les cas fonctionnels.
  let ip = 0;
  const call = (
    path: string,
    init: RequestInit & { json?: unknown } = {},
    target = app,
  ) => {
    const { json, ...rest } = init;
    const headers: Record<string, string> = {
      'x-forwarded-for': `198.51.100.${(ip = (ip % 250) + 1)}`,
    };
    if (json !== undefined) headers['content-type'] = 'application/json';
    return target.request(`/api/blog${path}`, {
      ...rest,
      headers,
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  };

  describe('public reads', () => {
    it('GET /posts lists the published posts', async () => {
      blog.findAllPublished.mockResolvedValueOnce([POST]);
      const res = await call('/posts');
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual([POST]);
    });

    it('GET /posts/:slug returns the post, 404 when the service throws', async () => {
      blog.findBySlug.mockResolvedValueOnce(POST);
      const ok = await call('/posts/mon-article');
      expect(ok.status).toBe(200);
      expect(await ok.json()).toEqual(POST);
      expect(blog.findBySlug).toHaveBeenCalledWith('mon-article');

      blog.findBySlug.mockRejectedValueOnce(new NotFoundException('nope'));
      expect((await call('/posts/absent')).status).toBe(404);
    });

    it.each(['/posts', '/posts/mon-article'])(
      'GET %s has the public read quota (120/min)',
      async (path) => {
        blog.findAllPublished.mockResolvedValue([]);
        blog.findBySlug.mockResolvedValue(POST);
        const statuses: number[] = [];
        for (let i = 0; i <= PUBLIC_READ_THROTTLE.limit; i += 1) {
          const res = await app.request(`/api/blog${path}`, {
            headers: { 'x-forwarded-for': '192.0.2.10' },
          });
          statuses.push(res.status);
        }
        expect(statuses.at(-2)).toBe(200);
        expect(statuses.at(-1)).toBe(429);
      },
    );

    it('GET /posts/admin is not taken for a slug and requires a session', async () => {
      blog.findAllForAdmin.mockResolvedValueOnce([POST]);
      const res = await call('/posts/admin');
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual([POST]);
      expect(blog.findBySlug).not.toHaveBeenCalled();

      expect((await call('/posts/admin', {}, build(denied))).status).toBe(401);
    });
  });

  describe('like', () => {
    it('POST /posts/:slug/like is public and answers 201 with the counter', async () => {
      blog.like.mockResolvedValueOnce({ likesCount: 3 });
      const res = await call(
        '/posts/mon-article/like',
        { method: 'POST' },
        build(denied),
      );
      expect(res.status).toBe(201);
      expect(await res.json()).toEqual({ likesCount: 3 });
      expect(blog.like).toHaveBeenCalledWith('mon-article');
    });

    it('has the default quota (10/min)', async () => {
      blog.like.mockResolvedValue({ likesCount: 1 });
      const statuses: number[] = [];
      for (let i = 0; i <= DEFAULT_THROTTLE.limit; i += 1) {
        const res = await app.request('/api/blog/posts/a/like', {
          method: 'POST',
          headers: { 'x-forwarded-for': '192.0.2.20' },
        });
        statuses.push(res.status);
      }
      expect(statuses.at(-2)).toBe(201);
      expect(statuses.at(-1)).toBe(429);
    });
  });

  describe('admin writes', () => {
    it.each([
      ['POST', '/posts'],
      ['PATCH', `/posts/${ID}`],
      ['DELETE', `/posts/${ID}`],
      ['POST', `/posts/${ID}/image`],
    ])('%s %s requires a session', async (method, path) => {
      const res = await call(path, { method, json: VALID }, build(denied));
      expect(res.status).toBe(401);
    });

    it('POST /posts creates and answers 201', async () => {
      blog.create.mockResolvedValueOnce(POST);
      const res = await call('/posts', { method: 'POST', json: VALID });
      expect(res.status).toBe(201);
      expect(await res.json()).toEqual(POST);
      expect(blog.create).toHaveBeenCalledWith(expect.objectContaining(VALID));
    });

    it('POST /posts rejects an invalid or unknown field with 400', async () => {
      expect(
        (await call('/posts', { method: 'POST', json: { title: '' } })).status,
      ).toBe(400);
      expect(
        (await call('/posts', { method: 'POST', json: { ...VALID, x: 1 } }))
          .status,
      ).toBe(400);
      expect(blog.create).not.toHaveBeenCalled();
    });

    it('PATCH /posts/:id updates with a partial body, coverImage null allowed', async () => {
      blog.update.mockResolvedValueOnce(POST);
      const res = await call(`/posts/${ID}`, {
        method: 'PATCH',
        json: { title: 'Nouveau', coverImage: null },
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(POST);
      expect(blog.update).toHaveBeenCalledWith(
        ID,
        expect.objectContaining({ title: 'Nouveau', coverImage: null }),
      );
    });

    it('PATCH /posts/:id rejects a non-UUID id and a non-null coverImage with 400', async () => {
      expect(
        (await call('/posts/not-a-uuid', { method: 'PATCH', json: {} })).status,
      ).toBe(400);
      expect(
        (
          await call(`/posts/${ID}`, {
            method: 'PATCH',
            json: { coverImage: 'x.png' },
          })
        ).status,
      ).toBe(400);
      expect(blog.update).not.toHaveBeenCalled();
    });

    it('DELETE /posts/:id answers 204 without body', async () => {
      blog.remove.mockResolvedValueOnce(undefined);
      const res = await call(`/posts/${ID}`, { method: 'DELETE' });
      expect(res.status).toBe(204);
      expect(await res.text()).toBe('');
      expect(blog.remove).toHaveBeenCalledWith(ID);
      expect(
        (await call('/posts/not-a-uuid', { method: 'DELETE' })).status,
      ).toBe(400);
    });
  });

  describe('cover image upload', () => {
    it('Given an image, When posted, Then 201 with the updated post', async () => {
      blog.uploadCoverImage.mockResolvedValueOnce(POST);
      const res = await call(`/posts/${ID}/image`, {
        method: 'POST',
        body: form(PNG),
      });
      expect(res.status).toBe(201);
      expect(await res.json()).toEqual(POST);
      const [id, file] = blog.uploadCoverImage.mock.calls[0] as [
        string,
        UploadedFile,
      ];
      expect(id).toBe(ID);
      expect(file.buffer).toEqual(PNG);
      expect(file.mimetype).toBe('image/png');
    });

    it('Given a PDF or no file, When posted, Then 422', async () => {
      const pdf = await call(`/posts/${ID}/image`, {
        method: 'POST',
        body: form(Buffer.from('%PDF'), 'a.pdf', 'application/pdf'),
      });
      expect(pdf.status).toBe(422);
      expect(
        (await call(`/posts/${ID}/image`, { method: 'POST' })).status,
      ).toBe(422);
      expect(blog.uploadCoverImage).not.toHaveBeenCalled();
    });

    it('Given a file over 4 MB, When posted, Then 413, even before the id check', async () => {
      const big = form(Buffer.alloc(4 * 1024 * 1024 + 1));
      expect(
        (await call(`/posts/${ID}/image`, { method: 'POST', body: big }))
          .status,
      ).toBe(413);
      const bigAgain = form(Buffer.alloc(4 * 1024 * 1024 + 1));
      expect(
        (await call('/posts/bad/image', { method: 'POST', body: bigAgain }))
          .status,
      ).toBe(413);
      expect(blog.uploadCoverImage).not.toHaveBeenCalled();
    });

    it('Given a non-UUID id, When posted without file, Then 400 before the file check', async () => {
      const res = await call('/posts/bad/image', { method: 'POST' });
      expect(res.status).toBe(400);
    });
  });
});
