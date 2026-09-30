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

  // One Indigo Rule : toutes les catégories du catalogue partagent Signal Indigo.
  it.each(['Angular', 'PBKDF2', 'Tests', 'Carrière', 'CI/CD'])(
    'colours catalogue tag "%s" in Signal Indigo',
    (tag) => {
      expect(render(tag).className).toContain('text-primary');
    },
  );

  it('falls back to the neutral style for a tag outside the catalogue', () => {
    expect(render('Inconnu').className).toContain('text-muted');
  });
});
