import type { Routes } from '@angular/router';
import { AdminLayout } from './pages/admin-layout/admin-layout';
import { unsavedChangesGuard } from './application/unsaved-changes-guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayout,
    children: [
      {
        path: '',
        title: "Vue d'ensemble | Admin",
        loadComponent: () =>
          import('./pages/admin-overview/admin-overview').then((m) => m.AdminOverview),
      },
      {
        path: 'projects/new',
        title: 'Nouveau projet | Admin',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import('./pages/admin-project-editor/admin-project-editor').then(
            (m) => m.AdminProjectEditor,
          ),
      },
      {
        path: 'projects/:id',
        title: 'Modifier un projet | Admin',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import('./pages/admin-project-editor/admin-project-editor').then(
            (m) => m.AdminProjectEditor,
          ),
      },
      {
        path: 'projects',
        title: 'Projets | Admin',
        loadComponent: () =>
          import('./pages/admin-projects/admin-projects').then((m) => m.AdminProjects),
      },
      {
        path: 'blog/new',
        title: 'Nouvel article | Admin',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import('./pages/admin-post-editor/admin-post-editor').then((m) => m.AdminPostEditor),
      },
      {
        path: 'blog/:id',
        title: 'Modifier un article | Admin',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import('./pages/admin-post-editor/admin-post-editor').then((m) => m.AdminPostEditor),
      },
      {
        path: 'blog',
        title: 'Articles | Admin',
        loadComponent: () => import('./pages/admin-blog/admin-blog').then((m) => m.AdminBlog),
      },
      {
        path: 'cv',
        title: 'CV | Admin',
        loadComponent: () => import('./pages/admin-cv/admin-cv').then((m) => m.AdminCv),
      },
      {
        path: 'messages',
        title: 'Messages | Admin',
        loadComponent: () =>
          import('./pages/admin-messages/admin-messages').then((m) => m.AdminMessages),
      },
      {
        path: 'audience',
        title: 'Audience | Admin',
        loadComponent: () =>
          import('./pages/admin-audience/admin-audience').then((m) => m.AdminAudience),
      },
      {
        path: 'settings',
        title: 'Paramètres | Admin',
        loadComponent: () =>
          import('./pages/admin-settings/admin-settings').then((m) => m.AdminSettings),
      },
      {
        path: 'settings/security',
        title: 'Sécurité | Admin',
        loadComponent: () =>
          import('../auth/pages/two-factor-setup/two-factor-setup').then((m) => m.TwoFactorSetup),
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
      { path: 'analytics', redirectTo: 'audience', pathMatch: 'full' },
      { path: 'analytics/visits', redirectTo: 'audience', pathMatch: 'full' },
      { path: 'analytics/projects', redirectTo: 'audience', pathMatch: 'full' },
      { path: 'stats', redirectTo: 'audience', pathMatch: 'full' },
      { path: 'security', redirectTo: 'settings/security', pathMatch: 'full' },

      { path: '**', redirectTo: '' },
    ],
  },
];
