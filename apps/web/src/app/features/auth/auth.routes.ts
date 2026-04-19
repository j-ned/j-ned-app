import type { Routes } from '@angular/router';
import { providePrimeNGTheme } from '@core/providers/primeng-theme';

export const LOGIN_ROUTES: Routes = [
  {
    path: '',
    providers: [providePrimeNGTheme()],
    loadComponent: () => import('./application/login').then((m) => m.Login),
  },
];

export const TWO_FACTOR_ROUTES: Routes = [
  {
    path: '',
    providers: [providePrimeNGTheme()],
    loadComponent: () => import('./application/two-factor-verify').then((m) => m.TwoFactorVerify),
  },
];
