import type { Routes } from '@angular/router';
import { authGuard } from '@features/auth/infra/auth-guard';
import { Home } from '@features/home/pages/home/home';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';

const HOME_TITLE = 'Julien Nédellec | Tourneur CN et développeur web Angular / NestJS';
const ABOUT_TITLE = "Parcours\u00a0: de l'atelier au code | Julien Nédellec";
const PROJECTS_TITLE = 'Mes projets Angular et NestJS | Julien Nédellec';
const BLOG_TITLE = 'Blog Angular, NestJS et auto-hébergement | Julien Nédellec';
const WORKSHOP_TITLE = "L'atelier\u00a0: outils de tourneur CN | Julien Nédellec";
const INSERT_GUIDE_TITLE = 'Guide des plaquettes de tournage | Julien Nédellec';
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
          "Tourneur CN dans l'aéronautique et développeur web par passion\u00a0: Angular, NestJS, auto-hébergement, et des projets qui tournent vraiment.",
        keywords:
          'Angular, NestJS, TypeScript, PostgreSQL, Drizzle ORM, Docker, auto-hébergement, développeur full-stack, blog technique',
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
              jobTitle: 'Tourneur CN',
              sameAs: [SITE_IDENTITY.socials.linkedin, SITE_IDENTITY.socials.github],
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
              '@type': 'WebSite',
              '@id': `${SITE_IDENTITY.siteUrl}/#website`,
              name: 'Julien Nédellec',
              url: SITE_IDENTITY.siteUrl,
              inLanguage: 'fr-FR',
              author: { '@id': PERSON_ID },
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
        description: `${SITE_IDENTITY.journey} Ma stack et mon CV.`,
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
    path: 'atelier',
    title: WORKSHOP_TITLE,
    loadComponent: () =>
      import('./features/workshop/pages/workshop/workshop').then((m) => m.Workshop),
    data: {
      preload: true,
      seo: {
        title: WORKSHOP_TITLE,
        description:
          "Mon coin de tourneur CN\u00a0: des outils d'usinage, à commencer par le guide des plaquettes que j'utilise à l'atelier, matière par matière.",
        url: `${SITE_IDENTITY.siteUrl}/atelier`,
        type: 'website',
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_IDENTITY.siteUrl },
            {
              '@type': 'ListItem',
              position: 2,
              name: "L'atelier",
              item: `${SITE_IDENTITY.siteUrl}/atelier`,
            },
          ],
        },
      },
    },
  },
  {
    path: 'atelier/plaquettes',
    title: INSERT_GUIDE_TITLE,
    loadComponent: () =>
      import('./features/workshop/pages/insert-guide/insert-guide').then((m) => m.InsertGuide),
    data: {
      seo: {
        title: INSERT_GUIDE_TITLE,
        description:
          "Les plaquettes de tournage que j'utilise à l'atelier, matière par matière\u00a0: opération, plaquette, rayon de bec et remarque, à adapter à ta machine.",
        url: `${SITE_IDENTITY.siteUrl}/atelier/plaquettes`,
        type: 'website',
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_IDENTITY.siteUrl },
            {
              '@type': 'ListItem',
              position: 2,
              name: "L'atelier",
              item: `${SITE_IDENTITY.siteUrl}/atelier`,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Guide des plaquettes',
              item: `${SITE_IDENTITY.siteUrl}/atelier/plaquettes`,
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
          "Les applications Angular et NestJS que j'utilise vraiment, des démos et quelques scripts\u00a0: pour chacun, le problème de départ et les choix techniques.",
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
          "Ce que j'apprends en construisant mes projets\u00a0: Angular, NestJS, PostgreSQL et l'auto-hébergement, erreurs comprises.",
        keywords: "Blog Angular, Blog NestJS, Développeur Full-Stack, Retour d'expérience",
        url: `${SITE_IDENTITY.siteUrl}/blog`,
        type: 'website',
      },
    },
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
          "Ce que le site collecte et pourquoi\u00a0: formulaire de contact, mesure d'audience sans cookie, commentaires, suivi des erreurs, et tes droits.",
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
