import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, expect, vi, afterEach, beforeEach, type Mock } from 'vitest';
import { BlogDetail } from './blog-detail';
import { BlogGateway } from '../domain/gateways/blog.gateway';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { Seo } from '@shared/seo/seo';
import type { BlogPost } from '../domain/models/blog-post.model';

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  readonly observed: Element[] = [];
  disconnected = false;

  constructor(private readonly _callback: IntersectionObserverCallback) {
    MockIntersectionObserver.instances.push(this);
  }

  observe(element: Element): void {
    this.observed.push(element);
  }

  disconnect(): void {
    this.disconnected = true;
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  emit(isIntersecting: boolean): void {
    this._callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

function post(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    id: '1',
    title: 'Mon article',
    slug: 'mon-article',
    excerpt: 'Résumé',
    contentMarkdown: '# Bonjour',
    coverImage: 'https://x.test/img.webp',
    tags: ['Angular'],
    status: 'published',
    likesCount: 2,
    publishedAt: '2026-08-31T00:00:00Z',
    updatedAt: '2026-08-31T00:00:00Z',
    ...overrides,
  };
}

type Setup = {
  readonly fixture: ComponentFixture<BlogDetail>;
  readonly seoMock: { readonly applySeoData: Mock };
  readonly analyticsMock: { readonly trackArticleView: Mock; readonly trackArticleRead: Mock };
};

function setup(gatewayStub: {
  getPostBySlug: () => ReturnType<BlogGateway['getPostBySlug']>;
}): Setup {
  const seoMock = { applySeoData: vi.fn() };
  const analyticsMock = { trackArticleView: vi.fn(), trackArticleRead: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: BlogGateway, useValue: gatewayStub },
      { provide: Seo, useValue: seoMock },
      { provide: AnalyticsGateway, useValue: analyticsMock },
    ],
  });
  const fixture: ComponentFixture<BlogDetail> = TestBed.createComponent(BlogDetail);
  return { fixture, seoMock, analyticsMock };
}

describe('BlogDetail', () => {
  const originalIntersectionObserver = globalThis.IntersectionObserver;

  beforeEach(() => {
    MockIntersectionObserver.instances = [];
    globalThis.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    globalThis.IntersectionObserver = originalIntersectionObserver;
  });

  it('rend le contenu Markdown en HTML', async () => {
    const { fixture } = setup({ getPostBySlug: () => of(post()) });
    fixture.componentRef.setInput('slug', 'mon-article');
    fixture.detectChanges();
    await fixture.whenStable(); // `resource()` charge de façon async, même si l'Observable sous-jacent est synchrone (of()).
    fixture.detectChanges();
    const html = fixture.nativeElement.querySelector('[data-testid="blog-content"]')
      .innerHTML as string;
    expect(html).toContain('<h1 id="bonjour">Bonjour</h1>');
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

  it("applique le SEO avec les données de l'article (title, description, image, JSON-LD BlogPosting)", async () => {
    const { fixture, seoMock } = setup({ getPostBySlug: () => of(post()) });
    fixture.componentRef.setInput('slug', 'mon-article');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(seoMock.applySeoData).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('Mon article'),
        description: 'Résumé',
        image: 'https://x.test/img.webp?variant=share',
        imageAlt: 'Illustration de l’article Mon article',
        type: 'article',
        structuredData: expect.objectContaining({
          '@type': 'BlogPosting',
          image: 'https://x.test/img.webp?variant=share',
          datePublished: '2026-08-31T00:00:00Z',
          dateModified: '2026-08-31T00:00:00Z',
          url: 'https://nedellec-julien.fr/blog/mon-article',
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': 'https://nedellec-julien.fr/blog/mon-article',
          },
          inLanguage: 'fr',
          keywords: 'Angular',
          publisher: expect.objectContaining({ name: 'Julien Nédellec' }),
        }),
      }),
    );
  });

  it('coupe la meta description à 155 caractères sans couper un mot (extrait long)', async () => {
    const excerpt =
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.';
    const { fixture, seoMock } = setup({ getPostBySlug: () => of(post({ excerpt })) });
    fixture.componentRef.setInput('slug', 'mon-article');
    fixture.detectChanges();
    await fixture.whenStable();

    const call = seoMock.applySeoData.mock.calls.at(-1)?.[0];
    expect(call.description.length).toBeLessThanOrEqual(155);
    expect(call.description.endsWith('…')).toBe(true);
    expect(call.structuredData.description).toBe(excerpt);
  });

  it('date dateModified du JSON-LD à la dernière retouche, jamais avant datePublished', async () => {
    const { fixture, seoMock } = setup({
      getPostBySlug: () =>
        of(post({ publishedAt: '2026-08-31T00:00:00Z', updatedAt: '2026-08-30T00:00:00Z' })),
    });
    fixture.componentRef.setInput('slug', 'mon-article');
    fixture.detectChanges();
    await fixture.whenStable();

    const call = seoMock.applySeoData.mock.calls.at(-1)?.[0];
    expect(call.structuredData.dateModified).toBe('2026-08-31T00:00:00Z');
  });

  it('omet image/datePublished du JSON-LD quand coverImage/publishedAt sont vides', async () => {
    const { fixture, seoMock } = setup({
      getPostBySlug: () => of(post({ coverImage: '', publishedAt: null })),
    });
    fixture.componentRef.setInput('slug', 'mon-article');
    fixture.detectChanges();
    await fixture.whenStable();

    const call = seoMock.applySeoData.mock.calls.at(-1)?.[0];
    expect(call.structuredData).not.toHaveProperty('image');
    expect(call.structuredData).not.toHaveProperty('datePublished');
    expect(call.structuredData).not.toHaveProperty('dateModified');
  });

  describe('dates affichées', () => {
    it('rend la date de publication dans un <time datetime> lisible par les machines', async () => {
      const { fixture } = setup({ getPostBySlug: () => of(post()) });
      fixture.componentRef.setInput('slug', 'mon-article');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const time = fixture.nativeElement.querySelector('[data-testid="published-at"]');
      expect(time.tagName).toBe('TIME');
      expect(time.getAttribute('datetime')).toBe('2026-08-31T00:00:00Z');
      expect(fixture.nativeElement.querySelector('article')).not.toBeNull();
    });

    it.each([
      ['une retouche un autre jour', '2026-09-02T10:00:00Z', true],
      ['une retouche le jour même', '2026-08-31T18:00:00Z', false],
      ['une retouche antérieure à la publication', '2026-08-30T00:00:00Z', false],
    ])('affiche la mise à jour seulement pour %s', async (_label, updatedAt, shown) => {
      const { fixture } = setup({ getPostBySlug: () => of(post({ updatedAt })) });
      fixture.componentRef.setInput('slug', 'mon-article');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const updated = fixture.nativeElement.querySelector('[data-testid="updated-at"]');
      expect(updated !== null).toBe(shown);
      if (shown) expect(updated.getAttribute('datetime')).toBe(updatedAt);
    });
  });

  it("affiche la couverture de l'article quand coverImage est renseignée", async () => {
    const { fixture } = setup({ getPostBySlug: () => of(post()) });
    fixture.componentRef.setInput('slug', 'mon-article');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).not.toBeNull();
  });

  it("track une vue d'article (trackArticleView) une fois le post chargé", async () => {
    const { fixture, analyticsMock } = setup({ getPostBySlug: () => of(post()) });
    fixture.componentRef.setInput('slug', 'mon-article');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(analyticsMock.trackArticleView).toHaveBeenCalledExactlyOnceWith('1', 'Mon article');
  });

  it("track la lecture de l'article (trackArticleRead) quand le lecteur scrolle jusqu'à la fin du contenu", async () => {
    const { fixture, analyticsMock } = setup({ getPostBySlug: () => of(post()) });
    fixture.componentRef.setInput('slug', 'mon-article');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(analyticsMock.trackArticleRead).not.toHaveBeenCalled();
    MockIntersectionObserver.instances[0].emit(true);

    expect(analyticsMock.trackArticleRead).toHaveBeenCalledExactlyOnceWith('1', 'Mon article');
  });

  it("ne track la lecture qu'une seule fois même si le sentinel entre plusieurs fois dans le viewport", async () => {
    const { fixture, analyticsMock } = setup({ getPostBySlug: () => of(post()) });
    fixture.componentRef.setInput('slug', 'mon-article');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    MockIntersectionObserver.instances[0].emit(true);
    MockIntersectionObserver.instances[0].emit(false);
    MockIntersectionObserver.instances[0].emit(true);

    expect(analyticsMock.trackArticleRead).toHaveBeenCalledTimes(1);
  });
});
