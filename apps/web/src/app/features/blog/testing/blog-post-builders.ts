import type { BlogPost } from '../domain/models/blog-post.model';
import type { ContentImage } from '../domain/models/content-image.model';

export function makeBlogPost(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    id: '1',
    title: 'Mon article',
    slug: 'mon-article',
    excerpt: 'Résumé',
    contentMarkdown: '',
    coverImage: '',
    tags: ['Angular'],
    status: 'published',
    likesCount: 0,
    publishedAt: '2026-08-31T00:00:00Z',
    updatedAt: '2026-08-31T00:00:00Z',
    ...overrides,
  };
}

export function makeContentImage(overrides: Partial<ContentImage> = {}): ContentImage {
  return {
    url: 'https://api.nedellec-julien.fr/api/storage/portfolio-storage/blog-content/3f2c1a9e-8b7d-4c6e-9f10-2a3b4c5d6e7f-a1b2c3d4-1600x900.avif',
    width: 1600,
    height: 900,
    ...overrides,
  };
}

export const PRODUCTION_POST_TAGS = {
  encryption: [
    'Chiffrement',
    'AES-256-GCM',
    'PBKDF2',
    'Web Crypto API',
    'Zero-knowledge',
    'E2EE',
    'Sécurité web',
    'Cryptographie',
    'Angular',
    'NestJS',
    'TypeScript',
    'IndexedDB',
    'DashFlow',
    'Full-Stack',
    'Sécurité',
  ],
  careerChange: [
    'Angular',
    'NestJS',
    'Reconversion',
    'Carrière',
    'Industrie',
    'Métallurgie',
    'Autodidacte',
    'Full-Stack',
    'Parcours',
  ],
} as const satisfies Record<string, readonly string[]>;

export function productionPosts(): readonly BlogPost[] {
  return [
    makeBlogPost({
      id: 'encryption',
      slug: 'chiffrement-cote-client',
      title: 'Chiffrement côté client avec AES-256-GCM et PBKDF2 : le cas DashFlow',
      tags: PRODUCTION_POST_TAGS.encryption,
    }),
    makeBlogPost({
      id: 'career-change',
      slug: 'de-la-metallurgie-au-developpement',
      title: 'De 20 ans de métallurgie à développeur Full-Stack',
      tags: PRODUCTION_POST_TAGS.careerChange,
    }),
  ];
}
