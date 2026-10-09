import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { BehaviorSubject, NEVER, of, throwError, type Observable } from 'rxjs';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { BlogList } from './blog-list';
import { BlogGateway } from '../../domain/gateways/blog.gateway';
import type { BlogPost } from '../../domain/models/blog-post.model';
import { makeBlogPost, productionPosts } from '../../testing/blog-post-builders';

function setupWith(
  getPublishedPosts: () => Observable<readonly BlogPost[]>,
): ComponentFixture<BlogList> {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: BlogGateway, useValue: { getPublishedPosts } }],
  });
  return TestBed.createComponent(BlogList);
}

function setup(posts: readonly BlogPost[]): ComponentFixture<BlogList> {
  return setupWith(() => of(posts));
}

async function render(fixture: ComponentFixture<BlogList>): Promise<HTMLElement> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

const byTestId = (host: HTMLElement, testId: string): HTMLElement | null =>
  host.querySelector<HTMLElement>(`[data-testid="${testId}"]`);

const normalized = (element: Element | null): string | undefined =>
  element?.textContent?.replace(/\s+/g, ' ').trim();

describe('BlogList', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('affiche une ligne par article publié', async () => {
    const fixture = setup([
      makeBlogPost(),
      makeBlogPost({ id: '2', slug: 'autre', title: 'Autre article' }),
    ]);
    await render(fixture);
    const rows = fixture.nativeElement.querySelectorAll('app-blog-post-row');
    expect(rows.length).toBe(2);
  });

  it('Given des articles publiés When la liste est rendue Then elle n’émet aucun main et porte la mise en page sur l’host', async () => {
    const fixture = setup([makeBlogPost()]);
    await render(fixture);
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('app-blog-post-row')).toHaveLength(1);
    expect(host.querySelectorAll('main')).toHaveLength(0);
    expect([...host.classList].sort()).toEqual(['block', 'min-h-svh', 'pb-24', 'pt-20']);
  });

  // Titre du premier écran : un fondu d'entrée (opacité nulle) le masque au premier rendu.
  it('Given des articles publiés When la liste est rendue Then le titre est visible au premier rendu, sans animation d’entrée', async () => {
    const fixture = setup([makeBlogPost()]);
    await render(fixture);
    const title = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      '[data-testid="blog-title"]',
    );
    expect(title).not.toBeNull();
    expect(title?.className).not.toMatch(/\banimate-/);
  });

  it('filtre par tag via le query param /blog?tag=', async () => {
    const fixture = setup([
      makeBlogPost({ tags: ['Angular'] }),
      makeBlogPost({ id: '2', slug: 'b', tags: ['DevOps'] }),
    ]);
    fixture.componentRef.setInput('tag', 'DevOps');
    await render(fixture);
    const rows = fixture.nativeElement.querySelectorAll('app-blog-post-row');
    expect(rows.length).toBe(1);
  });

  it("affiche un bandeau de filtre actif avec un lien pour l'effacer", async () => {
    const fixture = setup([makeBlogPost({ tags: ['Angular'] })]);
    fixture.componentRef.setInput('tag', 'Angular');
    await render(fixture);
    const banner = fixture.nativeElement.querySelector('[data-testid="tag-filter-banner"]');
    expect(banner?.textContent).toContain('Angular');
    const clearLink = fixture.nativeElement.querySelector('[data-testid="tag-filter-clear"]');
    expect(clearLink).toBeTruthy();
  });

  it("n'affiche pas le bandeau de filtre sans tag actif", async () => {
    const fixture = setup([makeBlogPost()]);
    await render(fixture);
    expect(fixture.nativeElement.querySelector('[data-testid="tag-filter-banner"]')).toBeNull();
  });

  it.each([
    { count: 0, label: '0\u00a0article' },
    { count: 1, label: '1\u00a0article' },
    { count: 2, label: '2\u00a0articles' },
  ])(
    'Given $count article(s) publié(s) When la liste est rendue Then le sur-titre dit « $label »',
    async ({ count, label }) => {
      const posts = Array.from({ length: count }, (_, i) =>
        makeBlogPost({ id: String(i), slug: `p${i}` }),
      );
      const host = await render(setup(posts));
      expect(byTestId(host, 'blog-count')?.textContent?.trim()).toBe(label);
    },
  );

  it('Given la liste When elle est rendue Then le flux RSS est proposé', async () => {
    const fixture = setup([makeBlogPost()]);
    await render(fixture);
    const rss = fixture.nativeElement.querySelector(
      '[data-testid="rss-link"]',
    ) as HTMLAnchorElement;
    expect(rss.getAttribute('href')).toBe('/rss.xml');
  });

  describe('en-tête : compte, titre, introduction, RSS et cartouche « Thèmes »', () => {
    it('Given les articles When la page est rendue Then sur-titre, h1, introduction, RSS et cartouche partagent le même en-tête de la section', async () => {
      const host = await render(setup(productionPosts()));
      const header = byTestId(host, 'blog-title')?.closest('header');

      expect(header?.closest('section')?.getAttribute('aria-labelledby')).toBe('blog-heading');
      expect(
        ['blog-count', 'blog-intro', 'rss-link', 'blog-themes'].map(
          (testId) => byTestId(host, testId)?.closest('header') === header,
        ),
      ).toEqual([true, true, true, true]);
    });

    it('Given la page When elle est rendue Then son unique h1 la titre « Blog »', async () => {
      const host = await render(setup(productionPosts()));
      const title = byTestId(host, 'blog-title');

      expect(title?.tagName).toBe('H1');
      expect(title?.id).toBe('blog-heading');
      expect(normalized(title)).toBe('Blog');
      expect(host.querySelectorAll('h1')).toHaveLength(1);
    });

    it('Given la page When elle est rendue Then l’introduction est le texte fixe du blog', async () => {
      const host = await render(setup(productionPosts()));

      expect(normalized(byTestId(host, 'blog-intro'))).toBe(
        "Retours d'expérience concrets sur mes projets, mon parcours et la façon dont je les construis.",
      );
    });

    it('Given la page When elle est rendue Then le cartouche est un groupe nommé « Thèmes », référencé « Articles par thème »', async () => {
      const host = await render(setup(productionPosts()));
      const themes = byTestId(host, 'blog-themes');

      expect(themes?.getAttribute('role')).toBe('group');
      expect(themes?.getAttribute('aria-label')).toBe('Thèmes');
      expect(normalized(themes?.querySelector('[data-testid="cartouche-title"]') ?? null)).toBe(
        'Thèmes',
      );
      expect(normalized(themes?.querySelector('[data-testid="cartouche-reference"]') ?? null)).toBe(
        'Articles par thème',
      );
    });

    it('Given les deux articles de production When la page est rendue Then le cartouche liste les cinq thèmes dans l’ordre avec leur nombre d’articles', async () => {
      const host = await render(setup(productionPosts()));
      const textsOf = (testId: string): (string | undefined)[] =>
        Array.from(
          host.querySelectorAll(`[data-testid="blog-themes"] [data-testid="${testId}"]`),
          (cell) => cell.textContent?.trim(),
        );

      expect(textsOf('cartouche-label')).toEqual([
        'Stack',
        'Sécurité',
        'Ingénierie',
        'Parcours',
        'Projets',
      ]);
      expect(textsOf('cartouche-value')).toEqual([
        '2\u00a0articles',
        '1\u00a0article',
        '0\u00a0article',
        '1\u00a0article',
        '1\u00a0article',
      ]);
    });

    it('Given trois articles de parcours When la page est rendue Then les comptes du cartouche suivent les données', async () => {
      const host = await render(
        setup([
          makeBlogPost({ id: 'a', slug: 'a', tags: ['Parcours'] }),
          makeBlogPost({ id: 'b', slug: 'b', tags: ['Carrière', 'Docker'] }),
          makeBlogPost({ id: 'c', slug: 'c', tags: ['Autodidacte'] }),
        ]),
      );
      const values = Array.from(
        host.querySelectorAll('[data-testid="blog-themes"] [data-testid="cartouche-value"]'),
        (cell) => cell.textContent?.trim(),
      );

      expect(values).toEqual([
        '1\u00a0article',
        '0\u00a0article',
        '0\u00a0article',
        '3\u00a0articles',
        '0\u00a0article',
      ]);
    });
  });

  describe('tous les articles sur une seule page', () => {
    const manyPosts = (count: number, extra: Partial<BlogPost> = {}): readonly BlogPost[] =>
      Array.from({ length: count }, (_, i) =>
        makeBlogPost({ id: String(i), slug: `p${i}`, title: `Article ${i}`, ...extra }),
      );

    const titles = (host: HTMLElement): string[] =>
      Array.from(host.querySelectorAll('[data-testid="post-title"]'), (title) =>
        normalized(title),
      ).filter((title): title is string => title !== undefined);

    it('Given twelve posts When the page is rendered Then they form one list, one item per post, in API order', async () => {
      const host = await render(setup(manyPosts(12)));
      const list = byTestId(host, 'blog-posts');

      expect(list?.tagName).toBe('UL');
      expect(list?.getAttribute('role')).toBe('list');
      expect(
        Array.from(list?.children ?? [], (item) => [
          item.tagName,
          item.querySelectorAll('app-blog-post-row').length,
        ]),
      ).toEqual(Array.from({ length: 12 }, () => ['LI', 1]));
      expect(titles(host)).toEqual(Array.from({ length: 12 }, (_, i) => `Article ${i}`));
    });

    it.each([
      { tag: null, expected: 14 },
      { tag: 'Angular', expected: 12 },
    ])(
      'Given twelve Angular posts and two DevOps posts When the page is rendered with tag $tag Then all $expected matching posts are listed',
      async ({ tag, expected }) => {
        const fixture = setup([
          ...manyPosts(12, { tags: ['Angular'] }),
          makeBlogPost({ id: 'd1', slug: 'd1', title: 'DevOps 1', tags: ['DevOps'] }),
          makeBlogPost({ id: 'd2', slug: 'd2', title: 'DevOps 2', tags: ['DevOps'] }),
        ]);
        fixture.componentRef.setInput('tag', tag);
        const host = await render(fixture);

        expect(byTestId(host, 'blog-posts')?.querySelectorAll('li')).toHaveLength(expected);
        expect(host.querySelectorAll('app-blog-post-row')).toHaveLength(expected);
      },
    );

    it('Given twelve posts with covers When the page is rendered Then every cover is rendered and only the first loads with priority', async () => {
      const host = await render(
        setup(manyPosts(12).map((post) => ({ ...post, coverImage: `/covers/${post.slug}.avif` }))),
      );
      const loading = Array.from(
        host.querySelectorAll<HTMLElement>('[data-testid="post-cover"] img'),
        (image) => [image.getAttribute('fetchpriority'), image.getAttribute('loading')],
      );

      expect(loading).toEqual([
        ['high', 'eager'],
        ...Array.from({ length: 11 }, () => ['auto', 'lazy']),
      ]);
    });
  });

  describe('chargement, liste vide et erreur', () => {
    it('Given aucun article publié When la liste est chargée Then « Aucun article pour le moment. » s’affiche', async () => {
      const host = await render(setup([]));

      expect(normalized(byTestId(host, 'blog-empty'))).toBe('Aucun article pour le moment.');
      expect(host.querySelectorAll('app-blog-post-row')).toHaveLength(0);
    });

    it('Given aucun article publié When la liste est chargée Then le message vide reste hors de la liste d’articles', async () => {
      const host = await render(setup([]));

      expect(byTestId(host, 'blog-empty')?.closest('ul')).toBeNull();
      expect(byTestId(host, 'blog-posts')?.children ?? []).toHaveLength(0);
    });

    it('Given des articles en cours de chargement When la page est rendue Then aucun message de liste vide ne s’affiche', () => {
      const fixture = setupWith(() => NEVER);
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;

      expect(byTestId(host, 'blog-empty')).toBeNull();
      expect(host.textContent).not.toContain('Aucun article pour le moment.');
      expect(byTestId(host, 'blog-error')).toBeNull();
    });

    it('Given une API en erreur When la page est rendue Then une alerte invite à réessayer, sans liste ni message vide', async () => {
      const host = await render(setupWith(() => throwError(() => new Error('down'))));
      const error = byTestId(host, 'blog-error');

      expect(error?.getAttribute('role')).toBe('alert');
      expect(normalized(error?.querySelector('p') ?? null)).toBe(
        "Les articles n'ont pas pu être chargés. Vérifiez votre connexion, puis réessayez.",
      );
      expect(normalized(error?.querySelector('button') ?? null)).toBe('Réessayer');
      expect(byTestId(host, 'blog-empty')).toBeNull();
      expect(host.querySelectorAll('app-blog-post-row')).toHaveLength(0);
    });

    it('Given une API en erreur puis rétablie When on clique « Réessayer » Then les articles s’affichent et l’alerte disparaît', async () => {
      let calls = 0;
      const fixture = setupWith(() => {
        calls += 1;
        return calls === 1 ? throwError(() => new Error('down')) : of(productionPosts());
      });
      const host = await render(fixture);

      (byTestId(host, 'blog-error')?.querySelector('button') as HTMLButtonElement).click();
      await render(fixture);

      expect(calls).toBe(2);
      expect(byTestId(host, 'blog-error')).toBeNull();
      expect(host.querySelectorAll('app-blog-post-row')).toHaveLength(2);
      expect(byTestId(host, 'blog-count')?.textContent?.trim()).toBe('2\u00a0articles');
    });
  });

  describe('lignes d’article', () => {
    const withCovers = (): readonly BlogPost[] =>
      productionPosts().map((post) => ({ ...post, coverImage: `/covers/${post.slug}.avif` }));

    const coverLoading = (host: HTMLElement): (readonly (string | null | undefined)[])[] =>
      Array.from(host.querySelectorAll<HTMLElement>('[data-testid="post-cover"]'), (cover) => {
        const image = cover.querySelector('img');
        return [image?.getAttribute('fetchpriority'), image?.getAttribute('loading')];
      });

    it('Given the production posts When the page is rendered Then each line shows its title and a read link named after its own article', async () => {
      const host = await render(setup(productionPosts()));

      expect(Array.from(host.querySelectorAll('[data-testid="post-title"]'), normalized)).toEqual([
        'Chiffrement côté client avec AES-256-GCM et PBKDF2 : le cas DashFlow',
        'De 20 ans de métallurgie à développeur Full-Stack',
      ]);
      expect(Array.from(host.querySelectorAll('[data-testid="post-link"]'), normalized)).toEqual([
        "Lire l'article : Chiffrement côté client avec AES-256-GCM et PBKDF2 : le cas DashFlow",
        "Lire l'article : De 20 ans de métallurgie à développeur Full-Stack",
      ]);
      expect(Array.from(host.querySelectorAll('[data-testid="fact-value"]'), normalized)).toEqual([
        'Chiffrement · AES-256-GCM · PBKDF2',
        'Angular · NestJS · Reconversion',
      ]);
    });

    it('Given posts with covers and no filter When the page is rendered Then only the first cover loads with priority', async () => {
      const host = await render(setup(withCovers()));

      expect(coverLoading(host)).toEqual([
        ['high', 'eager'],
        ['auto', 'lazy'],
      ]);
    });

    it('Given /blog?tag= a tag the first post lacks When the page is rendered Then the remaining line loads its cover without priority', async () => {
      const fixture = setup(withCovers());
      fixture.componentRef.setInput('tag', 'Reconversion');
      const host = await render(fixture);

      expect(Array.from(host.querySelectorAll('[data-testid="post-title"]'), normalized)).toEqual([
        'De 20 ans de métallurgie à développeur Full-Stack',
      ]);
      expect(coverLoading(host)).toEqual([['auto', 'lazy']]);
    });

    it('Given the full list When a tag filter leaves only the second post Then its line is kept as is, still without priority', async () => {
      const fixture = setup(withCovers());
      const host = await render(fixture);
      const secondLine = host.querySelectorAll('app-blog-post-row')[1];

      fixture.componentRef.setInput('tag', 'Reconversion');
      await render(fixture);

      expect(Array.from(host.querySelectorAll('app-blog-post-row'))).toEqual([secondLine]);
      expect(coverLoading(host)).toEqual([['auto', 'lazy']]);
    });
  });
  describe('filtrer par thème', () => {
    const CAREER_CHANGE = 'De 20 ans de métallurgie à développeur Full-Stack';
    const ENCRYPTION = 'Chiffrement côté client avec AES-256-GCM et PBKDF2 : le cas DashFlow';

    const options = (host: HTMLElement): HTMLButtonElement[] =>
      Array.from(host.querySelectorAll<HTMLButtonElement>('[data-testid="filter-option"]'));

    const optionLabelled = (host: HTMLElement, label: string): HTMLButtonElement | undefined =>
      options(host).find(
        (option) =>
          normalized(option.querySelector('[data-testid="filter-option-label"]')) === label,
      );

    const choose = async (
      fixture: ComponentFixture<BlogList>,
      label: string,
    ): Promise<HTMLButtonElement | undefined> => {
      const option = optionLabelled(fixture.nativeElement as HTMLElement, label);
      option?.focus();
      option?.click();
      await render(fixture);
      return option;
    };

    const titles = (host: HTMLElement): (string | undefined)[] =>
      Array.from(host.querySelectorAll('[data-testid="post-title"]'), normalized);

    const pressed = (host: HTMLElement): (string | null)[] =>
      options(host).map((option) => option.getAttribute('aria-pressed'));

    const visibleCount = (host: HTMLElement): string | undefined =>
      byTestId(host, 'blog-visible-count')?.textContent?.trim();

    it('Given the production posts When the page is rendered Then a group « Filtrer par thème » offers « Tous » and the five themes with their count, « Tous » pressed, the empty theme inactive', async () => {
      const host = await render(setup(productionPosts()));
      const group = byTestId(host, 'filter-group');

      expect(group?.getAttribute('role')).toBe('group');
      expect(group?.getAttribute('aria-label')).toBe('Filtrer par thème');
      expect(
        options(host).map((option) => [
          normalized(option.querySelector('[data-testid="filter-option-label"]')),
          normalized(option.querySelector('[data-testid="filter-option-count"]')),
          option.getAttribute('aria-pressed'),
          option.getAttribute('aria-disabled'),
          option.hasAttribute('disabled'),
        ]),
      ).toEqual([
        ['Tous', '2', 'true', null, false],
        ['Stack', '2', 'false', null, false],
        ['Sécurité', '1', 'false', null, false],
        ['Ingénierie', '0', 'false', 'true', false],
        ['Parcours', '1', 'false', null, false],
        ['Projets', '1', 'false', null, false],
      ]);
    });

    it('Given the production posts When the page is rendered Then the filters sit outside the header, before the list', async () => {
      const host = await render(setup(productionPosts()));
      const group = byTestId(host, 'filter-group');
      const list = byTestId(host, 'blog-posts');

      expect(group?.closest('header')).toBeNull();
      expect(
        group && list ? group.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING : 0,
      ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it.each([
      { theme: 'Stack', expected: [ENCRYPTION, CAREER_CHANGE], status: '2\u00a0articles affichés' },
      { theme: 'Sécurité', expected: [ENCRYPTION], status: '1\u00a0article affiché' },
      { theme: 'Parcours', expected: [CAREER_CHANGE], status: '1\u00a0article affiché' },
      { theme: 'Projets', expected: [ENCRYPTION], status: '1\u00a0article affiché' },
    ])(
      'Given the production posts When the visitor chooses « $theme » Then only its posts remain, its button alone is pressed and the status announces them',
      async ({ theme, expected, status }) => {
        const fixture = setup(productionPosts());
        const host = await render(fixture);

        const option = await choose(fixture, theme);

        expect(titles(host)).toEqual(expected);
        expect(option?.getAttribute('aria-pressed')).toBe('true');
        expect(pressed(host).filter((state) => state === 'true')).toHaveLength(1);
        expect(visibleCount(host)).toBe(status);
      },
    );

    it('Given « Parcours » chosen When the visitor presses « Tous » Then every post is back', async () => {
      const fixture = setup(productionPosts());
      const host = await render(fixture);

      await choose(fixture, 'Parcours');
      await choose(fixture, 'Tous');

      expect(titles(host)).toEqual([ENCRYPTION, CAREER_CHANGE]);
      expect(pressed(host)).toEqual(['true', 'false', 'false', 'false', 'false', 'false']);
      expect(visibleCount(host)).toBe('2\u00a0articles affichés');
    });

    it('Given « Parcours » chosen When the visitor presses the empty « Ingénierie » Then nothing changes and the focus stays on it', async () => {
      const fixture = setup(productionPosts());
      const host = await render(fixture);
      await choose(fixture, 'Parcours');

      const inactive = await choose(fixture, 'Ingénierie');

      expect(titles(host)).toEqual([CAREER_CHANGE]);
      expect(pressed(host)).toEqual(['false', 'false', 'false', 'false', 'true', 'false']);
      expect(visibleCount(host)).toBe('1\u00a0article affiché');
      expect(document.activeElement).toBe(inactive);
    });

    it('Given a theme chosen When the page updates Then the article count, the cartouche and the filter counts still cover every post', async () => {
      const fixture = setup(productionPosts());
      const host = await render(fixture);
      const counts = (): {
        count?: string;
        themes: (string | undefined)[];
        filters: (string | undefined)[];
      } => ({
        count: normalized(byTestId(host, 'blog-count')),
        themes: Array.from(
          host.querySelectorAll('[data-testid="blog-themes"] [data-testid="cartouche-value"]'),
          normalized,
        ),
        filters: Array.from(
          host.querySelectorAll('[data-testid="filter-option-count"]'),
          normalized,
        ),
      });
      const before = counts();

      await choose(fixture, 'Sécurité');

      expect(counts()).toEqual(before);
      expect(before.filters).toEqual(['2', '2', '1', '0', '1', '1']);
    });

    it('Given the page When it is rendered Then the status is a polite live region, visually hidden, announcing every post before any choice', async () => {
      const status = byTestId(await render(setup(productionPosts())), 'blog-visible-count');

      expect(status?.tagName).toBe('P');
      expect(status?.getAttribute('role')).toBe('status');
      expect(status?.classList.contains('sr-only')).toBe(true);
      expect(status?.textContent?.trim()).toBe('2\u00a0articles affichés');
    });

    it('Given the visitor chooses a theme When the page updates Then the URL does not change: the theme is a local state', async () => {
      const fixture = setup(productionPosts());
      const host = await render(fixture);
      const router = TestBed.inject(Router);
      const navigate = vi.spyOn(router, 'navigate');
      const navigateByUrl = vi.spyOn(router, 'navigateByUrl');

      await choose(fixture, 'Parcours');

      expect(titles(host)).toEqual([CAREER_CHANGE]);
      expect(navigate).not.toHaveBeenCalled();
      expect(navigateByUrl).not.toHaveBeenCalled();
    });

    it('Given posts with covers When the visitor chooses « Parcours » Then the second line is kept as is, still without priority', async () => {
      const fixture = setup(
        productionPosts().map((post) => ({ ...post, coverImage: `/covers/${post.slug}.avif` })),
      );
      const host = await render(fixture);
      const secondLine = host.querySelectorAll('app-blog-post-row')[1];

      await choose(fixture, 'Parcours');

      expect(Array.from(host.querySelectorAll('app-blog-post-row'))).toEqual([secondLine]);
      expect(
        Array.from(host.querySelectorAll('[data-testid="post-cover"] img'), (image) => [
          image.getAttribute('fetchpriority'),
          image.getAttribute('loading'),
        ]),
      ).toEqual([['auto', 'lazy']]);
    });

    it.each([
      {
        label: 'still has a journey post',
        kept: 'de-la-metallurgie-au-developpement',
        expected: { pressed: 'Parcours', titles: [CAREER_CHANGE] },
      },
      {
        label: 'has no journey post any more',
        kept: 'chiffrement-cote-client',
        expected: { pressed: 'Tous', titles: [ENCRYPTION] },
      },
    ])(
      'Given « Parcours » chosen When the reloaded list $label Then the page keeps the theme only while it has posts',
      async ({ kept, expected }) => {
        const posts = new BehaviorSubject<readonly BlogPost[]>(productionPosts());
        const fixture = setupWith(() => posts);
        const host = await render(fixture);
        await choose(fixture, 'Parcours');

        posts.next(productionPosts().filter((post) => post.slug === kept));
        await render(fixture);

        expect(
          options(host)
            .filter((option) => option.getAttribute('aria-pressed') === 'true')
            .map((option) =>
              normalized(option.querySelector('[data-testid="filter-option-label"]')),
            ),
        ).toEqual([expected.pressed]);
        expect(titles(host)).toEqual(expected.titles);
      },
    );

    describe('quand le tag de la page article est présent', () => {
      it('Given /blog?tag=Reconversion When the page is rendered Then the banner takes the place of the theme filters, below the header, and the status announces the tagged posts', async () => {
        const fixture = setup(productionPosts());
        fixture.componentRef.setInput('tag', 'Reconversion');
        const host = await render(fixture);

        expect(byTestId(host, 'filter-group')).toBeNull();
        expect(options(host)).toHaveLength(0);
        expect(byTestId(host, 'tag-filter-banner')?.closest('header')).toBeNull();
        expect(byTestId(host, 'tag-filter-banner')?.closest('section')).not.toBeNull();
        expect(titles(host)).toEqual([CAREER_CHANGE]);
        expect(visibleCount(host)).toBe('1\u00a0article affiché');
      });

      it('Given /blog?tag= a tag no post carries When the page is rendered Then « Aucun article avec ce tag. » replaces the list, without the empty-blog message', async () => {
        const fixture = setup(productionPosts());
        fixture.componentRef.setInput('tag', 'Kubernetes');
        const host = await render(fixture);

        expect(normalized(byTestId(host, 'blog-empty-tag'))).toBe('Aucun article avec ce tag.');
        expect(byTestId(host, 'blog-empty')).toBeNull();
        expect(host.querySelectorAll('app-blog-post-row')).toHaveLength(0);
        expect(visibleCount(host)).toBe('0\u00a0article affiché');
      });

      it('Given /blog?tag= a tag some post carries When the page is rendered Then no « Aucun article avec ce tag. » is shown', async () => {
        const fixture = setup(productionPosts());
        fixture.componentRef.setInput('tag', 'Reconversion');
        const host = await render(fixture);

        expect(byTestId(host, 'blog-empty-tag')).toBeNull();
      });

      it('Given the theme filters When a tag arrives Then the group gives way to the banner, and comes back with « Tous » when the tag is cleared', async () => {
        const fixture = setup(productionPosts());
        const host = await render(fixture);

        fixture.componentRef.setInput('tag', 'Reconversion');
        await render(fixture);
        const whileTagged = byTestId(host, 'filter-group');
        fixture.componentRef.setInput('tag', null);
        await render(fixture);

        expect(whileTagged).toBeNull();
        expect(byTestId(host, 'tag-filter-banner')).toBeNull();
        expect(pressed(host)).toEqual(['true', 'false', 'false', 'false', 'false', 'false']);
        expect(titles(host)).toEqual([ENCRYPTION, CAREER_CHANGE]);
      });
    });

    describe('quand il n’y a rien à filtrer', () => {
      it('Given no post When the list is loaded Then no theme filter is offered', async () => {
        const host = await render(setup([]));

        expect(byTestId(host, 'filter-group')).toBeNull();
        expect(normalized(byTestId(host, 'blog-empty'))).toBe('Aucun article pour le moment.');
        expect(byTestId(host, 'blog-empty-tag')).toBeNull();
      });

      it('Given posts still loading When the page is rendered Then no theme filter is offered', () => {
        const fixture = setupWith(() => NEVER);
        fixture.detectChanges();

        expect(byTestId(fixture.nativeElement as HTMLElement, 'filter-group')).toBeNull();
      });

      it('Given an API error When the page is rendered Then neither the theme filters nor the status are rendered', async () => {
        const host = await render(setupWith(() => throwError(() => new Error('down'))));

        expect(byTestId(host, 'blog-error')).not.toBeNull();
        expect(byTestId(host, 'filter-group')).toBeNull();
        expect(byTestId(host, 'blog-visible-count')).toBeNull();
      });
    });
  });
});
