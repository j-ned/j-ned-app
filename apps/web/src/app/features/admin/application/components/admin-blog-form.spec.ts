import { TestBed } from '@angular/core/testing';
import { describe, it, expect } from 'vitest';
import { AdminBlogForm } from './admin-blog-form';
import type { BlogPost } from '@features/blog/domain/models/blog-post.model';

function post(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    id: '1',
    title: 'Article existant',
    slug: 'article-existant',
    excerpt: 'Extrait existant',
    contentMarkdown: '# Contenu existant',
    coverImage: 'https://x.test/cover.webp',
    tags: ['Angular'],
    status: 'published',
    likesCount: 5,
    publishedAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
    ...overrides,
  };
}

describe('AdminBlogForm', () => {
  it('précharge le formulaire avec les données de l’article à éditer', () => {
    const fixture = TestBed.createComponent(AdminBlogForm);
    fixture.componentRef.setInput('post', post());
    fixture.detectChanges();

    expect(fixture.componentInstance.form.title().value()).toBe('Article existant');
    expect(fixture.componentInstance.form.excerpt().value()).toBe('Extrait existant');
    expect(fixture.componentInstance.form.contentMarkdown().value()).toBe('# Contenu existant');
    expect(fixture.componentInstance.form.status().value()).toBe('published');
  });

  it('émet saved avec le markdown, les tags et le statut au submit', async () => {
    const fixture = TestBed.createComponent(AdminBlogForm);
    fixture.detectChanges();

    let emitted: unknown;
    fixture.componentInstance.saved.subscribe((v) => (emitted = v));

    fixture.componentInstance.form().value.set({
      title: 'Mon article',
      excerpt: 'Résumé',
      contentMarkdown: '# Contenu',
      status: 'draft',
    });
    fixture.componentInstance.selectedTags.set(new Set(['Angular']));
    await fixture.componentInstance.submitPost();

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
