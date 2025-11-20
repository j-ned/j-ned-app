export interface Speciality {
  readonly title: string;
  readonly description: string;
}

export interface Tech {
  readonly name: string;
  readonly category: string;
  readonly icon?: string;
}

export interface AboutSection {
  readonly title: string;
  readonly paragraphs: readonly string[];
  readonly specializations: readonly string[];
}

export interface ProjectsSection {
  readonly title: string;
  readonly description: string;
}

export interface CTASection {
  readonly title: string;
  readonly description: string;
}

export const HERO_DATA = {
  name: 'Julien Nedellec',
  tagline: "Développeur d'applications web modernes avec",
  technologies: ['Angular', 'NestJS'],
  description:
    'Je conçois des applications web modernes avec un focus sur la qualité du code, la performance et les bonnes pratiques. Du développement au déploiement.',
  availability: 'Disponible pour nouvelles missions',
} as const;

export const SPECIALITIES: readonly Speciality[] = [
  {
    title: 'Frontend Moderne',
    description:
      'Angular avec les dernières features (Signals, Control Flow...), TypeScript et architecture componentisée',
  },
  {
    title: 'Backend & Data',
    description:
      'NestJS pour les APIs REST, PostgreSQL pour la persistance, architecture modulaire et maintenable',
  },
  {
    title: 'Déploiement & Infrastructure',
    description:
      'Docker, VPS self-hosted (Traefik, Dokploy), CI/CD automatisé, WebStorm pour un workflow optimisé',
  },
] as const;

export const PROJECTS_SECTION: ProjectsSection = {
  title: 'Projets sélectionnés',
  description:
    "Une sélection de mes réalisations récentes. Chaque projet met l'accent sur la qualité du code, la performance et l'expérience utilisateur.",
} as const;

export const ABOUT_SECTION: AboutSection = {
  title: 'À propos',
  paragraphs: [
    "Développeur full-stack passionné par la création d'applications web modernes et performantes. Je me spécialise dans l'écosystème Angular et NestJS, avec un focus particulier sur l'architecture logicielle et les bonnes pratiques.",
    'Mon approche combine rigueur technique et pragmatisme : du code maintenable, des patterns éprouvés, et une infrastructure maîtrisée de bout en bout. De la conception à la mise en production.',
    "Actuellement disponible pour toutes vos missions de développement ou de refonte d'applications Angular/NestJS.",
  ],
  specializations: [
    'Architecture Angular moderne',
    'APIs REST avec NestJS et PostgreSQL',
    'Infrastructure Docker et déploiement CI/CD',
    'Optimisation performance et SEO',
  ],
} as const;

export const TECH_STACK: readonly Tech[] = [
  { name: 'Angular', category: 'Framework', icon: 'angular' },
  { name: 'NestJS', category: 'Backend', icon: 'nestjs' },
  { name: 'TypeScript', category: 'Language', icon: 'typescript' },
  { name: 'Tailwind CSS', category: 'Styling', icon: 'tailwindcss' },
  { name: 'PostgreSQL', category: 'Database', icon: 'postgresql' },
  { name: 'Docker', category: 'DevOps', icon: 'docker' },
] as const;

export const CTA_SECTION: CTASection = {
  title: 'Un projet en tête ?',
  description:
    "Je suis disponible pour des missions de développement full-stack, des refontes d'applications existantes ou du conseil technique.",
} as const;
