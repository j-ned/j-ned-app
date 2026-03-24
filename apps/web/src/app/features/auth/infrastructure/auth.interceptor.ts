import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
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
      // Only attempt refresh if user was logged in and it's not an auth endpoint
      if (error.status === 401 && !isAuthEndpoint && authService.isLoggedIn()) {
        return authService.refresh().pipe(
          switchMap((success) => {
            if (success) {
              return next(authReq);
            }
            authService.logout();
            return throwError(() => error);
          }),
          catchError(() => {
            authService.logout();
            return throwError(() => error);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};
