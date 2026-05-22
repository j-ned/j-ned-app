import type { Routes } from '@angular/router';

export const LOGIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./application/login').then((m) => m.Login),
  },
];

export const TWO_FACTOR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./application/two-factor-verify').then((m) => m.TwoFactorVerify),
  },
];
