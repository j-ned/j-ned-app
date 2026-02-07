import type { HeroData, Speciality, Tech } from '../../domain/models';

export const HERO_DATA: HeroData = {
  name: 'Julien NÉDELLEC',
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
      'Applications Angular réactives avec architecture signals, standalone components et contrôle de flux optimisé. TypeScript strict pour une maintenance facilitée et moins de bugs en production.',
  },
  {
    title: 'Backend & Data',
    description:
      "APIs REST avec NestJS : architecture modulaire, validation stricte des données, gestion d'erreurs professionnelle. PostgreSQL optimisé pour la performance et l'intégrité des données.",
  },
  {
    title: 'Déploiement & Infrastructure',
    description:
      'Déploiements Docker automatisés, infrastructure self-hosted haute disponibilité (Traefik reverse proxy, Dokploy orchestration). CI/CD pour des mises en production sans friction.',
  },
] as const;

export const TECH_STACK: readonly Tech[] = [
  { name: 'Angular', category: 'Framework', icon: 'angular' },
  { name: 'NestJS', category: 'Backend', icon: 'nestjs' },
  { name: 'TypeScript', category: 'Language', icon: 'typescript' },
  { name: 'Tailwind CSS', category: 'Styling', icon: 'tailwindcss' },
  { name: 'PostgreSQL', category: 'Database', icon: 'postgresql' },
  { name: 'Docker', category: 'DevOps', icon: 'docker' },
] as const;
