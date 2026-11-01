import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, afterEach } from 'vitest';
import type { BlogPost } from '../../domain/models/blog-post.model';
import { makeBlogPost, productionPosts } from '../../testing/blog-post-builders';
import { toBlogListView, type BlogPostRowView } from '../blog-list-view';
import { BlogPostRow } from './blog-post-row';

const rowsOf = (posts: readonly BlogPost[]): readonly BlogPostRowView[] =>
  toBlogListView(posts, { by: 'category', category: 'all' }).rows;

const rowOf = (overrides: Partial<BlogPost> = {}): BlogPostRowView => {
  const [row] = rowsOf([makeBlogPost({ publishedAt: '2026-08-31T12:00:00Z', ...overrides })]);
  if (!row) throw new Error('the view built no row');
  return row;
};

const render = async (row: BlogPostRowView = rowOf()): Promise<HTMLElement> => {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(BlogPostRow);
  fixture.componentRef.setInput('post', row);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
};

const byTestId = (root: HTMLElement, id: string): HTMLElement | null =>
  root.querySelector<HTMLElement>(`[data-testid="${id}"]`);

const allByTestId = (root: HTMLElement, id: string): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/\s+/g, ' ').trim();

const collapsed = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n]+/g, ' ').trim();

const WITH_COVER = { coverImage: '/covers/a.avif', tags: ['Angular', 'NestJS', 'Docker', 'RGPD'] };

describe('BlogPostRow', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('Given a post with tags and a cover When the row renders Then it reads overline, title, excerpt, subjects, read link, then cover, inside one article', async () => {
    const root = await render(rowOf(WITH_COVER));
    const article = byTestId(root, 'post-row');
    const parts = [
      'post-overline',
      'post-title',
      'post-excerpt',
      'fact-list',
      'post-link',
      'post-cover',
    ].map((id) => byTestId(root, id));

    expect(article?.tagName).toBe('ARTICLE');
    expect(parts.map((part) => part !== null && article?.contains(part))).toEqual([
      true,
      true,
      true,
      true,
      true,
      true,
    ]);
    expect(
      parts
        .slice(1)
        .map((part, index) =>
          part && parts[index]
            ? parts[index].compareDocumentPosition(part) & Node.DOCUMENT_POSITION_FOLLOWING
            : 0,
        ),
    ).toEqual(Array.from({ length: 5 }, () => Node.DOCUMENT_POSITION_FOLLOWING));
  });

  describe('overline', () => {
    it('Given a dated post When the row renders Then the mono overline reads « date · reading time », the date machine-readable', async () => {
      const contentMarkdown = Array.from({ length: 1136 }, () => 'mot').join(' ');
      const root = await render(rowOf({ contentMarkdown }));
      const overline = byTestId(root, 'post-overline');
      const time = overline?.querySelector('time');

      expect(overline?.tagName).toBe('P');
      expect(overline?.classList).toContain('font-mono');
      expect(time?.getAttribute('datetime')).toBe('2026-08-31T12:00:00Z');
      expect(collapsed(time)).toBe('31 Aug 2026');
      expect(collapsed(byTestId(root, 'reading-time'))).toBe('6\u00a0min de lecture');
      expect(collapsed(overline)).toBe('31 Aug 2026 · 6\u00a0min de lecture');
    });

    it('Given an undated post When the row renders Then the overline only gives the reading time, without date nor separator', async () => {
      const overline = byTestId(await render(rowOf({ publishedAt: null })), 'post-overline');

      expect(overline?.querySelector('time')).toBeNull();
      expect(collapsed(overline)).toBe('1\u00a0min de lecture');
    });
  });

  it('Given a post When the row renders Then its title is a plain second-level heading and its excerpt follows', async () => {
    const root = await render(
      rowOf({ title: 'Chiffrement côté client', excerpt: 'Le cas DashFlow.' }),
    );
    const title = byTestId(root, 'post-title');

    expect(title?.tagName).toBe('H2');
    expect(normalized(title)).toBe('Chiffrement côté client');
    expect(title?.querySelector('a')).toBeNull();
    expect(normalized(byTestId(root, 'post-excerpt'))).toBe('Le cas DashFlow.');
  });

  describe('subjects', () => {
    it('Given a post with four tags When the row renders Then one « Sujets » fact lists the first three, joined by middle dots', async () => {
      const root = await render(rowOf(WITH_COVER));
      const list = byTestId(root, 'fact-list');

      expect(list?.tagName).toBe('DL');
      expect(allByTestId(root, 'fact-label').map(normalized)).toEqual(['Sujets']);
      expect(allByTestId(root, 'fact-value').map(normalized)).toEqual([
        'Angular · NestJS · Docker',
      ]);
    });

    it('Given a post without tag When the row renders Then no subjects list is rendered', async () => {
      const root = await render(rowOf({ tags: [] }));

      expect(byTestId(root, 'fact-list')).toBeNull();
      expect(byTestId(root, 'post-link')).not.toBeNull();
    });
  });

  describe('read link', () => {
    it('Given a post When the row renders Then « Lire l’article » links to the article and names it for assistive technologies', async () => {
      const root = await render(rowOf({ slug: 'mon-article', title: 'Mon article' }));
      const link = byTestId(root, 'post-link');
      const context = byTestId(root, 'post-link-context');

      expect(link?.tagName).toBe('A');
      expect(link?.getAttribute('href')).toBe('/blog/mon-article');
      expect(normalized(link)).toBe("Lire l'article : Mon article");
      expect(context?.textContent).toBe('\u00a0: Mon article');
      expect(context?.classList).toContain('sr-only');
      expect(context?.closest('a')).toBe(link);
    });

    it.each([
      {
        slug: 'chiffrement-cote-client',
        name: "Lire l'article : Chiffrement côté client avec AES-256-GCM et PBKDF2 : le cas DashFlow",
      },
      {
        slug: 'de-la-metallurgie-au-developpement',
        name: "Lire l'article : De 20 ans de métallurgie à développeur Full-Stack",
      },
    ])(
      'Given the production post $slug When its row renders Then its read link has its own name « $name »',
      async ({ slug, name }) => {
        const row = rowsOf(productionPosts()).find((candidate) => candidate.slug === slug);
        if (!row) throw new Error(`no row for ${slug}`);
        const link = byTestId(await render(row), 'post-link');

        expect(link?.getAttribute('href')).toBe(`/blog/${slug}`);
        expect(normalized(link)).toBe(name);
      },
    );

    it('Given a post with eight tags When the row renders Then the read link is its only interactive element, stretched over the whole row with a 44 px target', async () => {
      const root = await render(
        rowOf({ coverImage: '/covers/a.avif', tags: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] }),
      );
      const link = byTestId(root, 'post-link');

      expect(Array.from(root.querySelectorAll('a, button'))).toEqual([link]);
      expect(byTestId(root, 'post-row')?.classList).toContain('relative');
      expect(
        ['after:absolute', 'after:inset-0', 'min-h-11'].filter(
          (name) => !link?.classList.contains(name),
        ),
      ).toEqual([]);
    });
  });

  describe('cover', () => {
    it('Given a post with a cover When the row renders Then the cover is a decorative image in a fixed-ratio frame', async () => {
      const root = await render(rowOf(WITH_COVER));
      const cover = byTestId(root, 'post-cover');
      const image = cover?.querySelector('img');

      expect(cover?.tagName).toBe('FIGURE');
      expect(cover?.classList).toContain('aspect-[1200/630]');
      expect(image?.getAttribute('src')).toBe('/covers/a.avif');
      expect(image?.getAttribute('alt')).toBe('');
    });

    it('Given a post with a cover When the row renders Then the cover lets clicks through to the stretched read link', async () => {
      const root = await render(rowOf(WITH_COVER));

      expect(byTestId(root, 'post-cover')?.classList).toContain('pointer-events-none');
    });

    it('Given a post without cover When the row renders Then no cover nor image is rendered', async () => {
      const root = await render(rowOf({ coverImage: '' }));

      expect(byTestId(root, 'post-cover')).toBeNull();
      expect(root.querySelector('img')).toBeNull();
    });

    it.each([
      { index: 0, fetchPriority: 'high', loading: 'eager', animated: false },
      { index: 1, fetchPriority: 'auto', loading: 'lazy', animated: true },
    ])(
      'Given the row at index $index of the list When it renders Then its cover loads with priority $fetchPriority, $loading, and its entrance animation is $animated',
      async ({ index, fetchPriority, loading, animated }) => {
        const rows = rowsOf([
          makeBlogPost({ id: 'a', slug: 'a', coverImage: '/covers/a.avif' }),
          makeBlogPost({ id: 'b', slug: 'b', coverImage: '/covers/b.avif' }),
        ]);
        const row = rows[index];
        if (!row) throw new Error(`no row at ${index}`);
        const root = await render(row);
        const image = byTestId(root, 'post-cover')?.querySelector('img');

        expect([image?.getAttribute('fetchpriority'), image?.getAttribute('loading')]).toEqual([
          fetchPriority,
          loading,
        ]);
        expect(root.classList.contains('animate-fade-up')).toBe(animated);
      },
    );
  });

  describe('container', () => {
    it('Given a post with a cover When the row renders Then its host is a size container and the article gives the cover its column from a 60rem container', async () => {
      const root = await render(rowOf(WITH_COVER));
      const article = byTestId(root, 'post-row');
      const cover = byTestId(root, 'post-cover');

      expect({
        container: root.classList.contains('@container'),
        columns: article?.classList.contains('@min-[60rem]:grid-cols-[minmax(0,1fr)_20rem]'),
        coverBack: cover?.classList.contains('@min-[60rem]:order-none'),
      }).toEqual({ container: true, columns: true, coverBack: true });
    });

    it('Given a post with a cover When the row renders Then none of its layout depends on the viewport width', async () => {
      const root = await render(rowOf(WITH_COVER));
      const viewportClasses = [root, ...root.querySelectorAll('*')].flatMap((element) =>
        [...element.classList].filter((token) => /^(sm|md|lg|xl|2xl):/.test(token)),
      );

      expect(viewportClasses).toEqual([]);
    });
  });
});
