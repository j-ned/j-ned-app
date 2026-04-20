import type { Routes } from '@angular/router';
import { authGuard } from '@features/auth/infrastructure';
import { Home } from '@features/home/application/home';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Accueil | Julien Nédellec',
    component: Home,
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
    loadComponent: () => import('./features/profile/application/about').then((m) => m.About),
    data: {
      preload: true,
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
    loadChildren: () =>
      import('./features/projects/projects.routes').then((m) => m.PROJECTS_ROUTES),
    data: {
      preload: true,
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
    loadChildren: () => import('./features/contact/contact.routes').then((m) => m.CONTACT_ROUTES),
    data: {
      preload: true,
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
    path: 'booking',
    title: 'Réservation | Julien Nédellec',
    loadChildren: () => import('./features/booking/booking.routes').then((m) => m.BOOKING_ROUTES),
    data: {
      seo: {
        title: 'Réservation de consultation - Julien Nédellec',
        description: 'Réservez un créneau pour un appel de découverte ou une consultation projet.',
        keywords: 'réservation, consultation, rendez-vous, développeur Angular',
        url: 'https://www.julien-nedellec.fr/booking',
        type: 'website',
      },
    },
  },
  {
    path: 'login',
    title: 'Connexion | Julien Nédellec',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.LOGIN_ROUTES),
  },
  {
    path: 'two-factor',
    title: 'Vérification 2FA | Julien Nédellec',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.TWO_FACTOR_ROUTES),
  },
  {
    path: 'admin',
    canMatch: [authGuard],
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: '**',
    title: '404 | Page non trouvée',
    loadComponent: () => import('./pages/page-not-found').then((m) => m.PageNotFound),
  },
];
