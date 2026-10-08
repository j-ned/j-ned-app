import { HttpErrorResponse } from '@angular/common/http';
import { apiErrorMessage } from './api-error-message';

const VALIDATION_STATUSES: readonly number[] = [400, 422];

export function withValidationDetail(label: string, err: unknown): string {
  if (!(err instanceof HttpErrorResponse) || !VALIDATION_STATUSES.includes(err.status))
    return label;
  const detail = apiErrorMessage(err);
  if (!detail) return label;
  // Un libellé qui finit une phrase reçoit le détail en phrase suivante, pas après son point.
  return label.endsWith('.') ? `${label} Détail\u00a0: ${detail}` : `${label}\u00a0: ${detail}`;
}
