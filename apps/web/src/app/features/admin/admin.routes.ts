import type { Routes } from '@angular/router';
import { providePrimeNGTheme } from '@core/providers/primeng-theme';
import { AdminLayout } from './application';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayout,
    providers: [providePrimeNGTheme()],
    children: [
      // ─── Dashboard ──────────────────────────────────────────────
      {
        path: '',
        title: 'Dashboard | Admin',
        loadComponent: () => import('./application/admin-dashboard').then((m) => m.AdminDashboard),
      },

      // ─── Contenu ────────────────────────────────────────────────
      {
        path: 'content',
        title: 'Contenu | Admin',
        loadComponent: () =>
          import('./application/admin-content-index').then((m) => m.AdminContentIndex),
      },
      {
        path: 'content/profile',
        title: 'Photo de profil | Admin',
        loadComponent: () => import('./application/admin-profile').then((m) => m.AdminProfile),
      },
      {
        path: 'content/cv',
        title: 'CV | Admin',
        loadComponent: () => import('./application/admin-cv').then((m) => m.AdminCv),
      },
      {
        path: 'content/projects',
        title: 'Projets | Admin',
        loadComponent: () => import('./application/admin-projects').then((m) => m.AdminProjects),
      },

      // ─── Boîte de réception ──────────────────────────────────────
      {
        path: 'inbox',
        title: 'Boîte de réception | Admin',
        loadComponent: () =>
          import('./application/admin-inbox-index').then((m) => m.AdminInboxIndex),
      },
      {
        path: 'inbox/messages',
        title: 'Messages | Admin',
        loadComponent: () => import('./application/admin-messages').then((m) => m.AdminMessages),
      },

      // ─── Analytics ───────────────────────────────────────────────
      {
        path: 'analytics',
        title: 'Analytics | Admin',
        loadComponent: () => import('./application/admin-analytics').then((m) => m.AdminAnalytics),
      },
      { path: 'analytics/visits', redirectTo: 'analytics', pathMatch: 'full' },
      { path: 'analytics/projects', redirectTo: 'analytics', pathMatch: 'full' },

      // ─── Paramètres ──────────────────────────────────────────────
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

      // ─── Backwards-compat redirects ──────────────────────────────
      { path: 'home', redirectTo: 'content', pathMatch: 'full' },
      { path: 'about', redirectTo: 'content', pathMatch: 'full' },
      { path: 'about/profile', redirectTo: 'content/profile', pathMatch: 'full' },
      { path: 'about/cv', redirectTo: 'content/cv', pathMatch: 'full' },
      { path: 'projects', redirectTo: 'content/projects', pathMatch: 'full' },
      { path: 'messages', redirectTo: 'inbox/messages', pathMatch: 'full' },
      { path: 'stats', redirectTo: 'analytics', pathMatch: 'full' },
      { path: 'security', redirectTo: 'settings/security', pathMatch: 'full' },

      { path: '**', redirectTo: '' },
    ],
  },
];
