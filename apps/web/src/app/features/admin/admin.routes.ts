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
        path: 'projects',
        title: 'Projets | Admin',
        loadComponent: () => import('./application/admin-projects').then((m) => m.AdminProjects),
      },
      {
        path: 'cv',
        title: 'CV | Admin',
        loadComponent: () => import('./application/admin-cv').then((m) => m.AdminCv),
      },
      {
        path: 'messages',
        title: 'Messages | Admin',
        loadComponent: () => import('./application/admin-messages').then((m) => m.AdminMessages),
      },
      {
        path: 'analytics',
        title: 'Analytics | Admin',
        loadComponent: () => import('./application/admin-analytics').then((m) => m.AdminAnalytics),
      },
      { path: 'analytics/visits', redirectTo: 'analytics', pathMatch: 'full' },
      { path: 'analytics/projects', redirectTo: 'analytics', pathMatch: 'full' },
      {
        path: 'settings',
        title: 'Paramètres | Admin',
        loadComponent: () => import('./application/admin-settings').then((m) => m.AdminSettings),
      },
      {
        path: 'settings/security',
        title: 'Sécurité | Admin',
        loadComponent: () =>
          import('../auth/application/two-factor-setup').then((m) => m.TwoFactorSetup),
      },

      // Redirections des anciennes URLs (compat liens existants).
      { path: 'content', redirectTo: '', pathMatch: 'full' },
      { path: 'content/projects', redirectTo: 'projects', pathMatch: 'full' },
      { path: 'content/cv', redirectTo: 'cv', pathMatch: 'full' },
      { path: 'inbox', redirectTo: 'messages', pathMatch: 'full' },
      { path: 'inbox/messages', redirectTo: 'messages', pathMatch: 'full' },
      { path: 'home', redirectTo: '', pathMatch: 'full' },
      { path: 'about', redirectTo: '', pathMatch: 'full' },
      { path: 'about/cv', redirectTo: 'cv', pathMatch: 'full' },
      { path: 'stats', redirectTo: 'analytics', pathMatch: 'full' },
      { path: 'security', redirectTo: 'settings/security', pathMatch: 'full' },

      { path: '**', redirectTo: '' },
    ],
  },
];
