import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { BlogPost } from '@features/blog/domain/models/blog-post.model';
import { makeBlogPost } from '@features/blog/testing/blog-post-builders';
import { byTestId } from '@shared/testing/by-test-id';
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

describe('AdminPostPreview: ligne publique', () => {
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
    { pendingCover: true, shown: true },
    { pendingCover: false, shown: false },
    { pendingCover: undefined, shown: false },
  ])(
    'Given a pending cover $pendingCover When the preview renders Then the note shows: $shown',
    async ({ pendingCover, shown }) => {
      const host = await renderPreview(ARTICLE, pendingCover);
      const element = byTestId(host, 'admin-post-preview-pending-cover');

      expect(element !== null).toBe(shown);
    },
  );
});
