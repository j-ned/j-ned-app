import type { Project } from '../../../core/projects/models';

export const PROJECTS: Project[] = [
  {
    id: 'arcadia',
    title: 'Zoo Arcadia',
    category: 'Application Web',
    tags: ['Angular', 'Typescript', 'TailwindCSS', 'NestJS', 'PostgreSQL', 'MongoDB', 'JWT'],
    description:
      "Application frontend moderne pour le Zoo Arcadia. Interface interactive pour la gestion complète d'un parc zoologique avec tableaux de bord dédiés pour administrateurs, vétérinaires et employés.",
    image: '/images/arcadia.avif',
    liveUrl: 'https://arcadia.nedellec-julien.fr/',
    repoUrlFront: 'https://github.com/djoudj-dev/arcadia-zoo-app-front',
    repoUrlBack: 'https://github.com/djoudj-dev/arcadia-zoo-app-back',
    featured: true,
    order: 4,
  },
  {
    id: 'candidash',
    title: 'CandiDash',
    category: 'Application Web',
    tags: ['Angular', 'Typescript', 'TailwindCSS', 'NestJS', 'PostgreSQL', 'Docker', 'Vitest'],
    description:
      "Application Angular moderne pour suivre ses candidatures d'emploi avec tableau de bord personnel. Suivi des candidatures, gestion des statuts, authentification multi-rôles et thème clair/sombre.",
    image: '/images/candidash.avif',
    liveUrl: 'https://candidash.djoudj.dev',
    repoUrlFront: 'https://github.com/djoudj-dev/ng-candidash-app',
    repoUrlBack: 'https://github.com/djoudj-dev/nest-candidash-app',
    featured: true,
    order: 1,
  },
  {
    id: 'gitpush-auto',
    title: 'GitPush Auto',
    category: 'Script',
    tags: ['Bash', 'Git', 'Automation', 'CLI'],
    description:
      "Script Bash pour automatiser les opérations Git. Simplifie l'ajout, le commit et le push de modifications avec une seule commande. Idéal pour accélérer le workflow de développement.",
    image: '/images/gitpush.avif',
    repoUrl: 'https://github.com/djoudj-dev/gitpush-auto',
    featured: false,
    order: 3,
  },
  {
    id: 'labelsync-pro',
    title: 'LabelSync Pro',
    category: 'Script',
    tags: ['Bash', 'GitHub', 'Automation', 'API', 'DevOps'],
    description:
      'Script Bash pour synchroniser les labels GitHub entre plusieurs dépôts. Automatise la gestion des labels avec import/export et réplication entre repositories. Gain de temps pour la standardisation des projets.',
    image: '/images/label-sync.avif',
    repoUrl: 'https://github.com/djoudj-dev/labelsync-pro',
    featured: false,
    order: 2,
  },
];

export const FEATURED_PROJECTS = PROJECTS.filter((p) => p.featured).sort(
  (a, b) => a.order - b.order,
);
