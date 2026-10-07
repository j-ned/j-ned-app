import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, afterEach } from 'vitest';
import { HttpBlogGateway } from './http-blog.gateway';
import { API_BASE_URL } from '@shared/api/api-config';
import type { BlogPost } from '../domain/models/blog-post.model';
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

  it('getPublishedPosts résout les URLs de coverImage relatives', async () => {
    const { gateway, httpMock } = configure();

    const promise = firstValueFrom(gateway.getPublishedPosts());

    const req = httpMock.expectOne(`${BASE}/blog/posts`);
    req.flush([post({ coverImage: '/blog/a.webp' })]);

    const posts = await promise;
    expect(posts[0].coverImage).toBe('https://api.test/blog/a.webp');
    httpMock.verify();
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
    httpMock.expectOne(ADMIN_URL).flush([makeBlogPost({ id: 'a-1', coverImage: '/blog/a.webp' })]);

    expect({
      retries: retries.length,
      outcome,
      recovered: (await recovered).map((post) => post.coverImage),
    }).toEqual({ retries: 1, outcome: 'error', recovered: ['https://api.test/blog/a.webp'] });
    httpMock.verify();
  });
});
