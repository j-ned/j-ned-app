import type { Routes } from '@angular/router';

export const BLOG_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/blog-list/blog-list').then((m) => m.BlogList) },
  {
    path: ':slug',
    loadComponent: () => import('./pages/blog-detail/blog-detail').then((m) => m.BlogDetail),
  },
];
