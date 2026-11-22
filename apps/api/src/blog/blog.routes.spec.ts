import type { RequireAuth } from '../auth/require-auth';
import type { UploadedFile } from '../common/http';
import { ConflictException, NotFoundException } from '../common/http-errors';
import { PUBLIC_READ_THROTTLE } from '../common/throttle';
import { testApp } from '../testing/test-app';
import type { BlogContentImagesService } from './blog-content-images.service';
import { blogRoutes } from './blog.routes';
import type { BlogService } from './blog.service';
import { fileForm } from '../testing/multipart';
import { denyAll, passThrough } from '../testing/require-auth';
import { BlogCommentsService } from '../blog-comments/blog-comments.service';
import { MemoryCommentStore } from '../testing/memory-comment-store';

const ID = '11111111-1111-4111-8111-111111111111';
const POST = {
  id: ID,
  slug: 'mon-article',
  title: 'Mon article',
  version: 4,
};
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);
const VALID = {
  title: 'Titre',
  excerpt: 'Résumé',
  contentMarkdown: '# Corps',
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
  const build = (auth: RequireAuth) =>
    testApp(
      '/api/blog',
      blogRoutes(
        blog as unknown as BlogService,
        {} as BlogContentImagesService,
        new BlogCommentsService(
          new MemoryCommentStore(),
          { sendMail: () => Promise.resolve() },
          () => 'sender',
        ),
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
    init: Omit<RequestInit, 'headers'> & {
      json?: unknown;
      headers?: Readonly<Record<string, string>>;
    } = {},
    target = app,
  ) => {
    const { json, headers: extraHeaders, ...rest } = init;
    const headers: Record<string, string> = {
      'x-forwarded-for': `198.51.100.${(ip = (ip % 250) + 1)}`,
      ...extraHeaders,
    };
    if (json !== undefined) headers['content-type'] = 'application/json';
    return target.request(`/api/blog${path}`, {
      ...rest,
      headers,
      ...(json !== undefined ? { body: JSON.stringify(json) } : {}),
    });
  };

  describe('comments', () => {
    it('Given the blog routes, When a comment is sent to an unknown post, Then the comment routes answer, beside the post routes', async () => {
      const res = await call('/posts/inconnu/comments', {
        method: 'POST',
        json: { name: 'Camille', email: 'camille@example.test', body: 'Merci' },
      });

      expect(res.status).toBe(404);
      expect(await res.json()).toMatchObject({
        message: 'Article introuvable.',
      });
    });
  });

  describe('public reads', () => {
    it('GET /posts leaves out the Markdown body but keeps its word count', async () => {
      blog.findAllPublished.mockResolvedValueOnce([
        { ...POST, contentMarkdown: '# Corps', wordCount: 900 },
      ]);
      const [post] = (await (await call('/posts')).json()) as Record<
        string,
        unknown
      >[];
      expect(post).not.toHaveProperty('contentMarkdown');
      expect(post).toMatchObject({
        slug: POST.slug,
        wordCount: 900,
        version: 4,
      });
    });

    it('GET /posts?include=content keeps the Markdown body, for the RSS feed', async () => {
      blog.findAllPublished.mockResolvedValueOnce([
        { ...POST, contentMarkdown: '# Corps', wordCount: 900 },
      ]);
      const [post] = (await (
        await call('/posts?include=content')
      ).json()) as Record<string, unknown>[];
      expect(post).toMatchObject({ contentMarkdown: '# Corps' });
    });

    it('GET /posts/:slug returns the post, 404 when the service throws', async () => {
      blog.findBySlug.mockResolvedValueOnce(POST);
      const ok = await call('/posts/mon-article');
      expect(ok.status).toBe(200);
      expect(await ok.json()).toEqual(POST);
      expect(blog.findBySlug).toHaveBeenCalledWith('mon-article');
      expect(ok.headers.get('etag')).toBe('"4"');

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

      expect((await call('/posts/admin', {}, build(denyAll))).status).toBe(401);
    });
  });

  describe('like', () => {
    it('POST /posts/:slug/like is public and answers 201 with the counter', async () => {
      blog.like.mockResolvedValueOnce({ likesCount: 3 });
      const res = await call(
        '/posts/mon-article/like',
        { method: 'POST' },
        build(denyAll),
      );
      expect(res.status).toBe(201);
      expect(await res.json()).toEqual({ likesCount: 3 });
      expect(blog.like).toHaveBeenCalledWith('mon-article');
    });
  });

  describe('admin writes', () => {
    it.each([
      ['POST', '/posts'],
      ['PATCH', `/posts/${ID}`],
      ['DELETE', `/posts/${ID}`],
      ['POST', `/posts/${ID}/image`],
    ])('%s %s requires a session', async (method, path) => {
      const res = await call(path, { method, json: VALID }, build(denyAll));
      expect(res.status).toBe(401);
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
        undefined,
      );
    });

    it('Given If-Match "3", When PATCH /posts/:id, Then the service expects version 3 and the response carries the new ETag', async () => {
      blog.update.mockResolvedValueOnce(POST);
      const res = await call(`/posts/${ID}`, {
        method: 'PATCH',
        json: { title: 'Nouveau' },
        headers: { 'if-match': '"3"' },
      });

      expect(res.status).toBe(200);
      expect(res.headers.get('etag')).toBe('"4"');
      expect(blog.update).toHaveBeenCalledWith(ID, { title: 'Nouveau' }, 3);
    });

    it('Given a malformed If-Match, When PATCH /posts/:id, Then 400 without calling the service', async () => {
      const res = await call(`/posts/${ID}`, {
        method: 'PATCH',
        json: { title: 'Nouveau' },
        headers: { 'if-match': 'W/"3"' },
      });

      expect(res.status).toBe(400);
      expect(blog.update).not.toHaveBeenCalled();
    });

    it('Given a stale version, When PATCH /posts/:id, Then the service 409 is returned in the API error format', async () => {
      blog.update.mockRejectedValueOnce(
        new ConflictException('Version périmée'),
      );
      const res = await call(`/posts/${ID}`, {
        method: 'PATCH',
        json: { title: 'Nouveau' },
        headers: { 'if-match': '"3"' },
      });

      expect(res.status).toBe(409);
      expect(await res.json()).toMatchObject({
        statusCode: 409,
        message: 'Version périmée',
      });
    });

    it('Given a created post, When POST /posts, Then 201 with its version as ETag', async () => {
      blog.create.mockResolvedValueOnce({ ...POST, version: 1 });
      const res = await call('/posts', { method: 'POST', json: VALID });

      expect(res.status).toBe(201);
      expect(res.headers.get('etag')).toBe('"1"');
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
  });

  describe('cover image upload', () => {
    it('Given an image, When posted, Then 201 with the updated post', async () => {
      blog.uploadCoverImage.mockResolvedValueOnce(POST);
      const res = await call(`/posts/${ID}/image`, {
        method: 'POST',
        body: fileForm(PNG),
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

    it('Given If-Match "4", When a cover is posted, Then the service expects version 4 and the new ETag is returned', async () => {
      blog.uploadCoverImage.mockResolvedValueOnce({ ...POST, version: 5 });
      const res = await call(`/posts/${ID}/image`, {
        method: 'POST',
        body: fileForm(PNG),
        headers: { 'if-match': '"4"' },
      });

      expect(res.status).toBe(201);
      expect(res.headers.get('etag')).toBe('"5"');
      expect(blog.uploadCoverImage).toHaveBeenCalledWith(
        ID,
        expect.objectContaining({ buffer: PNG }),
        4,
      );
    });

    it('Given a malformed If-Match, When a cover is posted, Then 400 without calling the service', async () => {
      const res = await call(`/posts/${ID}/image`, {
        method: 'POST',
        body: fileForm(PNG),
        headers: { 'if-match': '"x"' },
      });

      expect(res.status).toBe(400);
      expect(blog.uploadCoverImage).not.toHaveBeenCalled();
    });

    it('Given a PDF or no file, When posted, Then 422', async () => {
      const pdf = await call(`/posts/${ID}/image`, {
        method: 'POST',
        body: fileForm(Buffer.from('%PDF'), 'a.pdf', 'application/pdf'),
      });
      expect(pdf.status).toBe(422);
      expect(
        (await call(`/posts/${ID}/image`, { method: 'POST' })).status,
      ).toBe(422);
      expect(blog.uploadCoverImage).not.toHaveBeenCalled();
    });

    it('Given a file over 4 MB, When posted, Then 413, even before the id check', async () => {
      const big = fileForm(Buffer.alloc(4 * 1024 * 1024 + 1));
      expect(
        (await call(`/posts/${ID}/image`, { method: 'POST', body: big }))
          .status,
      ).toBe(413);
      const bigAgain = fileForm(Buffer.alloc(4 * 1024 * 1024 + 1));
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
