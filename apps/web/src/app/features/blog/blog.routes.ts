import type { Routes } from '@angular/router';

export const BLOG_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./application/blog-list').then((m) => m.BlogList) },
  {
    path: ':slug',
    loadComponent: () => import('./application/blog-detail').then((m) => m.BlogDetail),
  },
];
