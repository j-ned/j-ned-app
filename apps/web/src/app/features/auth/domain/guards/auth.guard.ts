import { inject } from '@angular/core';
import { Router, type CanMatchFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanMatchFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.ready;

  if (authService.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
