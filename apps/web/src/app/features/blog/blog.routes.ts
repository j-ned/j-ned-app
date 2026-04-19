import type { Routes } from '@angular/router';
import { providePrimeNGTheme } from '@core/providers/primeng-theme';

export const BLOG_ROUTES: Routes = [
  {
    path: '',
    providers: [providePrimeNGTheme()],
    children: [
      {
        path: '',
        loadComponent: () => import('./application/blog-list').then((m) => m.BlogList),
      },
      {
        path: ':id',
        loadComponent: () => import('./application/blog-detail').then((m) => m.BlogDetail),
      },
    ],
  },
];
