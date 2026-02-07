import type { Routes } from '@angular/router';
import { AdminLayout } from './application/admin-layout';

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
        path: 'articles',
        title: 'Articles | Admin',
        loadComponent: () => import('./application/admin-articles').then((m) => m.AdminArticles),
      },
      {
        path: 'articles/new',
        title: 'Nouvel article | Admin',
        loadComponent: () =>
          import('./application/admin-article-form').then((m) => m.AdminArticleForm),
      },
      {
        path: 'articles/:id/edit',
        title: 'Modifier article | Admin',
        loadComponent: () =>
          import('./application/admin-article-form').then((m) => m.AdminArticleForm),
      },
      {
        path: 'comments',
        title: 'Commentaires | Admin',
        loadComponent: () => import('./application/admin-comments').then((m) => m.AdminComments),
      },
      {
        path: 'projects',
        title: 'Projets | Admin',
        loadComponent: () => import('./application/admin-projects').then((m) => m.AdminProjects),
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
        path: 'bookings',
        title: 'Réservations | Admin',
        loadComponent: () => import('./application/admin-bookings').then((m) => m.AdminBookings),
      },
      {
        path: 'availability',
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
        loadComponent: () => import('./application/admin-stats').then((m) => m.AdminStats),
      },
      {
        path: 'cv',
        title: 'CV | Admin',
        loadComponent: () => import('./application/admin-cv').then((m) => m.AdminCv),
      },
    ],
  },
];
