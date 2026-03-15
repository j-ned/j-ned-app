import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from './toast.service';

export const errorToastInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return throwError(() => error);
      }

      // Don't show toast for GET 404s (resource may not exist yet)
      if (error.status === 404 && req.method === 'GET') {
        return throwError(() => error);
      }

      const message = getErrorMessage(error);
      toast.error(message);

      return throwError(() => error);
    }),
  );
};

function getErrorMessage(error: HttpErrorResponse): string {
  switch (error.status) {
    case 400: {
      const body = error.error;
      if (body?.message) {
        return Array.isArray(body.message) ? body.message.join(', ') : body.message;
      }
      return 'Données invalides';
    }
    case 403:
      return 'Accès non autorisé';
    case 404:
      return 'Ressource introuvable';
    case 429:
      return 'Trop de requêtes, veuillez patienter';
    default:
      if (error.status >= 500) {
        return 'Erreur serveur, veuillez réessayer';
      }
      return 'Une erreur est survenue';
  }
}
