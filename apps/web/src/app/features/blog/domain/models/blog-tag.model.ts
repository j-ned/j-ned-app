export type BlogTagCategory = 'stack' | 'security' | 'engineering' | 'journey' | 'projects';

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
  ],
  engineering: ['Architecture', 'Tests', 'SEO', 'Audit de sécurité', "Retour d'expérience"],
  journey: [
    'Parcours',
    'Reconversion',
    'Carrière',
    'Industrie',
    'Métallurgie',
    'Autodidacte',
    'Full-Stack',
  ],
  projects: ['DashFlow', 'Auto-hébergement', 'CI/CD', 'GreenTech'],
};

export const AVAILABLE_BLOG_TAGS: readonly string[] = Object.values(BLOG_TAGS_BY_CATEGORY).flat();

const CATEGORY_BY_TAG: ReadonlyMap<string, BlogTagCategory> = new Map(
  (Object.entries(BLOG_TAGS_BY_CATEGORY) as [BlogTagCategory, readonly string[]][]).flatMap(
    ([category, tags]) => tags.map((tag): [string, BlogTagCategory] => [tag, category]),
  ),
);

/** Catégorie d'un tag du catalogue ; `null` pour un tag libre saisi hors catalogue. */
export function blogTagCategory(tag: string): BlogTagCategory | null {
  return CATEGORY_BY_TAG.get(tag) ?? null;
}
