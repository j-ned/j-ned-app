import type { HeroData } from '../../domain/models/hero.model';
import type { HomeHighlight } from '../../domain/models/home-highlight.model';

export const STATIC_HERO: HeroData = {
  id: 'c64a566f-9e53-44f9-96de-f938f0166b9c',
  name: 'Développeur Angular',
  tagline:
    'Angular, NestJS, PostgreSQL, Docker : je mène une application du composant à la mise en production.',
  support:
    'Ce site en est la preuve : rendu serveur, API NestJS, déployé en CI/CD sur ma propre infrastructure.',
  availability: 'Ouvert aux opportunités · CDI · Île-de-France',
};

export const STATIC_HOME_HIGHLIGHTS: readonly HomeHighlight[] = [
  {
    id: 'ba0760a4-4576-4136-a1d0-a78aa969de15',
    title: 'Frontend Moderne',
    description: 'Angular 22, signals, SSR et hydratation incrémentale. TypeScript strict.',
    icon: 'lucide-layers',
  },
  {
    id: '1caf531c-24d0-4c46-b26d-9105b6a5304a',
    title: 'Backend & Data',
    description: 'API NestJS modulaire, validation stricte, PostgreSQL indexé.',
    icon: 'lucide-database',
  },
  {
    id: 'd6c5d2a6-a7f1-4d8b-9573-5a4219a8424c',
    title: 'Déploiement & Infrastructure',
    description: "Docker, Traefik, Dokploy, CI/CD : je déploie et j'exploite.",
    icon: 'lucide-boxes',
  },
];
