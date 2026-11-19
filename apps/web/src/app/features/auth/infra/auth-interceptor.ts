import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthStore } from '@core/auth/auth-store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthStore);

  // Skip credentials for public tracking endpoint
  const isTrackingEndpoint = req.url.includes('/analytics/track');
  const authReq = isTrackingEndpoint ? req : req.clone({ withCredentials: true });

  // Sous `/auth/`, un 401 répond à un mot de passe ou un code refusé, pas à une session expirée.
  // Le journal des connexions fait exception : c'est une lecture d'admin comme les autres.
  const isAuthEndpoint = req.url.includes('/auth/') && !req.url.includes('/auth/login-events');

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // If user was logged in but gets 401 (session expired), log out
      if (error.status === 401 && !isAuthEndpoint && authService.isLoggedIn()) {
        authService.logout();
      }
      return throwError(() => error);
    }),
  );
};
