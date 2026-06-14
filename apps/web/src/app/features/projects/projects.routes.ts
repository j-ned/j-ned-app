import type { Routes } from '@angular/router';

export const PROJECTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./application/projects').then((m) => m.Projects),
  },
  {
    path: ':slug',
    loadComponent: () =>
      import('./application/project-detail').then((m) => m.ProjectDetail),
  },
];
