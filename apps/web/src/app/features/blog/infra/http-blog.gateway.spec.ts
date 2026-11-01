import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom, type Observable } from 'rxjs';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { HttpBlogGateway } from './http-blog.gateway';
import { API_BASE_URL } from '@shared/api/api-config';
import { errorToastInterceptor } from '@core/interceptors/error-toast';
import { ToastStore } from '@core/notifications/toast-store';
import type { BlogPost, BlogPostInput } from '../domain/models/blog-post.model';
import { makeBlogPost } from '../testing/blog-post-builders';

const BASE = 'https://api.test';

function configure(): { gateway: HttpBlogGateway; httpMock: HttpTestingController } {
  TestBed.configureTestingModule({
    providers: [
      HttpBlogGateway,
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: BASE },
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
    read: (gateway: HttpBlogGateway) => Observable<BlogPost | readonly BlogPost[]>;
  }>([
    {
      reader: 'the published list',
      url: `${BASE}/blog/posts`,
      list: true,
      read: (g): Observable<BlogPost | readonly BlogPost[]> => g.getPublishedPosts(),
    },
    {
      reader: 'the article',
      url: `${BASE}/blog/posts/mon-article`,
      list: false,
      read: (g): Observable<BlogPost | readonly BlogPost[]> => g.getPostBySlug('mon-article'),
    },
    {
      reader: 'the admin list',
      url: `${BASE}/blog/posts/admin`,
      list: true,
      read: (g): Observable<BlogPost | readonly BlogPost[]> => g.getAllPostsForAdmin(),
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
});
