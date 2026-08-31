import { TestBed } from '@angular/core/testing';
import { describe, it, expect, afterEach } from 'vitest';
import { BlogComments } from './blog-comments';

describe('BlogComments', () => {
  afterEach(() => {
    document.querySelectorAll('script[src="https://giscus.app/client.js"]').forEach((s) => s.remove());
  });

  it('injecte le script Giscus avec le bon mapping pathname', () => {
    const fixture = TestBed.createComponent(BlogComments);
    fixture.componentRef.setInput('slug', 'mon-article');
    fixture.detectChanges();

    const script = document.querySelector('script[src="https://giscus.app/client.js"]') as HTMLScriptElement;
    expect(script).toBeTruthy();
    expect(script.getAttribute('data-mapping')).toBe('pathname');
  });
});
