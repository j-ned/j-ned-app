import type { Resource } from '@angular/core';
import { catchError, of, throwError, type MonoTypeOperatorFunction } from 'rxjs';

// Pendant `reload()` la ressource porte encore sa valeur : un échec la réémet au lieu de l'erreur.
export function keepShownOnFailedReload<T>(
  resource: Resource<T | undefined>,
): MonoTypeOperatorFunction<T> {
  return catchError((error: unknown) =>
    resource.hasValue() ? of(resource.value()) : throwError(() => error),
  );
}
