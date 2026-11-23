import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom, of, throwError, type Observable } from 'rxjs';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { HttpBlogGateway } from './http-blog.gateway';
import { API_BASE_URL } from '@shared/api/api-config';
import { provideImageUploadPreparer } from '@shared/testing/image-upload-preparer';
import { UploadRejectedError } from '@shared/upload/upload-rejected-error';
import type { ImageUploadPreparer } from '@shared/upload/image-upload-preparer';
import { errorToastInterceptor } from '@core/interceptors/error-toast';
import { ToastStore } from '@core/notifications/toast-store';
import type { BlogPost, BlogPostInput, BlogPostSummary } from '../domain/models/blog-post.model';
import { makeBlogPost } from '../testing/blog-post-builders';
import { countWords } from '../domain/reading-time';

const BASE = 'https://api.test';

function configure(preparer?: ImageUploadPreparer): {
  gateway: HttpBlogGateway;
  httpMock: HttpTestingController;
} {
  TestBed.configureTestingModule({
    providers: [
      HttpBlogGateway,
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: BASE },
      provideImageUploadPreparer(preparer),
    ],
  });
  return {
    gateway: TestBed.inject(HttpBlogGateway),
    httpMock: TestBed.inject(HttpTestingController),
  };
}

function post(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    id: 'id-1',
    title: 'Mon article',
    slug: 'mon-article',
    excerpt: 'Résumé',
    contentMarkdown: '# Titre',
    coverImage: '',
    tags: [],
    status: 'published',
    likesCount: 0,
    publishedAt: '2026-08-31T00:00:00Z',
    updatedAt: '2026-08-31T00:00:00Z',
    version: 1,
    wordCount: countWords(overrides.contentMarkdown ?? '# Titre'),
    ...overrides,
  };
}

describe('HttpBlogGateway', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe.each<{
    reader: string;
    url: string;
    list: boolean;
    read: (gateway: HttpBlogGateway) => Observable<BlogPostSummary | readonly BlogPostSummary[]>;
  }>([
    {
      reader: 'the published list',
      url: `${BASE}/blog/posts`,
      list: true,
      read: (g): Observable<BlogPostSummary | readonly BlogPostSummary[]> => g.getPublishedPosts(),
    },
    {
      reader: 'the article',
      url: `${BASE}/blog/posts/mon-article`,
      list: false,
      read: (g): Observable<BlogPostSummary | readonly BlogPostSummary[]> =>
        g.getPostBySlug('mon-article'),
    },
    {
      reader: 'the admin list',
      url: `${BASE}/blog/posts/admin`,
      list: true,
      read: (g): Observable<BlogPostSummary | readonly BlogPostSummary[]> =>
        g.getAllPostsForAdmin(),
    },
  ])('couverture lue par $reader', ({ url, list, read }) => {
    it.each([
      {
        case: 'a key stored by the API',
        cover: '/storage/portfolio-storage/blog/id-1-0a1b2c3d.avif',
        expected: '/api/storage/portfolio-storage/blog/id-1-0a1b2c3d.avif',
      },
      {
        case: 'an absolute address',
        cover: 'https://cdn.test/blog/id-1.avif',
        expected: 'https://cdn.test/blog/id-1.avif',
      },
      { case: 'no cover', cover: '', expected: '' },
    ])(
      'Given $case When the post is read Then its cover is $expected',
      async ({ cover, expected }) => {
        const { gateway, httpMock } = configure();
        const row = makeBlogPost({ coverImage: cover });

        const promise = firstValueFrom(read(gateway));
        httpMock.expectOne(url).flush(list ? [row] : row);

        const result = await promise;
        expect((Array.isArray(result) ? result : [result]).map((p) => p.coverImage)).toEqual([
          expected,
        ]);
        httpMock.verify();
      },
    );
  });

  it('getPostBySlug appelle /blog/posts/:slug', async () => {
    const { gateway, httpMock } = configure();

    const promise = firstValueFrom(gateway.getPostBySlug('mon-article'));

    httpMock.expectOne(`${BASE}/blog/posts/mon-article`).flush(post());

    const p = await promise;
    expect(p.slug).toBe('mon-article');
    httpMock.verify();
  });

  it('likePost POST vers /blog/posts/:slug/like', async () => {
    const { gateway, httpMock } = configure();

    const promise = firstValueFrom(gateway.likePost('mon-article'));

    const req = httpMock.expectOne(`${BASE}/blog/posts/mon-article/like`);
    expect(req.request.method).toBe('POST');
    req.flush({ likesCount: 1 });

    const res = await promise;
    expect(res.likesCount).toBe(1);
    httpMock.verify();
  });

  it('Given a slug that climbs the path When the article is read Then it stays one segment under /blog/posts', () => {
    const { gateway, httpMock } = configure();

    gateway.getPostBySlug('../../projects').subscribe();

    const req = httpMock.expectOne(`${BASE}/blog/posts/..%2F..%2Fprojects`);
    expect(req.request.method).toBe('GET');
    req.flush(post());
    httpMock.verify();
  });

  it('Given a slug that climbs the path When the article is liked Then it stays one segment under /blog/posts', () => {
    const { gateway, httpMock } = configure();

    gateway.likePost('../../projects').subscribe();

    const req = httpMock.expectOne(`${BASE}/blog/posts/..%2F..%2Fprojects/like`);
    expect(req.request.method).toBe('POST');
    req.flush({ likesCount: 1 });
    httpMock.verify();
  });
});

describe('HttpBlogGateway: images du corps', () => {
  const KEY = '3f2c1a9e-8b7d-4c6e-9f10-2a3b4c5d6e7f-a1b2c3d4-1600x900.avif';

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('Given a body image When it is uploaded Then the file alone is posted as multipart « file », with no article id', async () => {
    const { gateway, httpMock } = configure();
    const file = new File(['png'], 'schema.png', { type: 'image/png' });

    const promise = firstValueFrom(gateway.uploadContentImage(file));
    const request = httpMock.expectOne(`${BASE}/blog/content-images`);
    const body = request.request.body;
    const sent = {
      method: request.request.method,
      isFormData: body instanceof FormData,
      fields: body instanceof FormData ? [...body.keys()] : [],
      file: body instanceof FormData ? body.get('file') === file : false,
    };
    request.flush(
      { url: `/storage/portfolio-storage/blog-content/${KEY}`, width: 1600, height: 900 },
      { status: 201, statusText: 'Created' },
    );
    await promise;

    expect(sent).toEqual({ method: 'POST', isFormData: true, fields: ['file'], file: true });
    httpMock.verify();
  });

  it.each([
    {
      case: 'a relative address',
      url: `/storage/portfolio-storage/blog-content/${KEY}`,
      resolved: `/api/storage/portfolio-storage/blog-content/${KEY}`,
    },
    {
      case: 'an absolute address',
      url: `https://cdn.test/blog-content/${KEY}`,
      resolved: `https://cdn.test/blog-content/${KEY}`,
    },
  ])(
    'Given the API answers 201 with $case When the image is uploaded Then the caller receives the address served from the site and the size',
    async ({ url, resolved }) => {
      const { gateway, httpMock } = configure();

      const promise = firstValueFrom(
        gateway.uploadContentImage(new File(['png'], 'schema.png', { type: 'image/png' })),
      );
      httpMock
        .expectOne(`${BASE}/blog/content-images`)
        .flush({ url, width: 1600, height: 900 }, { status: 201, statusText: 'Created' });

      expect(await promise).toEqual({ url: resolved, width: 1600, height: 900 });
      httpMock.verify();
    },
  );

  it.each([413, 422])(
    'Given the API refuses the image with %i When it is uploaded Then the caller receives that status',
    async (status) => {
      const { gateway, httpMock } = configure();

      const outcome = firstValueFrom(
        gateway.uploadContentImage(new File(['png'], 'schema.png', { type: 'image/png' })),
      ).then(
        () => null,
        (error: unknown) => (error instanceof HttpErrorResponse ? error.status : -1),
      );
      httpMock
        .expectOne(`${BASE}/blog/content-images`)
        .flush(null, { status, statusText: 'Refused' });

      expect(await outcome).toBe(status);
      httpMock.verify();
    },
  );
});

describe('HttpBlogGateway: liste admin partagée', () => {
  const ADMIN_URL = `${BASE}/blog/posts/admin`;
  const UNAVAILABLE = { status: 503, statusText: 'Unavailable' };

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('Given a first reader of the admin list When a second one arrives Then no new request is made', async () => {
    const { gateway, httpMock } = configure();
    const first = firstValueFrom(gateway.getAllPostsForAdmin());
    httpMock.expectOne(ADMIN_URL).flush([makeBlogPost({ id: 'a-1' })]);
    await first;

    const second = firstValueFrom(gateway.getAllPostsForAdmin());
    const extra = httpMock.match(ADMIN_URL);
    extra.forEach((request) => request.flush([makeBlogPost({ id: 'a-2' })]));

    expect({
      extraRequests: extra.length,
      second: (await second).map((post) => post.id),
    }).toEqual({ extraRequests: 0, second: ['a-1'] });
    httpMock.verify();
  });

  it('Given a live reader When the admin list is invalidated Then it is requested again and pushed to the reader', () => {
    const { gateway, httpMock } = configure();
    const seen: string[][] = [];
    const subscription = gateway
      .getAllPostsForAdmin()
      .subscribe((posts) => seen.push(posts.map((post) => post.id)));
    httpMock.expectOne(ADMIN_URL).flush([makeBlogPost({ id: 'a-1' })]);

    gateway.invalidateAdminPosts();
    const again = httpMock.match(ADMIN_URL);
    again.forEach((request) =>
      request.flush([makeBlogPost({ id: 'a-1' }), makeBlogPost({ id: 'a-2' })]),
    );

    expect({ requests: again.length, seen }).toEqual({
      requests: 1,
      seen: [['a-1'], ['a-1', 'a-2']],
    });
    subscription.unsubscribe();
    httpMock.verify();
  });

  it('Given the admin list fails twice When a new reader arrives Then the failure was retried once, not kept, and the list is requested again', async () => {
    const { gateway, httpMock } = configure();
    const failed = firstValueFrom(gateway.getAllPostsForAdmin()).then(
      () => 'ok',
      () => 'error',
    );
    httpMock.expectOne(ADMIN_URL).flush('boom', UNAVAILABLE);
    const retries = httpMock.match(ADMIN_URL);
    retries.forEach((request) => request.flush('boom', UNAVAILABLE));
    const outcome = await failed;

    const recovered = firstValueFrom(gateway.getAllPostsForAdmin());
    httpMock
      .expectOne(ADMIN_URL)
      .flush([makeBlogPost({ id: 'a-1', coverImage: '/storage/portfolio-storage/blog/a.avif' })]);

    expect({
      retries: retries.length,
      outcome,
      recovered: (await recovered).map((post) => post.coverImage),
    }).toEqual({
      retries: 1,
      outcome: 'error',
      recovered: ['/api/storage/portfolio-storage/blog/a.avif'],
    });
    httpMock.verify();
  });
});

describe('HttpBlogGateway: écritures de l’admin derrière l’intercepteur de toasts', () => {
  const add = vi.fn();

  function configureWithToasts(): {
    gateway: HttpBlogGateway;
    httpController: HttpTestingController;
  } {
    add.mockClear();
    TestBed.configureTestingModule({
      providers: [
        HttpBlogGateway,
        provideHttpClient(withInterceptors([errorToastInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
        { provide: ToastStore, useValue: { add } },
        provideImageUploadPreparer(),
      ],
    });
    return {
      gateway: TestBed.inject(HttpBlogGateway),
      httpController: TestBed.inject(HttpTestingController),
    };
  }

  async function toastsOnFailure(
    request: Observable<unknown>,
    httpController: HttpTestingController,
    method: string,
    url: string,
  ): Promise<{ status: number | null; toasts: number }> {
    const outcome = firstValueFrom(request).then(
      () => null,
      (error: unknown) => (error instanceof HttpErrorResponse ? error.status : -1),
    );
    httpController
      .expectOne({ method, url })
      .flush(null, { status: 500, statusText: 'Server Error' });
    return { status: await outcome, toasts: add.mock.calls.length };
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  const INPUT: BlogPostInput = {
    title: 'Mon article',
    excerpt: 'Résumé',
    contentMarkdown: '# Titre',
    tags: [],
    status: 'draft',
  };

  it.each<{
    write: string;
    method: string;
    url: string;
    call: (gateway: HttpBlogGateway) => Observable<unknown>;
  }>([
    {
      write: 'createPost',
      method: 'POST',
      url: `${BASE}/blog/posts`,
      call: (g): Observable<unknown> => g.createPost(INPUT),
    },
    {
      write: 'updatePost',
      method: 'PATCH',
      url: `${BASE}/blog/posts/b-1`,
      call: (g): Observable<unknown> => g.updatePost('b-1', { title: 'X' }),
    },
    {
      write: 'deletePost',
      method: 'DELETE',
      url: `${BASE}/blog/posts/b-1`,
      call: (g): Observable<unknown> => g.deletePost('b-1'),
    },
    {
      write: 'uploadCoverImage',
      method: 'POST',
      url: `${BASE}/blog/posts/b-1/image`,
      call: (g): Observable<unknown> =>
        g.uploadCoverImage(new File(['x'], 'cover.png', { type: 'image/png' }), 'b-1'),
    },
    {
      write: 'uploadContentImage',
      method: 'POST',
      url: `${BASE}/blog/content-images`,
      call: (g): Observable<unknown> =>
        g.uploadContentImage(new File(['x'], 'schema.png', { type: 'image/png' })),
    },
  ])(
    'Given the API answers 500 When $write is called Then no toast is shown and the caller still receives the error',
    async ({ method, url, call }) => {
      const { gateway, httpController } = configureWithToasts();

      expect(await toastsOnFailure(call(gateway), httpController, method, url)).toEqual({
        status: 500,
        toasts: 0,
      });
      httpController.verify();
    },
  );

  it('Given a visitor likes a post When the API answers 500 Then the interceptor still shows its toast', async () => {
    const { gateway, httpController } = configureWithToasts();

    expect(
      await toastsOnFailure(
        gateway.likePost('mon-article'),
        httpController,
        'POST',
        `${BASE}/blog/posts/mon-article/like`,
      ),
    ).toEqual({ status: 500, toasts: 1 });
    httpController.verify();
  });

  it('Given the admin list shown When its reread fails, retry included Then no toast is shown', () => {
    const { gateway, httpController } = configureWithToasts();
    const sub = gateway.getAllPostsForAdmin().subscribe();
    httpController.expectOne(`${BASE}/blog/posts/admin`).flush([makeBlogPost()]);

    gateway.invalidateAdminPosts();
    httpController
      .expectOne(`${BASE}/blog/posts/admin`)
      .flush(null, { status: 500, statusText: 'Server Error' });
    httpController
      .expectOne(`${BASE}/blog/posts/admin`)
      .flush(null, { status: 500, statusText: 'Server Error' });

    expect(add.mock.calls.length).toBe(0);
    sub.unsubscribe();
    httpController.verify();
  });

  it.each([
    { mode: 'a background reread', background: true, toasts: 0 },
    { mode: 'a first read', background: false, toasts: 1 },
  ])(
    'Given $mode of the published posts When it fails Then $toasts toast(s) are shown',
    async ({ background, toasts }) => {
      const { gateway, httpController } = configureWithToasts();

      const read = firstValueFrom(gateway.getPublishedPosts({ background })).catch(() => null);
      httpController
        .expectOne(`${BASE}/blog/posts`)
        .flush(null, { status: 500, statusText: 'Server Error' });
      await read;

      expect(add.mock.calls.length).toBe(toasts);
      httpController.verify();
    },
  );
});

describe('HttpBlogGateway: image preparation before upload', () => {
  const original = new File(['huge'], 'photo.png', { type: 'image/png' });
  const prepared = new File(['small'], 'photo.webp', { type: 'image/webp' });
  const uploads: readonly {
    readonly write: string;
    readonly url: string;
    readonly call: (gateway: HttpBlogGateway, file: File) => Observable<unknown>;
  }[] = [
    {
      write: 'uploadCoverImage',
      url: `${BASE}/blog/posts/b-1/image`,
      call: (gateway, file) => gateway.uploadCoverImage(file, 'b-1'),
    },
    {
      write: 'uploadContentImage',
      url: `${BASE}/blog/content-images`,
      call: (gateway, file) => gateway.uploadContentImage(file),
    },
  ];

  it.each(uploads)(
    'Given the preparer shrinks the image When $write is called Then the prepared file is the one posted',
    async ({ url, call }) => {
      const { gateway, httpMock } = configure((file) => of(file === original ? prepared : file));

      const outcome = firstValueFrom(call(gateway, original)).catch(() => null);
      const request = httpMock.expectOne(url);
      const body = request.request.body as FormData;
      request.flush({}, { status: 500, statusText: 'Ignored' });
      await outcome;

      expect(body.get('file')).toBe(prepared);
      httpMock.verify();
    },
  );

  it.each(uploads)(
    'Given the preparer refuses the image When $write is called Then the refusal reaches the caller and nothing is sent',
    async ({ call }) => {
      const refusal = new UploadRejectedError("L'image dépasse 4\u00a0Mo, même compressée.");
      const { gateway, httpMock } = configure(() => throwError(() => refusal));

      const failure = await firstValueFrom(call(gateway, original)).catch(
        (error: unknown) => error,
      );

      expect(failure).toBe(refusal);
      httpMock.verify();
    },
  );
});

describe('HttpBlogGateway: the admin list follows the writes', () => {
  const ADMIN_LIST_URL = `${BASE}/blog/posts/admin`;
  const COVER = new File(['x'], 'cover.png', { type: 'image/png' });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  const writes: readonly {
    readonly write: string;
    readonly url: string;
    readonly answer: object | null;
    readonly call: (gateway: HttpBlogGateway) => Observable<unknown>;
  }[] = [
    {
      write: 'createPost',
      url: `${BASE}/blog/posts`,
      answer: makeBlogPost({ id: 'p-1' }),
      call: (g) =>
        g.createPost({ title: 'X', excerpt: 'R', contentMarkdown: '#', tags: [], status: 'draft' }),
    },
    {
      write: 'updatePost',
      url: `${BASE}/blog/posts/p-1`,
      answer: makeBlogPost({ id: 'p-1' }),
      call: (g) => g.updatePost('p-1', { title: 'X' }),
    },
    {
      write: 'deletePost',
      url: `${BASE}/blog/posts/p-1`,
      answer: null,
      call: (g) => g.deletePost('p-1'),
    },
    {
      write: 'uploadCoverImage',
      url: `${BASE}/blog/posts/p-1/image`,
      answer: { key: 'k' },
      call: (g) => g.uploadCoverImage(COVER, 'p-1'),
    },
    {
      write: 'likePost',
      url: `${BASE}/blog/posts/mon-article/like`,
      answer: { likesCount: 3 },
      call: (g) => g.likePost('mon-article'),
    },
  ];

  it.each(writes)(
    'Given the admin list is shown When $write succeeds Then the list is read again and its readers receive it',
    async ({ url, answer, call }) => {
      const { gateway, httpMock } = configure();
      const seen: string[] = [];
      const sub = gateway.getAllPostsForAdmin().subscribe((list) => seen.push(list[0]?.id ?? ''));
      httpMock.expectOne(ADMIN_LIST_URL).flush([makeBlogPost({ id: 'before' })]);

      const written = firstValueFrom(call(gateway));
      httpMock.expectOne(url).flush(answer);
      await written;
      httpMock.expectOne(ADMIN_LIST_URL).flush([makeBlogPost({ id: 'after' })]);

      expect(seen).toEqual(['before', 'after']);
      sub.unsubscribe();
      httpMock.verify();
    },
  );

  it.each(writes)(
    'Given the admin list is shown When $write fails Then the list is not read again',
    async ({ url, call }) => {
      const { gateway, httpMock } = configure();
      const sub = gateway.getAllPostsForAdmin().subscribe();
      httpMock.expectOne(ADMIN_LIST_URL).flush([makeBlogPost({ id: 'before' })]);

      const written = firstValueFrom(call(gateway)).catch(() => 'refusée');
      httpMock.expectOne(url).flush(null, { status: 500, statusText: 'Server Error' });
      await written;

      httpMock.expectNone(ADMIN_LIST_URL);
      sub.unsubscribe();
      httpMock.verify();
    },
  );
});

describe('HttpBlogGateway: un seul article de l’admin', () => {
  const ADMIN_LIST_URL = `${BASE}/blog/posts/admin`;
  const itemUrl = (id: string): string => `${BASE}/blog/posts/admin/${id}`;
  const add = vi.fn();

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  function configureWithToasts(): {
    gateway: HttpBlogGateway;
    httpMock: HttpTestingController;
  } {
    add.mockClear();
    TestBed.configureTestingModule({
      providers: [
        HttpBlogGateway,
        provideHttpClient(withInterceptors([errorToastInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
        { provide: ToastStore, useValue: { add } },
        provideImageUploadPreparer(),
      ],
    });
    return {
      gateway: TestBed.inject(HttpBlogGateway),
      httpMock: TestBed.inject(HttpTestingController),
    };
  }

  const READS = [
    {
      read: 'getAdminPost',
      call: (g: HttpBlogGateway, id: string): Observable<BlogPost | null> => g.getAdminPost(id),
      toasts: 1,
    },
    {
      read: 'getLatestAdminPost',
      call: (g: HttpBlogGateway, id: string): Observable<BlogPost | null> =>
        g.getLatestAdminPost(id),
      toasts: 0,
    },
  ] as const;

  it.each(READS)(
    'Given an article on the API When $read reads it Then only that article is requested, its cover resolved',
    async ({ call }) => {
      const { gateway, httpMock } = configureWithToasts();

      const read = firstValueFrom(call(gateway, 'a-2'));
      httpMock
        .expectOne(itemUrl('a-2'))
        .flush(makeBlogPost({ id: 'a-2', coverImage: '/storage/portfolio-storage/blog/b.avif' }));
      const found = await read;

      expect(found && { id: found.id, cover: found.coverImage }).toEqual({
        id: 'a-2',
        cover: '/api/storage/portfolio-storage/blog/b.avif',
      });
      httpMock.expectNone(ADMIN_LIST_URL);
      httpMock.verify();
    },
  );

  it.each(READS)(
    'Given an article gone from the API When $read reads it Then it is null, without a toast',
    async ({ call }) => {
      const { gateway, httpMock } = configureWithToasts();

      const read = firstValueFrom(call(gateway, 'a-9'));
      httpMock
        .expectOne(itemUrl('a-9'))
        .flush({ message: 'introuvable' }, { status: 404, statusText: 'Not Found' });

      expect({ found: await read, toasts: add.mock.calls.length }).toEqual({
        found: null,
        toasts: 0,
      });
      httpMock.verify();
    },
  );

  it.each(READS)(
    'Given the API answers 500 When $read reads an article Then the failure reaches the caller, with $toasts toast',
    async ({ call, toasts }) => {
      const { gateway, httpMock } = configureWithToasts();

      const outcome = firstValueFrom(call(gateway, 'a-1')).then(
        () => 'ok',
        () => 'error',
      );
      httpMock.expectOne(itemUrl('a-1')).flush(null, { status: 500, statusText: 'Server Error' });

      expect({ outcome: await outcome, toasts: add.mock.calls.length }).toEqual({
        outcome: 'error',
        toasts,
      });
      httpMock.verify();
    },
  );

  it('Given a live reader of the admin list When the latest version of an article is read Then the shared list is neither reread nor pushed again', async () => {
    const { gateway, httpMock } = configureWithToasts();
    const seen: string[][] = [];
    const subscription = gateway
      .getAllPostsForAdmin()
      .subscribe((posts) => seen.push(posts.map((post) => post.title)));
    httpMock.expectOne(ADMIN_LIST_URL).flush([makeBlogPost({ id: 'a-1', title: 'Avant' })]);

    const latest = firstValueFrom(gateway.getLatestAdminPost('a-1'));
    httpMock.expectOne(itemUrl('a-1')).flush(makeBlogPost({ id: 'a-1', title: 'Après' }));

    expect({ latest: (await latest)?.title, seen }).toEqual({
      latest: 'Après',
      seen: [['Avant']],
    });
    httpMock.expectNone(ADMIN_LIST_URL);
    subscription.unsubscribe();
    httpMock.verify();
  });
});

describe('HttpBlogGateway: version attendue par les écritures d’un article', () => {
  const COVER = new File(['x'], 'cover.png', { type: 'image/png' });

  afterEach(() => TestBed.resetTestingModule());

  it.each([
    {
      write: 'updatePost',
      url: `${BASE}/blog/posts/b-1`,
      call: (g: HttpBlogGateway, version?: number): Observable<unknown> =>
        g.updatePost('b-1', { title: 'X' }, version),
    },
    {
      write: 'uploadCoverImage',
      url: `${BASE}/blog/posts/b-1/image`,
      call: (g: HttpBlogGateway, version?: number): Observable<unknown> =>
        g.uploadCoverImage(COVER, 'b-1', version),
    },
  ])(
    'Given version 7 When $write is called Then the request expects it in If-Match, as a strong ETag',
    async ({ url, call }) => {
      const { gateway, httpMock } = configure();

      const done = firstValueFrom(call(gateway, 7));
      const request = httpMock.expectOne(url);
      const ifMatch = request.request.headers.get('If-Match');
      request.flush(makeBlogPost({ id: 'b-1', version: 8 }));
      await done;
      httpMock.match(`${BASE}/blog/posts/admin`);

      expect(ifMatch).toBe('"7"');
      httpMock.verify();
    },
  );

  it('Given no version When the article is updated Then no If-Match is sent', async () => {
    const { gateway, httpMock } = configure();

    const done = firstValueFrom(gateway.updatePost('b-1', { title: 'X' }));
    const request = httpMock.expectOne(`${BASE}/blog/posts/b-1`);
    const sent = request.request.headers.has('If-Match');
    request.flush(makeBlogPost({ id: 'b-1' }));
    await done;
    httpMock.match(`${BASE}/blog/posts/admin`);

    expect(sent).toBe(false);
    httpMock.verify();
  });

  it('Given the API answers 409 When the article is updated Then the refusal reaches the caller untouched', async () => {
    const { gateway, httpMock } = configure();

    const failure = firstValueFrom(gateway.updatePost('b-1', { title: 'X' }, 2)).catch(
      (error: unknown) => error,
    );
    httpMock
      .expectOne(`${BASE}/blog/posts/b-1`)
      .flush({ message: 'Version périmée' }, { status: 409, statusText: 'Conflict' });

    expect(await failure).toMatchObject({ status: 409 });
    httpMock.verify();
  });
});
