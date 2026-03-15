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
    loadComponent: () => import('./features/projects/application/projects').then((m) => m.Projects),
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
    loadComponent: () => import('./features/contact/application/contact').then((m) => m.Contact),
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
    loadComponent: () => import('./features/booking/application/booking').then((m) => m.Booking),
    data: {
      preload: true,
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
    path: 'blog',
    title: 'Blog | Julien Nédellec',
    loadComponent: () => import('./features/blog/application/blog-list').then((m) => m.BlogList),
    data: {
      preload: true,
      seo: {
        title: 'Blog | Julien Nédellec - Développeur Full-Stack',
        description:
          "Articles sur le développement web, Angular, NestJS et les bonnes pratiques. Retours d'expérience et tutoriels.",
        keywords: 'Blog Développeur, Angular, NestJS, TypeScript, Tutoriels, Bonnes pratiques',
        url: 'https://www.julien-nedellec.fr/blog',
        type: 'website',
      },
    },
  },
  {
    path: 'blog/:id',
    title: 'Article | Julien Nédellec',
    loadComponent: () =>
      import('./features/blog/application/blog-detail').then((m) => m.BlogDetail),
  },
  {
    path: 'login',
    title: 'Connexion | Julien Nédellec',
    loadComponent: () => import('./features/auth/application/login').then((m) => m.Login),
  },
  {
    path: 'two-factor',
    title: 'Vérification 2FA | Julien Nédellec',
    loadComponent: () =>
      import('./features/auth/application/two-factor-verify').then((m) => m.TwoFactorVerify),
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
