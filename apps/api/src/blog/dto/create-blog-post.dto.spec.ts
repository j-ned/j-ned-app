import { invalidProperties } from '../../common/dto-testing';
import { createBlogPostSchema } from './create-blog-post.dto';

describe('CreateBlogPostDto', () => {
  it('rejette un titre vide', () => {
    const errors = invalidProperties(createBlogPostSchema, {
      title: '',
      excerpt: 'x',
      contentMarkdown: 'x',
      status: 'draft',
    });
    expect(errors).toContain('title');
  });

  it('accepte un DTO valide complet', () => {
    const errors = invalidProperties(createBlogPostSchema, {
      title: 'Mon article',
      excerpt: 'Résumé',
      contentMarkdown: '# Titre\n\nContenu.',
      tags: ['Angular', 'NestJS'],
      status: 'published',
    });
    expect(errors).toHaveLength(0);
  });

  it('rejette un status invalide', () => {
    const errors = invalidProperties(createBlogPostSchema, {
      title: 'x',
      excerpt: 'x',
      contentMarkdown: 'x',
      status: 'archived',
    });
    expect(errors).toContain('status');
  });
});
