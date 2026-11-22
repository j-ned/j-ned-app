import { HttpErrorResponse } from '@angular/common/http';

// Article ou projet : l'API refuse en 412 un `If-Match` qui n'est plus la version enregistrée.
export function isStaleVersion(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 412;
}
