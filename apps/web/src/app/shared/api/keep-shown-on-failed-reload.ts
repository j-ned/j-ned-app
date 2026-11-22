import type { Resource } from '@angular/core';
import { catchError, of, throwError, type MonoTypeOperatorFunction } from 'rxjs';

// Une relecture qui échoue garde la valeur affichée ; un premier chargement en échec reste une
// erreur. Pendant `reload()`, la ressource porte encore sa valeur précédente.
export function keepShownOnFailedReload<T>(
  resource: Resource<T | undefined>,
): MonoTypeOperatorFunction<T> {
  return catchError((error: unknown) =>
    resource.hasValue() ? of(resource.value()) : throwError(() => error),
  );
}
