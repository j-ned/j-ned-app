import type { PairRowsConfig } from './admin-pair-rows';

export const PROJECT_CATEGORIES = [
  'Application Web',
  'Application Mobile',
  'API / Backend',
  'Script',
  'Package / Librairie',
  'Extension',
  'Design / Maquette',
] as const;

export const AVAILABLE_PROJECT_TAGS = [
  'Angular',
  'TypeScript',
  'JavaScript',
  'NestJS',
  'Node.js',
  'Python',
  'Bash',
  'TailwindCSS',
  'SCSS',
  'CSS',
  'PostgreSQL',
  'MongoDB',
  'Supabase',
  'Redis',
  'SQLite',
  'Docker',
  'CI/CD',
  'GitHub Actions',
  'Nginx',
  'Linux',
  'Git',
  'JWT',
  'API',
  'REST',
  'GraphQL',
  'WebSocket',
  'CLI',
  'Automation',
  'DevOps',
  'Vitest',
  'SSR',
  'Astro',
] as const;

export const TECH_CHOICE_ROWS: PairRowsConfig<'techno', 'why'> = {
  heading: 'Pourquoi ces outils',
  idPrefix: 'tech',
  testIdPrefix: 'tech-choice',
  first: { key: 'techno', label: 'Outil', slug: 'techno', placeholder: 'NestJS' },
  second: { key: 'why', label: 'Raison', slug: 'why', placeholder: 'Pourquoi ce choix' },
  removeLabel: 'Supprimer le choix technique',
  addLabel: 'Ajouter un choix technique',
};

export const DECISION_ROWS: PairRowsConfig<'decision', 'rationale'> = {
  heading: "Décisions d'architecture",
  idPrefix: 'decision',
  testIdPrefix: 'decision',
  first: {
    key: 'decision',
    label: 'Décision',
    slug: 'text',
    placeholder: 'Architecture hexagonale',
  },
  second: {
    key: 'rationale',
    label: 'Justification',
    slug: 'rationale',
    placeholder: 'Justification',
  },
  removeLabel: 'Supprimer la décision',
  addLabel: 'Ajouter une décision',
};
