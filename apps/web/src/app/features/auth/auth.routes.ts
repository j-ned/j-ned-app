import type { Routes } from '@angular/router';

export const LOGIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
];

export const TWO_FACTOR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/two-factor-verify/two-factor-verify').then((m) => m.TwoFactorVerify),
  },
];
