import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { BlogPost } from '@features/blog/domain/models/blog-post.model';
import { makeBlogPost } from '@features/blog/testing/blog-post-builders';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { settle } from '@shared/testing/settle';
import { AdminPostPreview } from './admin-post-preview';

const WORDS_221 = Array.from({ length: 221 }, () => 'mot').join(' ');

const ARTICLE = makeBlogPost({
  id: 'b-1',
  slug: 'chiffrement-cote-client',
  title: 'Chiffrement côté client',
  excerpt: 'Le cas DashFlow.',
  contentMarkdown: WORDS_221,
  coverImage: 'https://cdn.test/blog/b-1.avif',
  tags: ['Chiffrement', 'AES-256-GCM', 'PBKDF2', 'Angular'],
  status: 'published',
  publishedAt: '2026-09-09T10:00:00Z',
});

async function renderPreview(post: BlogPost, pendingCover?: boolean): Promise<HTMLElement> {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(AdminPostPreview);
  fixture.componentRef.setInput('post', post);
  if (pendingCover !== undefined) fixture.componentRef.setInput('pendingCover', pendingCover);
  await settle(fixture);
  return fixture.nativeElement as HTMLElement;
}

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, '');

const body = (host: HTMLElement): HTMLElement | null => byTestId(host, 'admin-post-preview-body');

describe('AdminPostPreview: cadre', () => {
  it('Given an article When the preview renders Then it is a section named « Aperçu public », placed in the blog list and marked as live', async () => {
    const host = await renderPreview(ARTICLE);
    const section = byTestId(host, 'admin-post-preview');
    const labelId = section?.getAttribute('aria-labelledby');

    expect({
      tag: section?.tagName,
      name: labelId ? normalized(host.querySelector(`[id="${labelId}"]`)) : null,
      reference: normalized(byTestId(host, 'admin-post-preview-reference')),
      live: testIdText(host, 'admin-post-preview-live'),
    }).toEqual({
      tag: 'SECTION',
      name: 'Aperçu public',
      reference: 'Blog · Liste des articles',
      live: 'en direct',
    });
  });

  it('Given an article When the preview renders Then the public article line stands in an inert body', async () => {
    const host = await renderPreview(ARTICLE);

    expect({
      inert: body(host)?.hasAttribute('inert') ?? false,
      rowInBody: body(host)?.contains(byTestId(host, 'post-row')) ?? false,
      linkInBody: body(host)?.contains(byTestId(host, 'post-link')) ?? false,
    }).toEqual({ inert: true, rowInBody: true, linkInBody: true });
  });
});

describe('AdminPostPreview: ligne publique', () => {
  it('Given an article When the preview renders Then the line reads its title, excerpt, reading time and first three subjects', async () => {
    const host = await renderPreview(ARTICLE);

    expect({
      title: testIdText(body(host) ?? host, 'post-title'),
      excerpt: testIdText(body(host) ?? host, 'post-excerpt'),
      readingTime: testIdText(body(host) ?? host, 'reading-time'),
      subjects: testIdText(body(host) ?? host, 'fact-value'),
    }).toEqual({
      title: 'Chiffrement côté client',
      excerpt: 'Le cas DashFlow.',
      readingTime: '2\u00a0min de lecture',
      subjects: 'Chiffrement · AES-256-GCM · PBKDF2',
    });
  });

  it.each([
    { publishedAt: '2026-09-09T10:00:00Z', datetime: '2026-09-09T10:00:00Z' },
    { publishedAt: null, datetime: null },
  ])(
    'Given an article published at $publishedAt When the preview renders Then the line is dated $datetime',
    async ({ publishedAt, datetime }) => {
      const host = await renderPreview(makeBlogPost({ ...ARTICLE, publishedAt }));
      const time = byTestId(host, 'post-overline')?.querySelector('time');

      expect(time?.getAttribute('datetime') ?? null).toBe(datetime);
    },
  );

  it('Given an article with a cover When the preview renders Then the cover never claims the page priority', async () => {
    const host = await renderPreview(ARTICLE);
    const image = byTestId(host, 'post-cover')?.querySelector('img');

    expect([image?.getAttribute('src'), image?.getAttribute('fetchpriority')]).toEqual([
      'https://cdn.test/blog/b-1.avif',
      'auto',
    ]);
  });
});

describe('AdminPostPreview: couverture en attente', () => {
  it.each([
    { pendingCover: true, note: "Nouvelle couverture\u00a0: visible ici après l'enregistrement." },
    { pendingCover: false, note: null },
    { pendingCover: undefined, note: null },
  ])(
    'Given a pending cover $pendingCover When the preview renders Then the note is $note',
    async ({ pendingCover, note }) => {
      const host = await renderPreview(ARTICLE, pendingCover);
      const element = byTestId(host, 'admin-post-preview-pending-cover');

      expect(element ? normalized(element) : null).toBe(note);
    },
  );
});
