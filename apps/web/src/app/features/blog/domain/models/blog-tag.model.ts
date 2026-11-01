import { PROJECT_TAGS } from './project-tag.model';

export const BLOG_TAG_CATEGORIES = [
  'stack',
  'security',
  'engineering',
  'journey',
  'projects',
] as const;
export type BlogTagCategory = (typeof BLOG_TAG_CATEGORIES)[number];
export type BlogCategoryFilter = BlogTagCategory | 'all';
export type BlogCategoryCounts = Readonly<Record<BlogTagCategory, number>>;

export const BLOG_TAGS_BY_CATEGORY: Record<BlogTagCategory, readonly string[]> = {
  stack: [
    'Angular',
    'TypeScript',
    'NestJS',
    'PostgreSQL',
    'Docker',
    'DevOps',
    'IndexedDB',
    'Web Crypto API',
    'Zod',
    'RxJS',
    'Full-Stack',
    'SSR',
    'Tailwind CSS',
  ],
  security: [
    'Sécurité',
    'Sécurité web',
    'Chiffrement',
    'Chiffrement côté client',
    'AES-256-GCM',
    'AES-KW',
    'PBKDF2',
    'E2EE',
    'Zero-knowledge',
    'Double enveloppe de clés',
    'Cryptographie',
    'OWASP',
    'XSS',
    'Données sensibles',
    'Données de santé',
    'RGPD',
    'Privacy by design',
    'CSP',
  ],
  engineering: [
    'Architecture',
    'Tests',
    'SEO',
    'Audit de sécurité',
    "Retour d'expérience",
    'Performance',
    'Accessibilité',
    'Design system',
  ],
  journey: ['Parcours', 'Reconversion', 'Carrière', 'Industrie', 'Métallurgie', 'Autodidacte'],
  projects: [...PROJECT_TAGS.map((entry) => entry.tag), 'Auto-hébergement', 'CI/CD', 'GreenTech'],
};

export const AVAILABLE_BLOG_TAGS: readonly string[] = Object.values(BLOG_TAGS_BY_CATEGORY).flat();

/** `@ArrayMaxSize(15)` du DTO d'article de l'API. */
export const BLOG_TAGS_MAX_COUNT = 15;

const CATEGORY_BY_TAG: ReadonlyMap<string, BlogTagCategory> = new Map(
  (Object.entries(BLOG_TAGS_BY_CATEGORY) as [BlogTagCategory, readonly string[]][]).flatMap(
    ([category, tags]) => tags.map((tag): [string, BlogTagCategory] => [tag, category]),
  ),
);

/** Catégorie d'un tag du catalogue ; `null` pour un tag libre saisi hors catalogue. */
export function blogTagCategory(tag: string): BlogTagCategory | null {
  return CATEGORY_BY_TAG.get(tag) ?? null;
}
