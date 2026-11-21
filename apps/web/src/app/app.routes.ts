import type { Routes } from '@angular/router';
import { authGuard } from '@features/auth/infra/auth-guard';
import { twoFactorChallengeGuard } from '@features/auth/infra/two-factor-challenge-guard';
import { Home } from '@features/home/pages/home/home';
import type { SeoData } from '@core/seo/seo';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { OWNER_NAME, PERSON_ID, PERSON_REF, pageTitle } from '@shared/seo/site-person';

const HOME_TITLE = `${OWNER_NAME} | Tourneur CN et développeur web Angular / Hono`;
const ABOUT_TITLE = pageTitle("Parcours\u00a0: de l'atelier au code");
const PROJECTS_TITLE = pageTitle('Mes projets Angular full-stack');
const BLOG_TITLE = pageTitle('Blog Angular, Hono et mise en production');

type Crumb = readonly [name: string, path: string];

/** Fil d'Ariane JSON-LD d'une page, toujours ancré sur l'accueil. */
function breadcrumb(...crumbs: readonly Crumb[]): Record<string, unknown> {
  const trail: readonly Crumb[] = [['Accueil', ''], ...crumbs];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map(([name, path], index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name,
      item: `${SITE_IDENTITY.siteUrl}${path}`,
    })),
  };
}

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
          "Tourneur CN dans l'aéronautique et développeur web par passion\u00a0: Angular, Hono, PostgreSQL, et des projets qui tournent vraiment.",
        keywords:
          'Angular, Hono, TypeScript, PostgreSQL, Drizzle ORM, Vercel, développeur full-stack, blog technique',
        url: SITE_IDENTITY.siteUrl,
        type: 'website',
        structuredData: {
          '@context': 'https://schema.org',
          '@graph': [
            {
              ...PERSON_REF,
              jobTitle: 'Tourneur CN',
              sameAs: [SITE_IDENTITY.socials.linkedin, SITE_IDENTITY.socials.github],
              knowsAbout: [
                'Angular',
                'Hono',
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
              name: OWNER_NAME,
              url: SITE_IDENTITY.siteUrl,
              inLanguage: 'fr-FR',
              author: { '@id': PERSON_ID },
            },
          ],
        },
      } satisfies SeoData,
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
        keywords: 'Développeur Angular, Full-Stack, TypeScript, Hono, PostgreSQL',
        url: `${SITE_IDENTITY.siteUrl}/about`,
        type: 'profile',
        structuredData: breadcrumb(['Parcours', '/about']),
      } satisfies SeoData,
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
          "Les applications Angular que j'utilise vraiment, des démos et quelques scripts\u00a0: pour chacun, le problème de départ et les choix techniques.",
        keywords:
          'Portfolio Angular, Projets Hono, Applications TypeScript, Développeur Full-Stack, PostgreSQL',
        url: `${SITE_IDENTITY.siteUrl}/projects`,
        type: 'website',
        structuredData: breadcrumb(['Réalisations', '/projects']),
      } satisfies SeoData,
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
          "Ce que j'apprends en construisant mes projets\u00a0: Angular, Hono, PostgreSQL et la mise en production, erreurs comprises.",
        keywords: "Blog Angular, Blog Hono, Développeur Full-Stack, Retour d'expérience",
        url: `${SITE_IDENTITY.siteUrl}/blog`,
        type: 'website',
      } satisfies SeoData,
    },
  },
  {
    path: 'mentions-legales',
    title: pageTitle('Mentions légales'),
    loadComponent: () => import('./pages/legal-notice').then((m) => m.LegalNotice),
    data: {
      seo: {
        title: pageTitle('Mentions légales'),
        description: 'Éditeur, hébergement et propriété intellectuelle du site nedellec-julien.fr.',
        url: `${SITE_IDENTITY.siteUrl}/mentions-legales`,
        type: 'website',
      } satisfies SeoData,
    },
  },
  {
    path: 'confidentialite',
    title: pageTitle('Politique de confidentialité'),
    loadComponent: () => import('./pages/privacy-policy').then((m) => m.PrivacyPolicy),
    data: {
      seo: {
        title: pageTitle('Politique de confidentialité'),
        description:
          "Ce que le site collecte et pourquoi\u00a0: formulaire de contact, mesure d'audience sans cookie, commentaires, suivi des erreurs, et tes droits.",
        url: `${SITE_IDENTITY.siteUrl}/confidentialite`,
        type: 'website',
      } satisfies SeoData,
    },
  },
  {
    path: 'login',
    title: pageTitle('Connexion'),
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.LOGIN_ROUTES),
  },
  {
    path: 'two-factor',
    title: pageTitle('Vérification 2FA'),
    canMatch: [twoFactorChallengeGuard],
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
