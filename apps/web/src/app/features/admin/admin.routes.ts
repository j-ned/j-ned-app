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
        path: 'content/hero',
        title: 'Hero | Admin',
        loadComponent: () => import('./application/admin-hero').then((m) => m.AdminHero),
      },
      {
        path: 'content/profile',
        title: 'Profil | Admin',
        loadComponent: () => import('./application/admin-profile').then((m) => m.AdminProfile),
      },
      {
        path: 'content/biography',
        title: 'Biographie | Admin',
        loadComponent: () => import('./application/admin-biography').then((m) => m.AdminBiography),
      },
      {
        path: 'content/cv',
        title: 'CV | Admin',
        loadComponent: () => import('./application/admin-cv').then((m) => m.AdminCv),
      },
      {
        path: 'content/highlights',
        title: 'Points forts | Admin',
        loadComponent: () =>
          import('./application/admin-highlights').then((m) => m.AdminHighlights),
      },
      {
        path: 'content/highlights/new',
        title: 'Nouveau point fort | Admin',
        loadComponent: () =>
          import('./application/admin-highlight-form').then((m) => m.AdminHighlightForm),
      },
      {
        path: 'content/highlights/:id/edit',
        title: 'Modifier point fort | Admin',
        loadComponent: () =>
          import('./application/admin-highlight-form').then((m) => m.AdminHighlightForm),
      },
      {
        path: 'content/what-i-do',
        title: 'Ce que je fais | Admin',
        loadComponent: () =>
          import('./application/admin-what-i-do-list').then((m) => m.AdminWhatIDoList),
      },
      {
        path: 'content/what-i-do/new',
        title: 'Nouveau — Ce que je fais | Admin',
        loadComponent: () =>
          import('./application/admin-what-i-do-form').then((m) => m.AdminWhatIDoForm),
      },
      {
        path: 'content/what-i-do/:id/edit',
        title: 'Modifier — Ce que je fais | Admin',
        loadComponent: () =>
          import('./application/admin-what-i-do-form').then((m) => m.AdminWhatIDoForm),
      },
      {
        path: 'content/what-i-seek',
        title: 'Ce que je cherche | Admin',
        loadComponent: () =>
          import('./application/admin-what-i-seek').then((m) => m.AdminWhatISeek),
      },
      {
        path: 'content/diplomas',
        title: 'Diplômes | Admin',
        loadComponent: () => import('./application/admin-diplomas').then((m) => m.AdminDiplomas),
      },
      {
        path: 'content/diplomas/new',
        title: 'Nouveau diplôme | Admin',
        loadComponent: () =>
          import('./application/admin-diploma-form').then((m) => m.AdminDiplomaForm),
      },
      {
        path: 'content/diplomas/:id/edit',
        title: 'Modifier diplôme | Admin',
        loadComponent: () =>
          import('./application/admin-diploma-form').then((m) => m.AdminDiplomaForm),
      },
      {
        path: 'content/technologies',
        title: 'Technologies | Admin',
        loadComponent: () =>
          import('./application/admin-technologies').then((m) => m.AdminTechnologies),
      },
      {
        path: 'content/technologies/new',
        title: 'Nouvelle technologie | Admin',
        loadComponent: () =>
          import('./application/admin-technology-form').then((m) => m.AdminTechnologyForm),
      },
      {
        path: 'content/technologies/:id/edit',
        title: 'Modifier technologie | Admin',
        loadComponent: () =>
          import('./application/admin-technology-form').then((m) => m.AdminTechnologyForm),
      },
      {
        path: 'content/projects',
        title: 'Projets | Admin',
        loadComponent: () => import('./application/admin-projects').then((m) => m.AdminProjects),
      },
      {
        path: 'content/services',
        title: 'Prestations | Admin',
        loadComponent: () => import('./application/admin-services').then((m) => m.AdminServices),
      },
      {
        path: 'content/services/new',
        title: 'Nouvelle prestation | Admin',
        loadComponent: () =>
          import('./application/admin-service-form').then((m) => m.AdminServiceForm),
      },
      {
        path: 'content/services/:id/edit',
        title: 'Modifier prestation | Admin',
        loadComponent: () =>
          import('./application/admin-service-form').then((m) => m.AdminServiceForm),
      },
      {
        path: 'content/home-highlights',
        title: "Points forts d'accueil | Admin",
        loadComponent: () =>
          import('./application/admin-home-highlights').then((m) => m.AdminHomeHighlights),
      },
      {
        path: 'content/home-highlights/new',
        title: "Nouveau point fort d'accueil | Admin",
        loadComponent: () =>
          import('./application/admin-home-highlight-form').then((m) => m.AdminHomeHighlightForm),
      },
      {
        path: 'content/home-highlights/:id/edit',
        title: "Modifier point fort d'accueil | Admin",
        loadComponent: () =>
          import('./application/admin-home-highlight-form').then((m) => m.AdminHomeHighlightForm),
      },
      {
        path: 'content/articles',
        title: 'Articles | Admin',
        loadComponent: () => import('./application/admin-articles').then((m) => m.AdminArticles),
      },
      {
        path: 'content/articles/new',
        title: 'Nouvel article | Admin',
        loadComponent: () =>
          import('./application/admin-article-form').then((m) => m.AdminArticleForm),
      },
      {
        path: 'content/articles/:id/edit',
        title: 'Modifier article | Admin',
        loadComponent: () =>
          import('./application/admin-article-form').then((m) => m.AdminArticleForm),
      },
      {
        path: 'content/social',
        title: 'Liens sociaux | Admin',
        loadComponent: () =>
          import('./application/admin-social-buttons').then((m) => m.AdminSocialButtons),
      },
      {
        path: 'content/social/new',
        title: 'Nouveau lien social | Admin',
        loadComponent: () =>
          import('./application/admin-social-button-form').then((m) => m.AdminSocialButtonForm),
      },
      {
        path: 'content/social/:id/edit',
        title: 'Modifier lien social | Admin',
        loadComponent: () =>
          import('./application/admin-social-button-form').then((m) => m.AdminSocialButtonForm),
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
      {
        path: 'inbox/bookings',
        title: 'Réservations | Admin',
        loadComponent: () => import('./application/admin-bookings').then((m) => m.AdminBookings),
      },
      {
        path: 'inbox/comments',
        title: 'Commentaires | Admin',
        loadComponent: () => import('./application/admin-comments').then((m) => m.AdminComments),
      },

      // ─── Agenda ──────────────────────────────────────────────────
      {
        path: 'schedule',
        title: 'Agenda | Admin',
        loadComponent: () =>
          import('./application/admin-schedule-index').then((m) => m.AdminScheduleIndex),
      },
      {
        path: 'schedule/calendar',
        title: 'Calendrier | Admin',
        loadComponent: () => import('./application/admin-calendar').then((m) => m.AdminCalendar),
      },
      {
        path: 'schedule/availability',
        title: 'Disponibilités | Admin',
        loadComponent: () =>
          import('./application/admin-availability').then((m) => m.AdminAvailability),
      },

      // ─── Analytics ───────────────────────────────────────────────
      {
        path: 'analytics',
        title: 'Analytics | Admin',
        loadComponent: () => import('./application/admin-analytics').then((m) => m.AdminAnalytics),
      },
      // Backwards-compat : les drill-downs redirigent vers le dashboard unifié
      { path: 'analytics/visits', redirectTo: 'analytics', pathMatch: 'full' },
      { path: 'analytics/articles', redirectTo: 'analytics', pathMatch: 'full' },
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
      { path: 'home/hero', redirectTo: 'content/hero', pathMatch: 'full' },
      { path: 'home/services', redirectTo: 'content/services', pathMatch: 'full' },
      { path: 'home/highlights', redirectTo: 'content/home-highlights', pathMatch: 'full' },
      { path: 'about', redirectTo: 'content', pathMatch: 'full' },
      { path: 'about/profile', redirectTo: 'content/profile', pathMatch: 'full' },
      { path: 'about/biography', redirectTo: 'content/biography', pathMatch: 'full' },
      { path: 'about/cv', redirectTo: 'content/cv', pathMatch: 'full' },
      { path: 'about/highlights', redirectTo: 'content/highlights', pathMatch: 'full' },
      { path: 'about/what-i-do', redirectTo: 'content/what-i-do', pathMatch: 'full' },
      { path: 'about/what-i-seek', redirectTo: 'content/what-i-seek', pathMatch: 'full' },
      { path: 'about/diplomas', redirectTo: 'content/diplomas', pathMatch: 'full' },
      { path: 'about/technologies', redirectTo: 'content/technologies', pathMatch: 'full' },
      { path: 'about/social-buttons', redirectTo: 'content/social', pathMatch: 'full' },
      { path: 'blog', redirectTo: 'content', pathMatch: 'full' },
      { path: 'blog/articles', redirectTo: 'content/articles', pathMatch: 'full' },
      { path: 'blog/comments', redirectTo: 'inbox/comments', pathMatch: 'full' },
      { path: 'projects', redirectTo: 'content/projects', pathMatch: 'full' },
      { path: 'messages', redirectTo: 'inbox/messages', pathMatch: 'full' },
      { path: 'calendar', redirectTo: 'schedule/calendar', pathMatch: 'full' },
      { path: 'stats', redirectTo: 'analytics', pathMatch: 'full' },
      { path: 'security', redirectTo: 'settings/security', pathMatch: 'full' },

      { path: '**', redirectTo: '' },
    ],
  },
];
