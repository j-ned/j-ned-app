import type { HeroData } from '../../domain/models/hero.model';
import type { HomeHighlight } from '../../domain/models/home-highlight.model';

export const STATIC_HERO: HeroData = {
  id: 'c64a566f-9e53-44f9-96de-f938f0166b9c',
  name: 'Développeur Angular',
  tagline:
    "Reconversion réussie depuis l'industrie. Je recherche un CDI en Île-de-France pour rejoindre une équipe produit en fintech, greentech ou industrial tech.",
  availability: 'Ouvert aux opportunités',
};

export const STATIC_HOME_HIGHLIGHTS: readonly HomeHighlight[] = [
  {
    id: 'ba0760a4-4576-4136-a1d0-a78aa969de15',
    title: 'Frontend Moderne',
    description:
      'Applications Angular réactives avec architecture signals, standalone components et contrôle de flux optimisé. TypeScript strict pour une maintenance facilitée et moins de bugs en production.',
    icon: 'lucide-layers',
  },
  {
    id: '1caf531c-24d0-4c46-b26d-9105b6a5304a',
    title: 'Backend & Data',
    description:
      "APIs REST avec NestJS : architecture modulaire, validation stricte des données, gestion d'erreurs professionnelle. PostgreSQL optimisé pour la performance et l'intégrité des données.",
    icon: 'lucide-database',
  },
  {
    id: 'd6c5d2a6-a7f1-4d8b-9573-5a4219a8424c',
    title: 'Déploiement & Infrastructure',
    description:
      'Déploiements Docker automatisés, infrastructure self-hosted haute disponibilité (Traefik reverse proxy, Dokploy orchestration). CI/CD pour des mises en production sans friction.',
    icon: 'lucide-boxes',
  },
];
