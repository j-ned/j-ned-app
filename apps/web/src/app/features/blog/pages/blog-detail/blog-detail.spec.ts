import {
  DeferBlockBehavior,
  DeferBlockState,
  TestBed,
  type ComponentFixture,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, expect, vi, afterEach, beforeEach, type Mock } from 'vitest';
import { BlogDetail } from './blog-detail';
import { BlogArticleBody } from '../../application/components/blog-article-body';
import { BlogGateway } from '../../domain/gateways/blog.gateway';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { Seo } from '@core/seo/seo';
import type { BlogPost } from '../../domain/models/blog-post.model';
import { makeBlogPost } from '../../testing/blog-post-builders';

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

function setup(
  gatewayStub: {
    getPostBySlug: (slug: string) => ReturnType<BlogGateway['getPostBySlug']>;
    getPublishedPosts?: () => ReturnType<BlogGateway['getPublishedPosts']>;
  },
  deferBlockBehavior: DeferBlockBehavior = DeferBlockBehavior.Playthrough,
): Setup {
  const seoMock = { applySeoData: vi.fn() };
  const analyticsMock = { trackArticleView: vi.fn(), trackArticleRead: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: BlogGateway,
        useValue: {
          getPublishedPosts: (): ReturnType<BlogGateway['getPublishedPosts']> => of([]),
          ...gatewayStub,
        },
      },
      { provide: Seo, useValue: seoMock },
      { provide: AnalyticsGateway, useValue: analyticsMock },
    ],
    deferBlockBehavior,
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

  it('Given l’article du slug When il est rendu Then il n’émet aucun main et porte la mise en page sur l’host', async () => {
    const { fixture } = setup({ getPostBySlug: () => of(post()) });
    fixture.componentRef.setInput('slug', 'mon-article');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('article')).not.toBeNull();
    expect(host.querySelectorAll('main')).toHaveLength(0);
    expect([...host.classList].sort()).toEqual(['block', 'min-h-svh', 'pb-16', 'pt-20']);
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

  describe('en-tête et navigation entre articles', () => {
    const render = async (
      current: BlogPost,
      published: readonly BlogPost[] = [],
    ): Promise<HTMLElement> => {
      const { fixture } = setup({
        getPostBySlug: () => of(current),
        getPublishedPosts: () => of(published),
      });
      fixture.componentRef.setInput('slug', current.slug);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      return fixture.nativeElement as HTMLElement;
    };

    it('Given un article de 1 136 mots When il est rendu Then « 6 min de lecture » et l’extrait en chapeau', async () => {
      const contentMarkdown = Array.from({ length: 1136 }, () => 'mot').join(' ');
      const root = await render(post({ contentMarkdown, excerpt: 'Le chapeau.' }));
      expect(root.querySelector('[data-testid="reading-time"]')?.textContent?.trim()).toBe(
        '6 min de lecture',
      );
      expect(root.querySelector('[data-testid="blog-lead"]')?.textContent?.trim()).toBe(
        'Le chapeau.',
      );
    });

    it('Given l’article le plus récent When il est rendu Then seul un lien vers l’article précédent', async () => {
      const older = post({
        id: '2',
        slug: 'ancien',
        title: 'Ancien',
        publishedAt: '2026-08-01T00:00:00Z',
      });
      const current = post({ publishedAt: '2026-09-01T00:00:00Z' });
      const root = await render(current, [current, older]);
      const link = root.querySelector('[data-testid="older-post"]');
      expect(link?.getAttribute('href')).toBe('/blog/ancien');
      expect(link?.textContent).toContain('Ancien');
      expect(root.querySelector('[data-testid="newer-post"]')).toBeNull();
    });

    it('Given un article seul When il est rendu Then aucune navigation entre articles', async () => {
      const current = post();
      const root = await render(current, [current]);
      expect(root.querySelector('nav[aria-label="Autres articles"]')).toBeNull();
    });

    it('Given plus de trois tags When l’article est rendu Then tous les tags sont affichés', async () => {
      const tags = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
      const root = await render(post({ tags }));
      expect(root.querySelectorAll('[data-testid="tag-link"]')).toHaveLength(tags.length);
    });
  });

  describe('corps de l’article', () => {
    const show = async (fixture: ComponentFixture<BlogDetail>, slug: string): Promise<void> => {
      fixture.componentRef.setInput('slug', slug);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };

    const bodyOf = (fixture: ComponentFixture<BlogDetail>): HTMLElement | null =>
      (fixture.debugElement.query(By.directive(BlogArticleBody))?.nativeElement as
        | HTMLElement
        | undefined) ?? null;

    const testId = (fixture: ComponentFixture<BlogDetail>, id: string): HTMLElement | null =>
      (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(`[data-testid="${id}"]`);

    it('Given an article When it is shown Then its Markdown goes through the public article body, before the read sentinel', async () => {
      const { fixture } = setup({
        getPostBySlug: () => of(makeBlogPost({ contentMarkdown: '# Bonjour' })),
      });

      await show(fixture, 'mon-article');
      const body = bodyOf(fixture);
      const sentinel = testId(fixture, 'article-read-sentinel');

      expect({
        heading: body?.querySelector('[data-testid="blog-content"] h1')?.textContent,
        sentinelAfter:
          body && sentinel
            ? body.compareDocumentPosition(sentinel) & Node.DOCUMENT_POSITION_FOLLOWING
            : 0,
      }).toEqual({ heading: 'Bonjour', sentinelAfter: Node.DOCUMENT_POSITION_FOLLOWING });
    });

    it('Given an article whose body is still deferred When the page shows Then a placeholder stands in, and the body comes once the block completes', async () => {
      const { fixture } = setup(
        { getPostBySlug: () => of(makeBlogPost({ contentMarkdown: '# Bonjour' })) },
        DeferBlockBehavior.Manual,
      );
      await show(fixture, 'mon-article');
      const before = {
        placeholder: testId(fixture, 'blog-content-placeholder') !== null,
        content: testId(fixture, 'blog-content'),
        sentinel: testId(fixture, 'article-read-sentinel') !== null,
      };

      const [block] = await fixture.getDeferBlocks();
      await block?.render(DeferBlockState.Complete);
      fixture.detectChanges();

      expect({
        before,
        after: {
          placeholder: testId(fixture, 'blog-content-placeholder') !== null,
          heading: testId(fixture, 'blog-content')?.querySelector('h1')?.textContent,
        },
      }).toEqual({
        before: { placeholder: true, content: null, sentinel: true },
        after: { placeholder: false, heading: 'Bonjour' },
      });
    });

    it('Given the body chunk fails to load When the block errors Then a link reloads the article page in full, outside the router', async () => {
      const { fixture } = setup(
        { getPostBySlug: () => of(makeBlogPost()) },
        DeferBlockBehavior.Manual,
      );
      await show(fixture, 'mon-article');
      const navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');

      const [block] = await fixture.getDeferBlocks();
      await block?.render(DeferBlockState.Error);
      fixture.detectChanges();
      const link = testId(fixture, 'blog-content-error')?.querySelector('a');
      // L'action par défaut déplacerait la `location` de la fenêtre happy-dom partagée par le worker.
      link?.addEventListener('click', (event) => event.preventDefault());
      link?.click();
      await fixture.whenStable();

      expect({
        href: link?.getAttribute('href'),
        content: testId(fixture, 'blog-content'),
        routed: navigateByUrl.mock.calls.length,
      }).toEqual({ href: '/blog/mon-article', content: null, routed: 0 });
    });

    it('Given an article whose body is still deferred When the page shows Then an empty status region already waits outside the body', async () => {
      const { fixture } = setup(
        { getPostBySlug: () => of(makeBlogPost({ contentMarkdown: '```ts\nconst a = 1;\n```' })) },
        DeferBlockBehavior.Manual,
      );

      await show(fixture, 'mon-article');
      const region = testId(fixture, 'code-copy-status');

      expect({
        role: region?.getAttribute('role'),
        text: region?.textContent?.trim(),
        placeholder: testId(fixture, 'blog-content-placeholder') !== null,
      }).toEqual({ role: 'status', text: '', placeholder: true });
    });

    it('Given an article with code When its « Copier » is clicked Then the code reaches the clipboard and the page status announces it', async () => {
      await navigator.clipboard.writeText('avant');
      const { fixture } = setup({
        getPostBySlug: () =>
          of(makeBlogPost({ contentMarkdown: 'Texte\n\n```bash\npnpm test\n```' })),
      });
      await show(fixture, 'mon-article');

      bodyOf(fixture)?.querySelector<HTMLButtonElement>('button[data-code-copy]')?.click();
      await fixture.whenStable();
      fixture.detectChanges();

      expect({
        clipboard: await navigator.clipboard.readText(),
        status: testId(fixture, 'code-copy-status')?.textContent?.trim(),
      }).toEqual({ clipboard: 'pnpm test', status: 'Code copié dans le presse-papiers' });
    });

    it('Given article A on screen When the same page moves to article B Then a new body instance shows B', async () => {
      const articles: Record<string, BlogPost> = {
        a: makeBlogPost({ id: 'a', slug: 'a', title: 'A', contentMarkdown: '## Corps de A' }),
        b: makeBlogPost({ id: 'b', slug: 'b', title: 'B', contentMarkdown: '## Corps de B' }),
      };
      const { fixture } = setup({ getPostBySlug: (slug) => of(articles[slug]) });

      await show(fixture, 'a');
      const first = bodyOf(fixture);
      await show(fixture, 'b');
      const second = bodyOf(fixture);

      expect({
        firstShown: first !== null,
        recreated: second !== null && second !== first,
        headings: [...(second?.querySelectorAll('h2') ?? [])].map((h) => h.textContent),
      }).toEqual({ firstShown: true, recreated: true, headings: ['Corps de B'] });
    });
  });
});
