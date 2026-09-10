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

  it("n'affiche que 5 tags et un compteur +N vers l'article au-delà", () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(BlogPostCard);
    const tags = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    fixture.componentRef.setInput('post', post({ tags }));
    fixture.detectChanges();
    const links = fixture.nativeElement.querySelectorAll('[data-testid="tag-link"]') as NodeListOf<HTMLAnchorElement>;
    expect(links.length).toBe(5);
    const more = fixture.nativeElement.querySelector('[data-testid="more-tags"]') as HTMLAnchorElement;
    expect(more.textContent).toContain('+3');
    expect(more.getAttribute('href')).toBe('/blog/mon-article');
  });

  it("n'affiche pas de compteur quand il y a 5 tags ou moins", () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(BlogPostCard);
    fixture.componentRef.setInput('post', post({ tags: ['A', 'B', 'C', 'D', 'E'] }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="more-tags"]')).toBeNull();
  });
});

describe('BlogPostCard priority', () => {
  function render(priority: boolean): HTMLImageElement {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(BlogPostCard);
    fixture.componentRef.setInput('post', post({ coverImage: '/covers/a.avif' }));
    fixture.componentRef.setInput('priority', priority);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('img') as HTMLImageElement;
  }

  it('marks the cover as the LCP image when priority is set', () => {
    const img = render(true);
    expect(img.getAttribute('fetchpriority')).toBe('high');
    expect(img.getAttribute('loading')).toBe('eager');
  });

  it('lazy-loads the cover by default', () => {
    expect(render(false).getAttribute('loading')).toBe('lazy');
  });
});
