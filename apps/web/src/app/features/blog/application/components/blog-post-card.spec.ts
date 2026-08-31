import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect } from 'vitest';
import { BlogPostCard } from './blog-post-card';
import type { BlogPost } from '../../domain/models/blog-post.model';

function post(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    id: '1', title: 'Mon article', slug: 'mon-article', excerpt: 'Résumé',
    contentMarkdown: '', coverImage: '', tags: ['Angular'], status: 'published',
    likesCount: 3, publishedAt: '2026-08-31T00:00:00Z', ...overrides,
  };
}

describe('BlogPostCard', () => {
  it('affiche le titre, l\'extrait et les tags', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(BlogPostCard);
    fixture.componentRef.setInput('post', post());
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Mon article');
    expect(text).toContain('Résumé');
    expect(text).toContain('Angular');
  });

  it('affiche la date de publication quand elle est renseignée', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(BlogPostCard);
    fixture.componentRef.setInput('post', post({ publishedAt: '2026-08-31T00:00:00Z' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent as string).toContain('2026');
  });

  it("n'affiche aucune date quand publishedAt est null", () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(BlogPostCard);
    fixture.componentRef.setInput('post', post({ publishedAt: null }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent as string).not.toContain('2026');
  });

  it('chaque tag est un lien vers /blog?tag=', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(BlogPostCard);
    fixture.componentRef.setInput('post', post({ tags: ['Angular', 'NestJS'] }));
    fixture.detectChanges();
    const links = fixture.nativeElement.querySelectorAll('[data-testid="tag-link"]') as NodeListOf<HTMLAnchorElement>;
    expect(links.length).toBe(2);
    expect(links[0].getAttribute('href')).toBe('/blog?tag=Angular');
    expect(links[1].getAttribute('href')).toBe('/blog?tag=NestJS');
  });
});
