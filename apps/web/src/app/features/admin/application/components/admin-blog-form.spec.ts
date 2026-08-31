import { TestBed } from '@angular/core/testing';
import { describe, it, expect } from 'vitest';
import { AdminBlogForm } from './admin-blog-form';

describe('AdminBlogForm', () => {
  it('émet saved avec le markdown, les tags et le statut au submit', () => {
    const fixture = TestBed.createComponent(AdminBlogForm);
    fixture.detectChanges();

    let emitted: unknown;
    fixture.componentInstance.saved.subscribe((v) => (emitted = v));

    fixture.componentInstance.form.setValue({
      title: 'Mon article',
      excerpt: 'Résumé',
      contentMarkdown: '# Contenu',
      status: 'draft',
    });
    fixture.componentInstance.selectedTags.set(new Set(['Angular']));
    fixture.componentInstance.submitPost();

    expect(emitted).toEqual({
      data: {
        title: 'Mon article',
        excerpt: 'Résumé',
        contentMarkdown: '# Contenu',
        tags: ['Angular'],
        status: 'draft',
      },
      file: null,
    });
  });
});
