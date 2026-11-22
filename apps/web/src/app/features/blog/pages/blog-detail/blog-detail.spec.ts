import {
  DeferBlockBehavior,
  DeferBlockState,
  TestBed,
  type ComponentFixture,
} from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID, REQUEST_CONTEXT, RESPONSE_INIT, type Provider } from '@angular/core';
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
import { countWords } from '../../domain/reading-time';
import { defined } from '@shared/testing/defined';
import { API_BASE_URL } from '@shared/api/api-config';
import { ssrUpstreamInterceptor } from '@core/ssr/ssr-upstream-interceptor';
import {
  makePublishedComment,
  makePublishedReply,
  makePublishedThread,
  toPublicCommentPageDto,
} from '@features/comments/testing/comment-builders';
import { CommentsGateway } from '@features/comments/infra/comments.gateway';

// Base valide pour l'intercepteur du rendu serveur, qui n'agit que sur une URL absolue.
const API = 'http://api:3000/api';

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

  // Appelé par Angular à la destruction d'un bloc `@defer (on viewport)`.
  unobserve(element: Element): void {
    const index = this.observed.indexOf(element);
    if (index >= 0) this.observed.splice(index, 1);
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
    wordCount: countWords(overrides.contentMarkdown ?? '# Bonjour'),
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
      provideHttpClient(withInterceptors([ssrUpstreamInterceptor])),
      provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: API },
      // Une lecture HTTP en attente garde l'application instable : la section a ses propres tests.
      {
        provide: CommentsGateway,
        useValue: {
          getThread: (): ReturnType<CommentsGateway['getThread']> => of(makePublishedThread()),
        },
      },
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
    defined(MockIntersectionObserver.instances[0]).emit(true);

    expect(analyticsMock.trackArticleRead).toHaveBeenCalledExactlyOnceWith('1', 'Mon article');
  });

  it("ne track la lecture qu'une seule fois même si le sentinel entre plusieurs fois dans le viewport", async () => {
    const { fixture, analyticsMock } = setup({ getPostBySlug: () => of(post()) });
    fixture.componentRef.setInput('slug', 'mon-article');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    defined(MockIntersectionObserver.instances[0]).emit(true);
    defined(MockIntersectionObserver.instances[0]).emit(false);
    defined(MockIntersectionObserver.instances[0]).emit(true);

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
      const { fixture } = setup({ getPostBySlug: (slug) => of(defined(articles[slug])) });

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

      it.each([{ tag: 'DashFlow', href: '/projects/dashflow' }])(
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

  describe('commentaires', () => {
    const COMMENTS_URL = `${API}/blog/posts/mon-article/comments?page=1&limit=100`;

    const testId = (fixture: ComponentFixture<BlogDetail>, id: string): HTMLElement | null =>
      (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(`[data-testid="${id}"]`);

    // Le corps de l'article et la section sont deux blocs différés : tous deux rendus ici.
    async function showArticle(
      answer: (request: ReturnType<HttpTestingController['expectOne']>) => void,
      extraProviders: Provider[] = [],
    ): Promise<ComponentFixture<BlogDetail>> {
      const { fixture } = setup(
        { getPostBySlug: () => of(makeBlogPost({ slug: 'mon-article', title: 'Mon article' })) },
        DeferBlockBehavior.Manual,
        [{ provide: CommentsGateway, useClass: CommentsGateway }, ...extraProviders],
      );
      fixture.componentRef.setInput('slug', 'mon-article');
      fixture.detectChanges();
      TestBed.tick();
      answer(TestBed.inject(HttpTestingController).expectOne(COMMENTS_URL));
      await fixture.whenStable();
      for (const block of await fixture.getDeferBlocks()) {
        await block.render(DeferBlockState.Complete);
      }
      await fixture.whenStable();
      return fixture;
    }

    afterEach(() => TestBed.inject(HttpTestingController).verify());

    const POST_URL = `${API}/blog/posts/mon-article/comments`;

    function fillCommentForm(form: HTMLElement | null, body: string): void {
      const fields = { name: 'Lou', email: 'lou@example.test', body };
      for (const [field, text] of Object.entries(fields)) {
        const element = form?.querySelector<HTMLInputElement | HTMLTextAreaElement>(
          `[data-testid="comment-${field}"]`,
        );
        if (!element) throw new Error(`no ${field} field`);
        element.value = text;
        element.dispatchEvent(new Event('input'));
      }
    }

    async function writeComment(fixture: ComponentFixture<BlogDetail>): Promise<void> {
      const form = testId(fixture, 'comment-main-form');
      fillCommentForm(form, 'Bel article.');
      await fixture.whenStable();
      form?.querySelector<HTMLButtonElement>('[data-testid="comment-submit"]')?.click();
      fixture.detectChanges();
      TestBed.tick();
    }

    it('Given a reader writes a comment When the API accepts it Then the reader is told it awaits review, the form is emptied and the comment is not listed', async () => {
      const fixture = await showArticle((request) =>
        request.flush(toPublicCommentPageDto(makePublishedThread())),
      );

      await writeComment(fixture);
      const post = TestBed.inject(HttpTestingController).expectOne(POST_URL);
      const sent = { method: post.request.method, body: post.request.body };
      post.flush(null, { status: 202, statusText: 'Accepted' });
      await fixture.whenStable();
      const form = testId(fixture, 'comment-main-form');

      expect({
        sent,
        status: testId(fixture, 'status-message')?.textContent?.trim(),
        name: form?.querySelector<HTMLInputElement>('[data-testid="comment-name"]')?.value,
        items: (fixture.nativeElement as HTMLElement).querySelectorAll(
          '[data-testid="comment-item"]',
        ).length,
      }).toEqual({
        sent: {
          method: 'POST',
          body: { name: 'Lou', email: 'lou@example.test', body: 'Bel article.', website: '' },
        },
        status: 'Merci\u202F! Ton commentaire sera publié après relecture.',
        name: '',
        items: 1,
      });
    });

    it('Given a reader answers a published comment When the API accepts the reply Then it goes out with its parent, the form closes and the confirmation shows under that comment', async () => {
      const fixture = await showArticle((request) =>
        request.flush(toPublicCommentPageDto(makePublishedThread())),
      );
      const host = fixture.nativeElement as HTMLElement;
      host.querySelector<HTMLButtonElement>('[data-testid="comment-reply"]')?.click();
      await fixture.whenStable();
      const form = testId(fixture, 'comment-reply-form');
      fillCommentForm(form, 'Pareil pour moi.');
      await fixture.whenStable();

      form?.querySelector<HTMLButtonElement>('[data-testid="comment-submit"]')?.click();
      fixture.detectChanges();
      TestBed.tick();
      const post = TestBed.inject(HttpTestingController).expectOne(POST_URL);
      const sent: unknown = post.request.body;
      post.flush(null, { status: 202, statusText: 'Accepted' });
      await fixture.whenStable();

      expect({
        sent,
        form: testId(fixture, 'comment-reply-form'),
        status: host
          .querySelector('[data-testid="comment-list"] [data-testid="status-message"]')
          ?.getAttribute('role'),
      }).toEqual({
        sent: expect.objectContaining({ parentId: 'c-1' }),
        form: null,
        status: 'status',
      });
    });

    async function writeReply(fixture: ComponentFixture<BlogDetail>): Promise<void> {
      const host = fixture.nativeElement as HTMLElement;
      host.querySelector<HTMLButtonElement>('[data-testid="comment-reply"]')?.click();
      await fixture.whenStable();
      const form = testId(fixture, 'comment-reply-form');
      fillCommentForm(form, 'Pareil pour moi.');
      await fixture.whenStable();
      form?.querySelector<HTMLButtonElement>('[data-testid="comment-submit"]')?.click();
      fixture.detectChanges();
      TestBed.tick();
    }

    const mainField = (
      fixture: ComponentFixture<BlogDetail>,
      field: 'name' | 'body',
    ): HTMLInputElement | HTMLTextAreaElement | null =>
      testId(fixture, 'comment-main-form')?.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        `[data-testid="comment-${field}"]`,
      ) ?? null;

    it('Given a draft in the main form When a reply is accepted Then the draft is kept', async () => {
      const fixture = await showArticle((request) =>
        request.flush(toPublicCommentPageDto(makePublishedThread())),
      );
      fillCommentForm(testId(fixture, 'comment-main-form'), 'Brouillon en cours.');
      await fixture.whenStable();

      await writeReply(fixture);
      TestBed.inject(HttpTestingController)
        .expectOne(POST_URL)
        .flush(null, { status: 202, statusText: 'Accepted' });
      await fixture.whenStable();

      expect([mainField(fixture, 'name')?.value, mainField(fixture, 'body')?.value]).toEqual([
        'Lou',
        'Brouillon en cours.',
      ]);
    });

    it('Given a comment still being sent When a reply is sent and accepted meanwhile Then the main form stays busy, and each form keeps its own confirmation', async () => {
      const fixture = await showArticle((request) =>
        request.flush(toPublicCommentPageDto(makePublishedThread())),
      );
      const http = TestBed.inject(HttpTestingController);
      await writeComment(fixture);
      const mainPost = http.expectOne(POST_URL);

      await writeReply(fixture);
      http.expectOne(POST_URL).flush(null, { status: 202, statusText: 'Accepted' });
      await fixture.whenStable();
      const mainBusy = testId(fixture, 'comment-main-form')
        ?.querySelector('[data-testid="comment-submit"]')
        ?.getAttribute('aria-disabled');
      mainPost.flush(null, { status: 202, statusText: 'Accepted' });
      await fixture.whenStable();
      const host = fixture.nativeElement as HTMLElement;

      expect({
        mainBusy,
        reply: host
          .querySelector('[data-testid="comment-list"] [data-testid="status-message"]')
          ?.getAttribute('role'),
        main: testId(fixture, 'comment-main-form')
          ?.querySelector('[data-testid="status-message"]')
          ?.getAttribute('role'),
      }).toEqual({ mainBusy: 'true', reply: 'status', main: 'status' });
    });

    it('Given a refused reply When the reader cancels its form Then the alert leaves with it', async () => {
      const fixture = await showArticle((request) =>
        request.flush(toPublicCommentPageDto(makePublishedThread())),
      );
      const host = fixture.nativeElement as HTMLElement;
      host.querySelector<HTMLButtonElement>('[data-testid="comment-reply"]')?.click();
      await fixture.whenStable();
      const form = testId(fixture, 'comment-reply-form');
      fillCommentForm(form, 'Pareil pour moi.');
      await fixture.whenStable();
      form?.querySelector<HTMLButtonElement>('[data-testid="comment-submit"]')?.click();
      fixture.detectChanges();
      TestBed.tick();
      TestBed.inject(HttpTestingController)
        .expectOne(POST_URL)
        .flush({ message: 'Introuvable' }, { status: 404, statusText: 'Not Found' });
      await fixture.whenStable();
      const before = testId(fixture, 'status-message')?.getAttribute('role');

      testId(fixture, 'comment-cancel')?.click();
      await fixture.whenStable();

      expect({ before, after: testId(fixture, 'status-message') }).toEqual({
        before: 'alert',
        after: null,
      });
    });

    it('Given a comment accepted on an article When the same page moves to another article Then the confirmation does not follow', async () => {
      const fixture = await showArticle((request) =>
        request.flush(toPublicCommentPageDto(makePublishedThread())),
      );
      await writeComment(fixture);
      const http = TestBed.inject(HttpTestingController);
      http.expectOne(POST_URL).flush(null, { status: 202, statusText: 'Accepted' });
      await fixture.whenStable();
      const before = testId(fixture, 'status-message') !== null;

      fixture.componentRef.setInput('slug', 'autre-article');
      fixture.detectChanges();
      TestBed.tick();
      http
        .expectOne(`${API}/blog/posts/autre-article/comments?page=1&limit=100`)
        .flush(toPublicCommentPageDto(makePublishedThread()));
      await fixture.whenStable();
      for (const block of await fixture.getDeferBlocks()) {
        await block.render(DeferBlockState.Complete);
      }
      await fixture.whenStable();

      expect({
        before,
        form: testId(fixture, 'comment-main-form') !== null,
        after: testId(fixture, 'status-message'),
      }).toEqual({ before: true, form: true, after: null });
    });

    it('Given a comment still on its way When the page moves to another article before the answer Then the late answer is not shown there', async () => {
      const fixture = await showArticle((request) =>
        request.flush(toPublicCommentPageDto(makePublishedThread())),
      );
      await writeComment(fixture);
      const http = TestBed.inject(HttpTestingController);
      const post = http.expectOne(POST_URL);

      fixture.componentRef.setInput('slug', 'autre-article');
      fixture.detectChanges();
      TestBed.tick();
      http
        .expectOne(`${API}/blog/posts/autre-article/comments?page=1&limit=100`)
        .flush(toPublicCommentPageDto(makePublishedThread()));
      post.flush(null, { status: 202, statusText: 'Accepted' });
      await fixture.whenStable();
      for (const block of await fixture.getDeferBlocks()) {
        await block.render(DeferBlockState.Complete);
      }
      await fixture.whenStable();

      expect({
        form: testId(fixture, 'comment-main-form') !== null,
        status: testId(fixture, 'status-message'),
      }).toEqual({ form: true, status: null });
    });

    it('Given a reader writes too often When the API refuses with 429 Then a single alert says so and the text is kept', async () => {
      const fixture = await showArticle((request) =>
        request.flush(toPublicCommentPageDto(makePublishedThread())),
      );

      await writeComment(fixture);
      TestBed.inject(HttpTestingController)
        .expectOne(POST_URL)
        .flush({ message: 'Trop de requêtes' }, { status: 429, statusText: 'Too Many Requests' });
      await fixture.whenStable();
      const statuses = (fixture.nativeElement as HTMLElement).querySelectorAll(
        '[data-testid="status-message"]',
      );

      expect({
        statuses: [...statuses].map((status) => status.getAttribute('role')),
        body: testId(fixture, 'comment-main-form')?.querySelector<HTMLTextAreaElement>(
          '[data-testid="comment-body"]',
        )?.value,
      }).toEqual({ statuses: ['alert'], body: 'Bel article.' });
    });

    it('Given an article with published comments When the page shows Then the comments section follows the article, after the reading suggestions, with each comment listed', async () => {
      const thread = makePublishedThread({
        comments: [
          makePublishedComment({ id: 'c-1', replies: [makePublishedReply({ id: 'r-1' })] }),
          makePublishedComment({ id: 'c-2', author: { kind: 'visitor', name: 'Inès' } }),
        ],
      });
      const fixture = await showArticle((request) => request.flush(toPublicCommentPageDto(thread)));
      const host = fixture.nativeElement as HTMLElement;
      const article = host.querySelector('article');
      const section = testId(fixture, 'comment-thread');

      expect({
        afterArticle:
          article && section
            ? article.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING
            : 0,
        insideArticle: article?.contains(section) ?? null,
        items: host.querySelectorAll('[data-testid="comment-item"]').length,
      }).toEqual({
        afterArticle: Node.DOCUMENT_POSITION_FOLLOWING,
        insideArticle: false,
        items: 3,
      });
    });

    it('Given the API leaks an e-mail in a comment When the page shows Then no address is rendered in the DOM', async () => {
      const fixture = await showArticle((request) =>
        request.flush({
          data: [
            {
              ...makePublishedComment(),
              author: { kind: 'visitor', name: 'Camille', email: 'camille@example.test' },
            },
          ],
          total: 1,
          page: 1,
          limit: 100,
        }),
      );
      const host = fixture.nativeElement as HTMLElement;

      expect({
        items: host.querySelectorAll('[data-testid="comment-item"]').length,
        leaked: host.innerHTML.includes('example.test'),
      }).toEqual({ items: 1, leaked: false });
    });

    it('Given the comments cannot be read When the page shows Then the section says so and the article is still there', async () => {
      const fixture = await showArticle((request) =>
        request.flush(null, { status: 500, statusText: 'Boom' }),
      );

      expect({
        title: (fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent?.trim(),
        error: testId(fixture, 'comments-load-error')?.textContent?.trim(),
      }).toEqual({ title: 'Mon article', error: 'Les commentaires n’ont pas pu être chargés.' });
    });

    it('Given a server render When the comments cannot be read Then the page still answers 200 with its article', async () => {
      const responseInit: ResponseInit = { status: 200, headers: new Headers() };
      const fixture = await showArticle(
        (request) => request.flush(null, { status: 500, statusText: 'Boom' }),
        [
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: RESPONSE_INIT, useValue: responseInit },
          { provide: REQUEST_CONTEXT, useValue: { apiBaseUrl: API, visitorForwardedFor: null } },
        ],
      );

      expect({
        status: responseInit.status,
        title: (fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent?.trim(),
        error: testId(fixture, 'comments-load-error') !== null,
      }).toEqual({ status: 200, title: 'Mon article', error: true });
    });
  });
});
