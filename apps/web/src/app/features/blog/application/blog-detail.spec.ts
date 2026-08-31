import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { BlogDetail } from './blog-detail';
import { BlogGateway } from '../domain/gateways/blog.gateway';
import { Seo } from '@shared/seo/seo';
import type { BlogPost } from '../domain/models/blog-post.model';

function post(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    id: '1', title: 'Mon article', slug: 'mon-article', excerpt: 'Résumé',
    contentMarkdown: '# Bonjour', coverImage: 'https://x.test/img.webp', tags: ['Angular'],
    status: 'published', likesCount: 2, publishedAt: '2026-08-31T00:00:00Z', ...overrides,
  };
}

function setup(gatewayStub: { getPostBySlug: () => ReturnType<BlogGateway['getPostBySlug']> }) {
  const seoMock = { applySeoData: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: BlogGateway, useValue: gatewayStub },
      { provide: Seo, useValue: seoMock },
    ],
  });
  const fixture: ComponentFixture<BlogDetail> = TestBed.createComponent(BlogDetail);
  return { fixture, seoMock };
}

describe('BlogDetail', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('rend le contenu Markdown en HTML', async () => {
    const { fixture } = setup({ getPostBySlug: () => of(post()) });
    fixture.componentRef.setInput('slug', 'mon-article');
    fixture.detectChanges();
    await fixture.whenStable(); // `resource()` charge de façon async, même si l'Observable sous-jacent est synchrone (of()).
    fixture.detectChanges();
    const html = fixture.nativeElement.querySelector('[data-testid="blog-content"]').innerHTML as string;
    expect(html).toContain('<h1>Bonjour</h1>');
  });

  it('redirige vers /blog si le slug est introuvable (404)', async () => {
    const { fixture } = setup({ getPostBySlug: () => throwError(() => new Error('404')) });
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');
    fixture.componentRef.setInput('slug', 'inconnu');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(navigateSpy).toHaveBeenCalledWith(['/blog']);
  });

  it('applique le SEO avec les données de l\'article (title, description, image, JSON-LD BlogPosting)', async () => {
    const { fixture, seoMock } = setup({ getPostBySlug: () => of(post()) });
    fixture.componentRef.setInput('slug', 'mon-article');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(seoMock.applySeoData).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('Mon article'),
        description: 'Résumé',
        image: 'https://x.test/img.webp',
        type: 'article',
        structuredData: expect.objectContaining({ '@type': 'BlogPosting' }),
      }),
    );
  });
});
