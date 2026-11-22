import { HttpErrorResponse } from '@angular/common/http';

// L'API refuse en 409 une écriture partie d'une version périmée.
export function isStaleVersion(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 409;
}
