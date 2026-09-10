import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { BlogTagLink } from './blog-tag-link';

describe('BlogTagLink', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  function render(tag: string): HTMLAnchorElement {
    const fixture = TestBed.createComponent(BlogTagLink);
    fixture.componentRef.setInput('tag', tag);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('[data-testid="tag-link"]') as HTMLAnchorElement;
  }

  it('links to the blog list filtered by the tag', () => {
    const link = render('Angular');
    expect(link.textContent?.trim()).toBe('Angular');
    expect(link.getAttribute('href')).toBe('/blog?tag=Angular');
  });

  it.each<[string, string]>([
    ['Angular', 'text-primary'],
    ['PBKDF2', 'text-rose-700'],
    ['Tests', 'text-emerald-700'],
    ['Carrière', 'text-amber-800'],
    ['CI/CD', 'text-sky-700'],
  ])('colours "%s" by its category (%s)', (tag, expectedClass) => {
    expect(render(tag).className).toContain(expectedClass);
  });

  it('falls back to the neutral style for a tag outside the catalogue', () => {
    expect(render('Inconnu').className).toContain('text-muted');
  });
});
