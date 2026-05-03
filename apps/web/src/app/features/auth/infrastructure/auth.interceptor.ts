import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Skip credentials for public tracking endpoint
  const isTrackingEndpoint = req.url.includes('/analytics/track');
  const authReq = isTrackingEndpoint ? req : req.clone({ withCredentials: true });

  // Never retry auth endpoints — they handle their own errors
  const isAuthEndpoint = req.url.includes('/auth/');

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
