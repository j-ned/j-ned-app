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
          import('./application/admin-projects-hub').then((m) => m.AdminProjectsHub),
      },
      {
        path: 'projects/new',
        title: 'Nouveau projet | Admin',
        loadComponent: () =>
          import('./application/admin-project-form').then((m) => m.AdminProjectForm),
      },
      {
        path: 'projects/:id/edit',
        title: 'Modifier projet | Admin',
        loadComponent: () =>
          import('./application/admin-project-form').then((m) => m.AdminProjectForm),
      },
      {
        path: 'projects/:category',
        title: 'Projets | Admin',
        loadComponent: () => import('./application/admin-projects').then((m) => m.AdminProjects),
      },
      {
        path: 'calendar',
        title: 'Calendrier | Admin',
        loadComponent: () => import('./application/admin-calendar').then((m) => m.AdminCalendar),
      },
      {
        path: 'calendar/bookings',
        title: 'Réservations | Admin',
        loadComponent: () => import('./application/admin-bookings').then((m) => m.AdminBookings),
      },
      {
        path: 'calendar/availability',
        title: 'Disponibilités | Admin',
        loadComponent: () =>
          import('./application/admin-availability').then((m) => m.AdminAvailability),
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
        path: 'stats/overview',
        title: "Vue d'ensemble | Admin",
        loadComponent: () => import('./application/admin-stats').then((m) => m.AdminStatsOverview),
      },
      {
        path: 'stats/articles',
        title: 'Stats articles | Admin',
        loadComponent: () =>
          import('./application/admin-stats-articles').then((m) => m.AdminStatsArticles),
      },
      {
        path: 'stats/projects',
        title: 'Stats projets | Admin',
        loadComponent: () =>
          import('./application/admin-stats-projects').then((m) => m.AdminStatsProjects),
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
    ],
  },
];
