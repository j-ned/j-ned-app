import type { Routes } from '@angular/router';
import { providePrimeNGTheme } from '@core/providers/primeng-theme';

export const CONTACT_ROUTES: Routes = [
  {
    path: '',
    providers: [providePrimeNGTheme()],
    loadComponent: () => import('./application/contact').then((m) => m.Contact),
  },
];
