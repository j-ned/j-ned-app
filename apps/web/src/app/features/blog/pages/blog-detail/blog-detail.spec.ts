import {
  DeferBlockBehavior,
  DeferBlockState,
  TestBed,
  type ComponentFixture,
} from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { PLATFORM_ID, RESPONSE_INIT, type Provider } from '@angular/core';
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
import { FURTHER_READING_COPY } from '../../application/further-reading-copy';

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
  readonly analyticsMock: {
    readonly trackArticleView: Mock;
    readonly trackArticleRead: Mock;
    readonly trackCtaClick: Mock;
  };
};

function setup(
  gatewayStub: {
    getPostBySlug: (slug: string) => ReturnType<BlogGateway['getPostBySlug']>;
    getPublishedPosts?: () => ReturnType<BlogGateway['getPublishedPosts']>;
  },
  deferBlockBehavior: DeferBlockBehavior = DeferBlockBehavior.Playthrough,
  extraProviders: Provider[] = [],
): Setup {
  const seoMock = { applySeoData: vi.fn() };
  const analyticsMock = {
    trackArticleView: vi.fn(),
    trackArticleRead: vi.fn(),
    trackCtaClick: vi.fn(),
  };
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
      ...extraProviders,
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

  it.each([
    [404, 404],
    [503, 200],
  ])(
    'Given a server render When the API answers %s for the slug Then the response status is %s and no redirection happens',
    async (apiStatus, status) => {
      const responseInit: ResponseInit = { status: 200, headers: new Headers() };
      const { fixture } = setup(
        {
          getPostBySlug: () =>
            throwError(() => new HttpErrorResponse({ status: apiStatus, statusText: 'API' })),
        },
        DeferBlockBehavior.Playthrough,
        [
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: RESPONSE_INIT, useValue: responseInit },
        ],
      );
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');
      fixture.componentRef.setInput('slug', 'inconnu');
      fixture.detectChanges();
      await fixture.whenStable();

      expect({ status: responseInit.status, navigations: navigate.mock.calls }).toEqual({
        status,
        navigations: [],
      });
    },
  );

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
        HTMLElement | undefined) ?? null;

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

  describe('pour aller plus loin', () => {
    const current = makeBlogPost({
      id: 'courant',
      slug: 'courant',
      title: 'Article courant',
      tags: ['Angular', 'CSP'],
      publishedAt: '2026-09-20T12:00:00Z',
    });

    const candidate = (slug: string, tags: readonly string[], publishedAt: string): BlogPost =>
      makeBlogPost({ id: slug, slug, title: `Titre ${slug}`, tags, publishedAt });

    const show = async (published: readonly BlogPost[]): Promise<Setup> => {
      const result = setup({
        getPostBySlug: () => of(current),
        getPublishedPosts: () => of(published),
      });
      result.fixture.componentRef.setInput('slug', current.slug);
      result.fixture.detectChanges();
      await result.fixture.whenStable();
      result.fixture.detectChanges();
      return result;
    };

    const rootOf = (fixture: ComponentFixture<BlogDetail>): HTMLElement =>
      fixture.nativeElement as HTMLElement;

    const relatedLinks = (fixture: ComponentFixture<BlogDetail>): HTMLAnchorElement[] => [
      ...rootOf(fixture).querySelectorAll<HTMLAnchorElement>('[data-testid="related-post"]'),
    ];

    it('Given no published post close to the article When the page renders Then no further reading section is rendered, while the chronological navigation stays', async () => {
      const unrelated = candidate('sans-rapport', ['Reconversion'], '2026-09-01T12:00:00Z');
      const { fixture } = await show([current, unrelated]);

      expect({
        section: rootOf(fixture).querySelector('[data-testid="further-reading"]'),
        older: rootOf(fixture).querySelector('[data-testid="older-post"]')?.getAttribute('href'),
      }).toEqual({ section: null, older: '/blog/sans-rapport' });
    });

    it('Given a close post When the page renders Then a section titled by a level-two heading sits after the article and before the chronological navigation', async () => {
      const { fixture } = await show([
        current,
        candidate('proche', ['Angular'], '2026-09-01T12:00:00Z'),
      ]);
      const root = rootOf(fixture);
      const section = root.querySelector<HTMLElement>('[data-testid="further-reading"]');
      const heading = section?.querySelector('h2');
      const article = root.querySelector('article');
      const nav = root.querySelector('nav[aria-label="Autres articles"]');

      expect({
        tag: section?.tagName,
        heading: heading?.textContent?.trim(),
        labelledBy: section?.getAttribute('aria-labelledby'),
        insideArticle: section?.closest('article') !== null,
        afterArticle:
          article && section
            ? article.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING
            : 0,
        beforeNav:
          section && nav
            ? section.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING
            : 0,
      }).toEqual({
        tag: 'SECTION',
        heading: 'Pour aller plus loin',
        labelledBy: heading?.id || 'missing id',
        insideArticle: false,
        afterArticle: Node.DOCUMENT_POSITION_FOLLOWING,
        beforeNav: Node.DOCUMENT_POSITION_FOLLOWING,
      });
    });

    it('Given four close posts When the page renders Then the three closest link to their article, best first, titled and dated', async () => {
      const { fixture } = await show([
        current,
        candidate('theme-seul', ['TypeScript'], '2026-09-14T12:00:00Z'),
        candidate('deux-tags', ['Angular', 'CSP'], '2026-08-03T12:00:00Z'),
        candidate('un-tag', ['Angular'], '2026-07-21T12:00:00Z'),
        candidate('autre-theme-seul', ['XSS'], '2026-06-05T12:00:00Z'),
      ]);
      const links = relatedLinks(fixture);

      expect({
        hrefs: links.map((link) => link.getAttribute('href')),
        headings: links.map((link) => link.lastElementChild?.textContent?.trim()),
        overlines: links.map((link) => link.firstElementChild?.textContent ?? ''),
      }).toEqual({
        hrefs: ['/blog/deux-tags', '/blog/un-tag', '/blog/theme-seul'],
        headings: ['Titre deux-tags', 'Titre un-tag', 'Titre theme-seul'],
        overlines: [
          expect.stringMatching(/\b3\b.*2026/su),
          expect.stringMatching(/\b21\b.*2026/su),
          expect.stringMatching(/\b14\b.*2026/su),
        ],
      });
    });

    it('Given the older neighbour is also the closest post When the page renders Then it is offered both by the chronological navigation and by the further reading', async () => {
      const { fixture } = await show([
        current,
        candidate('voisin', ['Angular'], '2026-09-01T12:00:00Z'),
      ]);

      expect({
        older: rootOf(fixture).querySelector('[data-testid="older-post"]')?.getAttribute('href'),
        related: relatedLinks(fixture).map((link) => link.getAttribute('href')),
      }).toEqual({ older: '/blog/voisin', related: ['/blog/voisin'] });
    });

    it('Given the further reading is rendered When the page has loaded Then the published list was read once, with no extra API call', async () => {
      const published = [current, candidate('proche', ['Angular'], '2026-09-01T12:00:00Z')];
      const getPublishedPosts = vi.fn(() => of(published));
      const { fixture } = setup({ getPostBySlug: () => of(current), getPublishedPosts });
      fixture.componentRef.setInput('slug', current.slug);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect({
        related: relatedLinks(fixture).length,
        calls: getPublishedPosts.mock.calls.length,
      }).toEqual({ related: 1, calls: 1 });
    });

    it('Given the same page moves to another article When it renders again Then the further reading follows the new article without reloading the list', async () => {
      const angular = candidate('angular', ['Angular'], '2026-09-01T12:00:00Z');
      const parcours = candidate('parcours', ['Reconversion', 'Carrière'], '2026-08-01T12:00:00Z');
      const reconversion = candidate('reconversion', ['Reconversion'], '2026-07-01T12:00:00Z');
      const published = [current, angular, parcours, reconversion];
      const articles = new Map(published.map((p) => [p.slug, p]));
      const getPublishedPosts = vi.fn(() => of(published));
      const { fixture } = setup({
        getPostBySlug: (slug) => of(articles.get(slug) ?? current),
        getPublishedPosts,
      });

      fixture.componentRef.setInput('slug', 'courant');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const before = relatedLinks(fixture).map((link) => link.getAttribute('href'));

      fixture.componentRef.setInput('slug', 'parcours');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect({
        before,
        after: relatedLinks(fixture).map((link) => link.getAttribute('href')),
        calls: getPublishedPosts.mock.calls.length,
      }).toEqual({
        before: ['/blog/angular'],
        after: ['/blog/reconversion'],
        calls: 1,
      });
    });

    it('Given two close posts When the reader follows each of them Then each click is measured as a related post with the same constant label, and the router goes to the post', async () => {
      const { fixture, analyticsMock } = await show([
        current,
        candidate('deux-tags', ['Angular', 'CSP'], '2026-09-01T12:00:00Z'),
        candidate('un-tag', ['Angular'], '2026-08-01T12:00:00Z'),
      ]);
      const navigateByUrl = vi
        .spyOn(TestBed.inject(Router), 'navigateByUrl')
        .mockResolvedValue(true);

      for (const link of relatedLinks(fixture)) link.click();
      await fixture.whenStable();

      expect({
        tracked: analyticsMock.trackCtaClick.mock.calls,
        label: FURTHER_READING_COPY.relatedPostCtaLabel,
        routed: navigateByUrl.mock.calls.map(([url]) => String(url)),
      }).toEqual({
        tracked: [
          ['blog_related_post', FURTHER_READING_COPY.relatedPostCtaLabel],
          ['blog_related_post', FURTHER_READING_COPY.relatedPostCtaLabel],
        ],
        label: expect.stringMatching(/\S/u),
        routed: ['/blog/deux-tags', '/blog/un-tag'],
      });
    });

    describe('fiche du projet', () => {
      const showTagged = async (
        tags: readonly string[],
        others: readonly BlogPost[] = [],
      ): Promise<Setup> => {
        const tagged = makeBlogPost({ ...current, tags });
        const result = setup({
          getPostBySlug: () => of(tagged),
          getPublishedPosts: () => of([tagged, ...others]),
        });
        result.fixture.componentRef.setInput('slug', tagged.slug);
        result.fixture.detectChanges();
        await result.fixture.whenStable();
        result.fixture.detectChanges();
        return result;
      };

      const projectLinks = (fixture: ComponentFixture<BlogDetail>): HTMLAnchorElement[] => [
        ...rootOf(fixture).querySelectorAll<HTMLAnchorElement>('[data-testid="project-link"]'),
      ];

      it.each([
        { tag: 'DashFlow', href: '/projects/dashflow' },
        { tag: 'Portfolio', href: '/projects/portfolio' },
      ])(
        'Given an article tagged $tag and no close post When the page renders Then the further reading links to the project page, overlined as such and titled by the tag',
        async ({ tag, href }) => {
          const { fixture } = await showTagged([tag]);
          const section = rootOf(fixture).querySelector('[data-testid="further-reading"]');

          expect({
            heading: section?.querySelector('h2')?.textContent?.trim(),
            projects: projectLinks(fixture).map((link) => ({
              inSection: section?.contains(link) ?? false,
              href: link.getAttribute('href'),
              overline: link.firstElementChild?.textContent?.trim(),
              heading: link.lastElementChild?.textContent?.trim(),
            })),
            related: relatedLinks(fixture).length,
          }).toEqual({
            heading: 'Pour aller plus loin',
            projects: [{ inSection: true, href, overline: 'Fiche du projet', heading: tag }],
            related: 0,
          });
        },
      );

      it('Given an article whose free tag only differs from CandiDash by its case When the page renders Then no project page is linked, while the close post still is', async () => {
        const { fixture } = await showTagged(
          ['Candidash', 'Angular'],
          [candidate('proche', ['Angular'], '2026-09-01T12:00:00Z')],
        );

        expect({
          projects: projectLinks(fixture).length,
          related: relatedLinks(fixture).map((link) => link.getAttribute('href')),
        }).toEqual({ projects: 0, related: ['/blog/proche'] });
      });

      it('Given an article on a project with a close post When the page renders Then the project page comes before the close posts', async () => {
        const { fixture } = await showTagged(
          ['DashFlow', 'Angular'],
          [candidate('proche', ['Angular'], '2026-09-01T12:00:00Z')],
        );
        const section = rootOf(fixture).querySelector('[data-testid="further-reading"]');

        expect(
          [...(section?.querySelectorAll('a') ?? [])].map((link) => [
            link.getAttribute('data-testid'),
            link.getAttribute('href'),
          ]),
        ).toEqual([
          ['project-link', '/projects/dashflow'],
          ['related-post', '/blog/proche'],
        ]);
      });

      it('Given an article on a project When the reader follows the project page Then the click is measured as a project link with a constant label, and the router goes to the project', async () => {
        const { fixture, analyticsMock } = await showTagged(['DashFlow']);
        const navigateByUrl = vi
          .spyOn(TestBed.inject(Router), 'navigateByUrl')
          .mockResolvedValue(true);

        for (const link of projectLinks(fixture)) link.click();
        await fixture.whenStable();

        expect({
          tracked: analyticsMock.trackCtaClick.mock.calls,
          label: FURTHER_READING_COPY.projectLinkCtaLabel,
          routed: navigateByUrl.mock.calls.map(([url]) => String(url)),
        }).toEqual({
          tracked: [['blog_project_link', FURTHER_READING_COPY.projectLinkCtaLabel]],
          label: expect.stringMatching(/\S/u),
          routed: ['/projects/dashflow'],
        });
      });

      it.each([
        {
          tags: ['DashFlow'],
          about: [
            {
              '@type': 'CreativeWork',
              name: 'DashFlow',
              url: 'https://nedellec-julien.fr/projects/dashflow',
            },
          ],
        },
        {
          tags: ['Portfolio', 'Angular', 'DashFlow'],
          about: [
            {
              '@type': 'CreativeWork',
              name: 'Portfolio',
              url: 'https://nedellec-julien.fr/projects/portfolio',
            },
            {
              '@type': 'CreativeWork',
              name: 'DashFlow',
              url: 'https://nedellec-julien.fr/projects/dashflow',
            },
          ],
        },
        { tags: ['Angular'], about: undefined },
        { tags: ['Candidash'], about: undefined },
      ])(
        'Given an article tagged $tags When its structured data is applied Then the BlogPosting is about each linked project, in tag order, and carries no about key without one',
        async ({ tags, about }) => {
          const { seoMock } = await showTagged(tags);
          const structuredData = seoMock.applySeoData.mock.calls.at(-1)?.[0]?.structuredData;

          expect({
            type: structuredData?.['@type'],
            hasAbout: 'about' in (structuredData ?? {}),
            about: structuredData?.about,
          }).toEqual({ type: 'BlogPosting', hasAbout: about !== undefined, about });
        },
      );
    });
  });
});
