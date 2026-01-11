import type { SeoMetadata, StructuredData } from '../../../core/seo/models';
import { PROJECTS } from '../../projects/in-memory/projects.data';

export const SEO_METADATA_MAP: Record<string, SeoMetadata> = {
  '/': {
    title: 'Julien Nédellec - Développeur Full-Stack Angular & NestJS',
    description:
      "Développeur web spécialisé en Angular et NestJS. Création d'applications modernes, performantes et scalables.",
    keywords:
      'développeur angular, développeur nestjs, développeur typescript, développeur full-stack',
    url: 'https://www.julien-nedellec.fr',
    image: 'https://www.julien-nedellec.fr/photoProfil.webp',
    type: 'website',
  },
  '/about': {
    title: 'À propos | Julien Nédellec',
    description: 'Découvrez mon parcours, mes compétences et ma passion pour le développement web.',
    url: 'https://www.julien-nedellec.fr/about',
  },
  '/projects': {
    title: 'Mes Projets | Julien Nédellec',
    description:
      'Portfolio de mes projets Angular, NestJS et TypeScript. Applications web modernes et performantes.',
    url: 'https://www.julien-nedellec.fr/projects',
  },
  '/contact': {
    title: 'Contact | Julien Nédellec',
    description: "Contactez-moi pour discuter de votre projet web ou d'une collaboration.",
    url: 'https://www.julien-nedellec.fr/contact',
  },
};

export const STRUCTURED_DATA_MAP: Record<string, StructuredData> = {
  '/projects': {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: PROJECTS.sort((a, b) => a.order - b.order).map((project, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'CreativeWork',
        name: project.title,
        description: project.description,
        url: project.liveUrl || project.repoUrl || 'https://www.julien-nedellec.fr/projects',
      },
    })),
  },
};
