import type { Routes } from '@angular/router';
import { providePrimeNGTheme } from '@core/providers/primeng-theme';

export const BOOKING_ROUTES: Routes = [
  {
    path: '',
    providers: [providePrimeNGTheme()],
    loadComponent: () => import('./application/booking').then((m) => m.Booking),
  },
];
