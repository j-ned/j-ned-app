import { HttpErrorResponse } from '@angular/common/http';

// Article ou projet : l'API refuse en 409 un titre dont le slug est déjà pris.
export function isTitleTaken(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 409;
}
