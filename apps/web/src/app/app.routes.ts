import { Routes } from '@angular/router';
import { seoGuard } from './core/seo/guards/seo.guard';
import { projectsSeoResolver } from './pages/projects/projects.resolver';

export const routes: Routes = [
  {
    path: '',
    title: 'Accueil | Julien Nédellec',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
    canActivate: [seoGuard],
    data: {
      seo: {
        title: 'Julien Nédellec | Développeur Full-Stack Angular & NestJS',
        description:
          "Développeur Full-Stack spécialisé en Angular et NestJS. Création d'applications web modernes, performantes et optimisées SEO. Disponible pour vos projets web.",
        keywords:
          'Développeur Angular, Développeur NestJS, TypeScript, Full-Stack, PostgreSQL, Docker, Développeur Web, France',
        url: 'https://www.julien-nedellec.fr',
        type: 'website',
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: 'Julien Nédellec',
          jobTitle: 'Développeur Full-Stack',
          url: 'https://www.julien-nedellec.fr',
          sameAs: [
            'https://www.linkedin.com/in/julien-nedellec/',
            'https://github.com/djoudj-dev',
            'https://x.com/djoudjDev',
          ],
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Voisins-Le-Bretonneux',
            addressCountry: 'FR',
          },
          knowsAbout: ['Angular', 'NestJS', 'TypeScript', 'PostgreSQL', 'Docker'],
          email: 'contact@julien-nedellec.fr',
        },
      },
    },
  },
  {
    path: 'about',
    title: 'À propos | Julien Nédellec',
    loadComponent: () => import('./pages/about/about').then((m) => m.About),
    canActivate: [seoGuard],
    data: {
      seo: {
        title: 'À propos | Julien Nédellec - Développeur Full-Stack',
        description:
          "Découvrez mon parcours de 20 ans dans l'industrie à reconversion développeur. Spécialiste Angular, NestJS et TypeScript. Exigence, autonomie et vision d'ensemble.",
        keywords:
          'Développeur Angular, Reconversion professionnelle, Full-Stack, TypeScript, NestJS, PostgreSQL, Docker',
        url: 'https://www.julien-nedellec.fr/about',
        type: 'profile',
      },
    },
  },
  {
    path: 'projects',
    title: 'Projets | Julien Nédellec',
    loadComponent: () => import('./pages/projects/projects').then((m) => m.Projects),
    canActivate: [seoGuard],
    resolve: {
      seoData: projectsSeoResolver,
    },
    data: {
      seo: {
        title: 'Projets | Julien Nédellec - Portfolio Développeur Full-Stack',
        description:
          'Découvrez mes projets Angular, NestJS et TypeScript. Applications web modernes, APIs REST, déploiements Docker. Code production-ready et bonnes pratiques.',
        keywords:
          'Portfolio Angular, Projets NestJS, Applications TypeScript, Développeur Full-Stack, PostgreSQL, Docker',
        url: 'https://www.julien-nedellec.fr/projects',
        type: 'website',
      },
    },
  },
  {
    path: 'contact',
    title: 'Contact | Julien Nédellec',
    loadComponent: () => import('./pages/contact/contact').then((m) => m.Contact),
    canActivate: [seoGuard],
    data: {
      seo: {
        title: 'Contact | Julien Nédellec - Développeur Full-Stack',
        description:
          "Contactez-moi pour vos projets Angular, NestJS ou TypeScript. Disponible pour missions de développement, refonte d'applications ou conseil technique.",
        keywords:
          'Contact Développeur, Mission Angular, Freelance NestJS, Développeur disponible, Conseil technique',
        url: 'https://www.julien-nedellec.fr/contact',
        type: 'website',
      },
    },
  },
  {
    path: '**',
    title: '404 | Page non trouvée',
    loadComponent: () => import('./pages/page-not-found').then((m) => m.PageNotFound),
  },
];
