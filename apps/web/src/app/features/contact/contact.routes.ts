import type { Routes } from '@angular/router';

export const CONTACT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./application/contact').then((m) => m.Contact),
  },
];
