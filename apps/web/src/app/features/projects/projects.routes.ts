import type { Routes } from '@angular/router';

export const PROJECTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./application/projects').then((m) => m.Projects),
  },
];
