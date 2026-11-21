import type { SeoData } from '@core/seo/seo';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { toShareImageUrl } from '@shared/seo/share-image';
import { OWNER_NAME, PERSON_REF, pageTitle } from '@shared/seo/site-person';
import { truncateAtWord } from '@shared/seo/truncate-at-word';
import type { BlogPost } from '../domain/models/blog-post.model';
import type { ProjectTag } from '../domain/models/project-tag.model';

// Un brouillon retouché puis publié a un `updatedAt` antérieur à `publishedAt`.
function laterOf(a: string, b: string): string {
  return a > b ? a : b;
}

export const coverImageAlt = (title: string): string => `Illustration de l’article ${title}`;

export function blogPostSeo(post: BlogPost, linked: readonly ProjectTag[]): SeoData {
  const url = `${SITE_IDENTITY.siteUrl}/blog/${post.slug}`;
  const shareImage = toShareImageUrl(post.coverImage);
  const about = linked.map(({ tag, projectSlug }) => ({
    '@type': 'CreativeWork',
    name: tag,
    url: `${SITE_IDENTITY.siteUrl}/projects/${projectSlug}`,
  }));
  return {
    title: pageTitle(post.title),
    description: truncateAtWord(post.excerpt, 155),
    keywords: [...post.tags, OWNER_NAME, 'Blog Développeur'].join(', '),
    url,
    type: 'article',
    image: shareImage,
    imageAlt: coverImageAlt(post.title),
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      url,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      inLanguage: 'fr',
      keywords: post.tags.join(', '),
      author: PERSON_REF,
      publisher: PERSON_REF,
      ...(about.length > 0 ? { about } : {}),
      ...(shareImage ? { image: shareImage } : {}),
      ...(post.publishedAt
        ? {
            datePublished: post.publishedAt,
            dateModified: laterOf(post.updatedAt, post.publishedAt),
          }
        : {}),
    },
  };
}
