import type { Routes } from '@angular/router';
import { authGuard } from '@features/auth/infra/auth-guard';
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
          'Développeur Full-Stack Angular & NestJS. Applications web modernes, performantes et optimisées SEO — disponible pour vos projets.',
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
          "Développeur Angular, NestJS et TypeScript avec 20 ans d'expérience en industrie. Exigence, autonomie et vision d'ensemble.",
        keywords: 'Développeur Angular, Full-Stack, TypeScript, NestJS, PostgreSQL, Docker',
        url: `${SITE_IDENTITY.siteUrl}/about`,
        type: 'profile',
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_IDENTITY.siteUrl },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'À propos',
              item: `${SITE_IDENTITY.siteUrl}/about`,
            },
          ],
        },
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
          'Découvrez mes projets Angular, NestJS et TypeScript : applications web modernes, APIs REST, déploiements Docker, code production-ready.',
        keywords:
          'Portfolio Angular, Projets NestJS, Applications TypeScript, Développeur Full-Stack, PostgreSQL, Docker',
        url: `${SITE_IDENTITY.siteUrl}/projects`,
        type: 'website',
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_IDENTITY.siteUrl },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Projets',
              item: `${SITE_IDENTITY.siteUrl}/projects`,
            },
          ],
        },
      },
    },
  },
  {
    path: 'blog',
    title: 'Blog | Julien Nédellec',
    loadChildren: () => import('./features/blog/blog.routes').then((m) => m.BLOG_ROUTES),
    data: {
      preload: true,
      seo: {
        title: 'Blog | Julien Nédellec — Développeur Full-Stack Angular & NestJS',
        description:
          "Retours d'expérience réels sur Angular, NestJS, PostgreSQL et le déploiement self-hosted.",
        keywords: "Blog Angular, Blog NestJS, Développeur Full-Stack, Retour d'expérience",
        url: `${SITE_IDENTITY.siteUrl}/blog`,
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
