import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, afterEach } from 'vitest';
import { HttpBlogGateway } from './http-blog.gateway';
import { API_BASE_URL } from '@shared/api/api-config';
import type { BlogPost } from '../domain/models/blog-post.model';

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
