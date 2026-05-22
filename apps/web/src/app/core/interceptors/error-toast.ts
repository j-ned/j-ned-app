import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ToastStore } from '@shared/ui';
import { catchError, throwError } from 'rxjs';

export const errorToastInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastStore);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return throwError(() => error);
      }

      if (error.status === 404 && req.method === 'GET') {
        return throwError(() => error);
      }

      toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: getErrorMessage(error),
      });

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
