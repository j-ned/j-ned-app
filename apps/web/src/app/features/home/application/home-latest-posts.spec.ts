import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { BlogPost } from '@features/blog/domain/models/blog-post.model';
import { makeBlogPost } from '@features/blog/testing/blog-post-builders';
import { HomeLatestPosts } from './home-latest-posts';

@Component({ template: '' })
class BlankPage {}

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/\s+/g, ' ').trim();

describe('HomeLatestPosts', () => {
  afterEach(() => TestBed.resetTestingModule());

  const mount = async (posts: readonly BlogPost[]): Promise<ComponentFixture<HomeLatestPosts>> => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '**', component: BlankPage }])],
    });
    const fixture = TestBed.createComponent(HomeLatestPosts);
    fixture.componentRef.setInput('posts', posts);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  };

  const host = (fixture: ComponentFixture<HomeLatestPosts>): HTMLElement =>
    fixture.nativeElement as HTMLElement;

  const signals = makeBlogPost({
    slug: 'signals-en-production',
    title: 'Les signals en production',
    excerpt: 'Ce que trois mois de zoneless ont changé.',
    publishedAt: '2026-09-01T08:00:00Z',
  });
  const drizzle = makeBlogPost({
    slug: 'drizzle-exclusion',
    title: 'Une contrainte d’exclusion avec Drizzle',
    publishedAt: '2026-08-01T08:00:00Z',
  });

  it('Given posts When the section renders Then it is named by its h2 and each post title is an h3, under it', async () => {
    const fixture = await mount([signals, drizzle]);
    const section = host(fixture).querySelector('section');

    expect({
      labelledBy: section?.getAttribute('aria-labelledby'),
      heading: normalized(host(fixture).querySelector('#latest-posts-heading')),
      level: host(fixture).querySelector('#latest-posts-heading')?.tagName,
      titles: [...host(fixture).querySelectorAll('[data-testid="home-latest-post"] h3')].map(
        normalized,
      ),
    }).toEqual({
      labelledBy: 'latest-posts-heading',
      heading: "Ce que j'écris",
      level: 'H2',
      titles: ['Les signals en production', 'Une contrainte d’exclusion avec Drizzle'],
    });
  });

  it('Given posts When the section renders Then each title links to its article, in the given order', async () => {
    const fixture = await mount([signals, drizzle]);

    expect(
      [...host(fixture).querySelectorAll('[data-testid="home-latest-post-link"]')].map((link) =>
        link.getAttribute('href'),
      ),
    ).toEqual(['/blog/signals-en-production', '/blog/drizzle-exclusion']);
  });

  it('Given a post When it renders Then its publication date is machine readable and its excerpt is shown', async () => {
    const fixture = await mount([signals]);
    const article = host(fixture).querySelector('[data-testid="home-latest-post"]');

    expect({
      datetime: article?.querySelector('time')?.getAttribute('datetime'),
      excerpt: normalized(article).includes('Ce que trois mois de zoneless ont changé.'),
    }).toEqual({ datetime: '2026-09-01T08:00:00Z', excerpt: true });
  });

  it('Given the section When it renders Then it ends with a link to the whole blog', async () => {
    const fixture = await mount([signals]);
    const all = host(fixture).querySelector('[data-testid="home-latest-posts-all"]');

    expect([all?.getAttribute('href'), normalized(all)]).toEqual(['/blog', 'Tous les articles']);
  });
});
