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
});
