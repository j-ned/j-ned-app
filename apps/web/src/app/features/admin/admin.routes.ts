import type { Routes } from '@angular/router';
import { AdminLayout } from './application';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayout,
    children: [
      {
        path: '',
        title: 'Dashboard | Admin',
        loadComponent: () => import('./application/admin-dashboard').then((m) => m.AdminDashboard),
      },
      {
        path: 'home',
        title: "Page d'accueil | Admin",
        loadComponent: () => import('./application/admin-home').then((m) => m.AdminHome),
      },
      {
        path: 'home/hero',
        title: 'Hero | Admin',
        loadComponent: () => import('./application/admin-hero').then((m) => m.AdminHero),
      },
      {
        path: 'home/services',
        title: 'Prestations | Admin',
        loadComponent: () => import('./application/admin-services').then((m) => m.AdminServices),
      },
      {
        path: 'home/services/new',
        title: 'Nouvelle prestation | Admin',
        loadComponent: () =>
          import('./application/admin-service-form').then((m) => m.AdminServiceForm),
      },
      {
        path: 'home/services/:id/edit',
        title: 'Modifier prestation | Admin',
        loadComponent: () =>
          import('./application/admin-service-form').then((m) => m.AdminServiceForm),
      },
      {
        path: 'home/highlights',
        title: 'Points forts (Accueil) | Admin',
        loadComponent: () =>
          import('./application/admin-home-highlights').then((m) => m.AdminHomeHighlights),
      },
      {
        path: 'home/highlights/new',
        title: 'Nouveau point fort (Accueil) | Admin',
        loadComponent: () =>
          import('./application/admin-home-highlight-form').then((m) => m.AdminHomeHighlightForm),
      },
      {
        path: 'home/highlights/:id/edit',
        title: 'Modifier point fort (Accueil) | Admin',
        loadComponent: () =>
          import('./application/admin-home-highlight-form').then((m) => m.AdminHomeHighlightForm),
      },
      {
        path: 'blog',
        title: 'Blog | Admin',
        loadComponent: () => import('./application/admin-blog').then((m) => m.AdminBlog),
      },
      {
        path: 'blog/articles',
        title: 'Articles | Admin',
        loadComponent: () => import('./application/admin-articles').then((m) => m.AdminArticles),
      },
      {
        path: 'blog/articles/new',
        title: 'Nouvel article | Admin',
        loadComponent: () =>
          import('./application/admin-article-form').then((m) => m.AdminArticleForm),
      },
      {
        path: 'blog/articles/:id/edit',
        title: 'Modifier article | Admin',
        loadComponent: () =>
          import('./application/admin-article-form').then((m) => m.AdminArticleForm),
      },
      {
        path: 'blog/comments',
        title: 'Commentaires | Admin',
        loadComponent: () => import('./application/admin-comments').then((m) => m.AdminComments),
      },
      {
        path: 'projects',
        title: 'Projets | Admin',
        loadComponent: () =>
          import('./application/admin-projects').then((m) => m.AdminProjects),
      },
      {
        path: 'calendar',
        title: 'Calendrier | Admin',
        loadComponent: () => import('./application/admin-calendar').then((m) => m.AdminCalendar),
      },
      {
        path: 'messages',
        title: 'Messages | Admin',
        loadComponent: () => import('./application/admin-messages').then((m) => m.AdminMessages),
      },
      {
        path: 'stats',
        title: 'Statistiques | Admin',
        loadComponent: () => import('./application/admin-stats-hub').then((m) => m.AdminStatsHub),
      },
      {
        path: 'about',
        title: 'À propos | Admin',
        loadComponent: () => import('./application/admin-about').then((m) => m.AdminAbout),
      },
      {
        path: 'about/cv',
        title: 'CV | Admin',
        loadComponent: () => import('./application/admin-cv').then((m) => m.AdminCv),
      },
      {
        path: 'about/profile',
        title: 'Profil | Admin',
        loadComponent: () => import('./application/admin-profile').then((m) => m.AdminProfile),
      },
      {
        path: 'about/biography',
        title: 'Biographie | Admin',
        loadComponent: () => import('./application/admin-biography').then((m) => m.AdminBiography),
      },
      {
        path: 'about/what-i-seek',
        title: 'Ce que je cherche | Admin',
        loadComponent: () =>
          import('./application/admin-what-i-seek').then((m) => m.AdminWhatISeek),
      },
      {
        path: 'about/diplomas',
        title: 'Diplômes | Admin',
        loadComponent: () => import('./application/admin-diplomas').then((m) => m.AdminDiplomas),
      },
      {
        path: 'about/diplomas/new',
        title: 'Nouveau diplôme | Admin',
        loadComponent: () =>
          import('./application/admin-diploma-form').then((m) => m.AdminDiplomaForm),
      },
      {
        path: 'about/diplomas/:id/edit',
        title: 'Modifier diplôme | Admin',
        loadComponent: () =>
          import('./application/admin-diploma-form').then((m) => m.AdminDiplomaForm),
      },
      {
        path: 'about/highlights',
        title: 'Points forts | Admin',
        loadComponent: () =>
          import('./application/admin-highlights').then((m) => m.AdminHighlights),
      },
      {
        path: 'about/highlights/new',
        title: 'Nouveau point fort | Admin',
        loadComponent: () =>
          import('./application/admin-highlight-form').then((m) => m.AdminHighlightForm),
      },
      {
        path: 'about/highlights/:id/edit',
        title: 'Modifier point fort | Admin',
        loadComponent: () =>
          import('./application/admin-highlight-form').then((m) => m.AdminHighlightForm),
      },
      {
        path: 'about/what-i-do',
        title: 'Ce que je fais | Admin',
        loadComponent: () =>
          import('./application/admin-what-i-do-list').then((m) => m.AdminWhatIDoList),
      },
      {
        path: 'about/what-i-do/new',
        title: 'Nouveau — Ce que je fais | Admin',
        loadComponent: () =>
          import('./application/admin-what-i-do-form').then((m) => m.AdminWhatIDoForm),
      },
      {
        path: 'about/what-i-do/:id/edit',
        title: 'Modifier — Ce que je fais | Admin',
        loadComponent: () =>
          import('./application/admin-what-i-do-form').then((m) => m.AdminWhatIDoForm),
      },
      {
        path: 'about/social-buttons',
        title: 'Boutons sociaux | Admin',
        loadComponent: () =>
          import('./application/admin-social-buttons').then((m) => m.AdminSocialButtons),
      },
      {
        path: 'about/social-buttons/new',
        title: 'Nouveau bouton social | Admin',
        loadComponent: () =>
          import('./application/admin-social-button-form').then((m) => m.AdminSocialButtonForm),
      },
      {
        path: 'about/social-buttons/:id/edit',
        title: 'Modifier bouton social | Admin',
        loadComponent: () =>
          import('./application/admin-social-button-form').then((m) => m.AdminSocialButtonForm),
      },
      {
        path: 'about/technologies',
        title: 'Technologies | Admin',
        loadComponent: () =>
          import('./application/admin-technologies').then((m) => m.AdminTechnologies),
      },
      {
        path: 'about/technologies/new',
        title: 'Nouvelle technologie | Admin',
        loadComponent: () =>
          import('./application/admin-technology-form').then((m) => m.AdminTechnologyForm),
      },
      {
        path: 'about/technologies/:id/edit',
        title: 'Modifier technologie | Admin',
        loadComponent: () =>
          import('./application/admin-technology-form').then((m) => m.AdminTechnologyForm),
      },
      {
        path: 'security',
        title: 'Sécurité | Admin',
        loadComponent: () =>
          import('../auth/application/two-factor-setup').then((m) => m.TwoFactorSetup),
      },
      {
        path: '**',
        redirectTo: '',
      },
    ],
  },
];
