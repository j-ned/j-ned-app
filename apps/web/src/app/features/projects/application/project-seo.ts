import type { SeoData } from '@core/seo/seo';
import type { BlogPostSummary } from '@features/blog/domain/models/blog-post.model';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { toShareImageUrl } from '@shared/seo/share-image';
import { OWNER_NAME, PERSON_REF, pageTitle } from '@shared/seo/site-person';
import { truncateAtWord } from '@shared/seo/truncate-at-word';
import type { Project } from '../domain/models/project.model';

export function projectSeo(project: Project, articles: readonly BlogPostSummary[]): SeoData {
  const subjectOf = articles.map((post) => ({
    '@type': 'BlogPosting',
    headline: post.title,
    url: `${SITE_IDENTITY.siteUrl}/blog/${post.slug}`,
  }));
  return {
    title: pageTitle(project.title),
    description: truncateAtWord(project.description, 155),
    keywords: [project.category, ...project.tags, OWNER_NAME, 'Portfolio Développeur'].join(', '),
    url: `${SITE_IDENTITY.siteUrl}/projects/${project.slug}`,
    type: 'article',
    image: toShareImageUrl(project.image),
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: project.title,
      description: project.description,
      creator: PERSON_REF,
      keywords: project.tags.join(', '),
      ...(project.liveUrl ? { url: project.liveUrl } : {}),
      ...(project.repoUrl ? { codeRepository: project.repoUrl } : {}),
      ...(subjectOf.length > 0 ? { subjectOf } : {}),
    },
  };
}
