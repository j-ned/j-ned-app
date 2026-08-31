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

  it('filtre par tag via le signal tagFilter', () => {
    const fixture = setup([
      post({ tags: ['Angular'] }),
      post({ id: '2', slug: 'b', tags: ['DevOps'] }),
    ]);
    fixture.componentInstance.setTagFilter('DevOps');
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('app-blog-post-card');
    expect(cards.length).toBe(1);
  });
});
