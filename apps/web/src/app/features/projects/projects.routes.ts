import type { Routes } from '@angular/router';
import { providePrimeNGTheme } from '@core/providers/primeng-theme';

export const PROJECTS_ROUTES: Routes = [
  {
    path: '',
    providers: [providePrimeNGTheme()],
    loadComponent: () => import('./application/projects').then((m) => m.Projects),
  },
];
