import type { Routes } from '@angular/router';
import { authGuard } from '@features/auth/infra';
import { Home } from '@features/home/application/home';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';

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
        url: SITE_IDENTITY.siteUrl,
        type: 'website',
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: 'Julien Nédellec',
          jobTitle: 'Développeur Full-Stack',
          url: SITE_IDENTITY.siteUrl,
          sameAs: [
            SITE_IDENTITY.socials.linkedin,
            SITE_IDENTITY.socials.github,
            SITE_IDENTITY.socials.x,
          ],
          address: {
            '@type': 'PostalAddress',
            addressLocality: SITE_IDENTITY.location,
            addressCountry: 'FR',
          },
          knowsAbout: ['Angular', 'NestJS', 'TypeScript', 'PostgreSQL', 'Docker'],
          email: SITE_IDENTITY.email,
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
        url: `${SITE_IDENTITY.siteUrl}/about`,
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
        url: `${SITE_IDENTITY.siteUrl}/projects`,
        type: 'website',
      },
    },
  },
  {
    path: 'contact',
    title: 'Contact | Julien Nédellec',
    loadComponent: () =>
      import('./features/contact/application/contact-form').then((m) => m.ContactForm),
    data: {
      preload: true,
      seo: {
        title: 'Contact | Julien Nédellec - Développeur Full-Stack',
        description:
          'Une idée, un projet web Angular ou NestJS ? Contactez-moi via le formulaire — réponse rapide.',
        keywords:
          'Contact développeur Angular, Contact NestJS, Freelance Full-Stack, Devis projet web',
        url: `${SITE_IDENTITY.siteUrl}/contact`,
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
