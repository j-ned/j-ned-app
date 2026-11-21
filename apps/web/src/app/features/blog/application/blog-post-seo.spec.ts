import { makeBlogPost } from '../testing/blog-post-builders';
import { blogPostSeo, coverImageAlt } from './blog-post-seo';

const PERSON =
  '{"@type":"Person","@id":"https://nedellec-julien.fr/#person","name":"Julien Nédellec","url":"https://nedellec-julien.fr"}';

describe('blogPostSeo', () => {
  it('Given a published post linked to a project When its SEO is derived Then page meta and BlogPosting JSON-LD are emitted in this exact form', () => {
    const post = makeBlogPost({
      title: 'Mon article',
      slug: 'mon-article',
      excerpt: 'Résumé',
      coverImage: '/api/storage/cover.avif',
      tags: ['Angular', 'DashFlow'],
      publishedAt: '2026-08-31T00:00:00Z',
      updatedAt: '2026-09-02T00:00:00Z',
    });

    const { structuredData, ...meta } = blogPostSeo(post, [
      { tag: 'DashFlow', projectSlug: 'dashflow' },
    ]);

    expect({ meta, jsonLd: JSON.stringify(structuredData) }).toEqual({
      meta: {
        title: 'Mon article | Julien Nédellec',
        description: 'Résumé',
        keywords: 'Angular, DashFlow, Julien Nédellec, Blog Développeur',
        url: 'https://nedellec-julien.fr/blog/mon-article',
        type: 'article',
        image: 'https://nedellec-julien.fr/api/storage/cover.avif?variant=share',
        imageAlt: 'Illustration de l’article Mon article',
      },
      jsonLd:
        '{"@context":"https://schema.org","@type":"BlogPosting","headline":"Mon article","description":"Résumé",' +
        '"url":"https://nedellec-julien.fr/blog/mon-article",' +
        '"mainEntityOfPage":{"@type":"WebPage","@id":"https://nedellec-julien.fr/blog/mon-article"},' +
        `"inLanguage":"fr","keywords":"Angular, DashFlow","author":${PERSON},"publisher":${PERSON},` +
        '"about":[{"@type":"CreativeWork","name":"DashFlow","url":"https://nedellec-julien.fr/projects/dashflow"}],' +
        '"image":"https://nedellec-julien.fr/api/storage/cover.avif?variant=share",' +
        '"datePublished":"2026-08-31T00:00:00Z","dateModified":"2026-09-02T00:00:00Z"}',
    });
  });

  it('Given an unpublished post without cover nor linked project When its SEO is derived Then about, image and dates are left out', () => {
    const post = makeBlogPost({ coverImage: '', publishedAt: null });

    const structuredData = blogPostSeo(post, []).structuredData ?? {};

    expect(Object.keys(structuredData)).toEqual([
      '@context',
      '@type',
      'headline',
      'description',
      'url',
      'mainEntityOfPage',
      'inLanguage',
      'keywords',
      'author',
      'publisher',
    ]);
  });

  it('Given a post touched up before its publication When its SEO is derived Then dateModified never precedes datePublished', () => {
    const post = makeBlogPost({
      publishedAt: '2026-08-31T00:00:00Z',
      updatedAt: '2026-08-30T00:00:00Z',
    });

    expect(blogPostSeo(post, []).structuredData?.['dateModified']).toBe('2026-08-31T00:00:00Z');
  });

  it('Given a long excerpt When its SEO is derived Then the meta description is cut at a word but the JSON-LD keeps it whole', () => {
    const excerpt =
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.';

    const seo = blogPostSeo(makeBlogPost({ excerpt }), []);

    expect({
      metaFitsSnippet: seo.description.length <= 155 && seo.description.endsWith('…'),
      jsonLdDescription: seo.structuredData?.['description'],
    }).toEqual({ metaFitsSnippet: true, jsonLdDescription: excerpt });
  });

  it('Given a post title When the cover alternative text is built Then it names the article', () => {
    expect(coverImageAlt('Mon article')).toBe('Illustration de l’article Mon article');
  });
});
