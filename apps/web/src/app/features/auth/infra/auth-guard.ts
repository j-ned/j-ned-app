import { inject } from '@angular/core';
import { Router, type CanMatchFn } from '@angular/router';
import { AuthStore } from '@core/auth/auth-store';

export const authGuard: CanMatchFn = async () => {
  const authService = inject(AuthStore);
  const router = inject(Router);

  await authService.ready;

  if (authService.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
