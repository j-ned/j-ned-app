import type { Routes } from '@angular/router';
import { authGuard } from '@features/auth/infra/auth-guard';
import { HOME_REVIEWS } from '@features/home/domain/home-reviews.static-data';
import { reviewsJsonLd } from '@features/home/domain/reviews-json-ld';
import { Home } from '@features/home/pages/home/home';
import { OFFERS } from '@features/offer/domain/offer-catalog.static-data';
import { OFFERS_BASE_PATH, offerPath } from '@features/offer/domain/offer-path';
import { toOfferCatalogJsonLd } from '@features/offer/offer-seo';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';

const HOME_TITLE = 'Julien Nédellec | Sites et applications web, Yvelines';
const ABOUT_TITLE = 'Développeur full-stack Angular / NestJS, parcours et CV | Julien Nédellec';
const PROJECTS_TITLE = 'Réalisations Angular et NestJS en production | Julien Nédellec';
const BLOG_TITLE = 'Blog Angular, NestJS et auto-hébergement | Julien Nédellec';
const PERSON_ID = `${SITE_IDENTITY.siteUrl}/#person`;

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: HOME_TITLE,
    component: Home,
    data: {
      seo: {
        title: HOME_TITLE,
        description:
          'Sites et applications web livrés en production par un seul interlocuteur\u00a0: site vitrine en 7 jours, application sur mesure, maintenance. Yvelines et à distance.',
        keywords:
          'Développeur Angular, Développeur NestJS, TypeScript, Full-Stack, PostgreSQL, Docker, Développeur Web, France, Île-de-France, Industrie, Self-hosted',
        url: SITE_IDENTITY.siteUrl,
        type: 'website',
        structuredData: {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Person',
              '@id': PERSON_ID,
              name: 'Julien Nédellec',
              url: SITE_IDENTITY.siteUrl,
              sameAs: [
                SITE_IDENTITY.socials.linkedin,
                SITE_IDENTITY.socials.github,
                SITE_IDENTITY.socials.malt,
              ],
              knowsAbout: [
                'Angular',
                'NestJS',
                'TypeScript',
                'Node.js',
                'Angular Signals',
                'PostgreSQL',
                'Drizzle ORM',
                'Docker',
              ],
              email: SITE_IDENTITY.email,
            },
            {
              '@type': 'ProfessionalService',
              name: 'Julien Nédellec',
              url: SITE_IDENTITY.siteUrl,
              founder: { '@id': PERSON_ID },
              address: {
                '@type': 'PostalAddress',
                addressLocality: SITE_IDENTITY.location,
                addressCountry: 'FR',
              },
              areaServed: [
                { '@type': 'AdministrativeArea', name: 'Yvelines' },
                { '@type': 'AdministrativeArea', name: 'Île-de-France' },
                { '@type': 'Country', name: 'France' },
              ],
              hasOfferCatalog: toOfferCatalogJsonLd(OFFERS),
              ...reviewsJsonLd(HOME_REVIEWS),
            },
          ],
        },
      },
    },
  },
  {
    path: 'about',
    title: ABOUT_TITLE,
    loadComponent: () => import('./features/profile/pages/about/about').then((m) => m.About),
    data: {
      preload: true,
      seo: {
        title: ABOUT_TITLE,
        description: `${SITE_IDENTITY.journey} Parcours, stack et CV.`,
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
              name: 'Parcours',
              item: `${SITE_IDENTITY.siteUrl}/about`,
            },
          ],
        },
      },
    },
  },
  {
    path: 'projects',
    title: PROJECTS_TITLE,
    loadChildren: () =>
      import('./features/projects/projects.routes').then((m) => m.PROJECTS_ROUTES),
    data: {
      preload: true,
      seo: {
        title: PROJECTS_TITLE,
        description:
          'Applications Angular et NestJS en production, sites de démonstration et scripts\u00a0: le besoin réglé et les choix techniques de chaque projet.',
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
              name: 'Réalisations',
              item: `${SITE_IDENTITY.siteUrl}/projects`,
            },
          ],
        },
      },
    },
  },
  {
    path: 'blog',
    title: BLOG_TITLE,
    loadChildren: () => import('./features/blog/blog.routes').then((m) => m.BLOG_ROUTES),
    data: {
      preload: true,
      seo: {
        title: BLOG_TITLE,
        description:
          "Retours d'expérience réels sur Angular, NestJS, PostgreSQL et le déploiement self-hosted.",
        keywords: "Blog Angular, Blog NestJS, Développeur Full-Stack, Retour d'expérience",
        url: `${SITE_IDENTITY.siteUrl}/blog`,
        type: 'website',
      },
    },
  },
  {
    path: OFFERS_BASE_PATH,
    loadChildren: () => import('./features/offer/offer.routes').then((m) => m.OFFER_ROUTES),
    data: { preload: true },
  },
  {
    path: 'offre-site-industrie',
    redirectTo: offerPath('site-atelier'),
  },
  {
    path: 'mentions-legales',
    title: 'Mentions légales | Julien Nédellec',
    loadComponent: () => import('./pages/legal-notice').then((m) => m.LegalNotice),
    data: {
      seo: {
        title: 'Mentions légales | Julien Nédellec',
        description: 'Éditeur, hébergement et propriété intellectuelle du site nedellec-julien.fr.',
        url: `${SITE_IDENTITY.siteUrl}/mentions-legales`,
        type: 'website',
      },
    },
  },
  {
    path: 'confidentialite',
    title: 'Politique de confidentialité | Julien Nédellec',
    loadComponent: () => import('./pages/privacy-policy').then((m) => m.PrivacyPolicy),
    data: {
      seo: {
        title: 'Politique de confidentialité | Julien Nédellec',
        description:
          "Ce que le site collecte et pourquoi\u00a0: formulaire de contact, mesure d'audience sans cookie, commentaires, suivi des erreurs, vos droits.",
        url: `${SITE_IDENTITY.siteUrl}/confidentialite`,
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
