import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, afterEach } from 'vitest';
import { BlogList } from './blog-list';
import { BlogGateway } from '../domain/gateways/blog.gateway';
import type { BlogPost } from '../domain/models/blog-post.model';

function post(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    id: '1',
    title: 'Mon article',
    slug: 'mon-article',
    excerpt: 'Résumé',
    contentMarkdown: '',
    coverImage: '',
    tags: ['Angular'],
    status: 'published',
    likesCount: 0,
    publishedAt: '2026-08-31T00:00:00Z',
    ...overrides,
  };
}

function setup(posts: BlogPost[]): ComponentFixture<BlogList> {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: BlogGateway, useValue: { getPublishedPosts: () => of(posts) } },
    ],
  });
  return TestBed.createComponent(BlogList);
}

describe('BlogList', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('affiche une carte par article publié', () => {
    const fixture = setup([post(), post({ id: '2', slug: 'autre', title: 'Autre article' })]);
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('app-blog-post-card');
    expect(cards.length).toBe(2);
  });

  it('filtre par tag via le query param /blog?tag=', () => {
    const fixture = setup([
      post({ tags: ['Angular'] }),
      post({ id: '2', slug: 'b', tags: ['DevOps'] }),
    ]);
    fixture.componentRef.setInput('tag', 'DevOps');
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('app-blog-post-card');
    expect(cards.length).toBe(1);
  });

  it("affiche un bandeau de filtre actif avec un lien pour l'effacer", () => {
    const fixture = setup([post({ tags: ['Angular'] })]);
    fixture.componentRef.setInput('tag', 'Angular');
    fixture.detectChanges();
    const banner = fixture.nativeElement.querySelector('[data-testid="tag-filter-banner"]');
    expect(banner?.textContent).toContain('Angular');
    const clearLink = fixture.nativeElement.querySelector('[data-testid="tag-filter-clear"]');
    expect(clearLink).toBeTruthy();
  });

  it("n'affiche pas le bandeau de filtre sans tag actif", () => {
    const fixture = setup([post()]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="tag-filter-banner"]')).toBeNull();
  });

  it('revient à la première page quand le filtre change', () => {
    const posts = Array.from({ length: 12 }, (_, i) =>
      post({ id: String(i), slug: `p${i}`, title: `Article ${i}`, tags: ['Angular'] }),
    );
    const fixture = setup(posts);
    fixture.detectChanges();
    fixture.componentInstance.onPageChange({ first: 9, page: 1, rows: 9 });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Article 9');

    fixture.componentRef.setInput('tag', 'Angular');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Article 0');
    expect(fixture.nativeElement.textContent).not.toContain('Article 9');
  });
});
