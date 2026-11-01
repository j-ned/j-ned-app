import { HttpErrorResponse } from '@angular/common/http';
import { UploadRejectedError } from '@shared/upload/upload-rejected-error';
import { apiErrorMessage } from './api-error-message';

const VALIDATION_STATUSES: readonly number[] = [400, 422];

function detailOf(err: unknown): string {
  if (err instanceof UploadRejectedError) return err.message;
  if (!(err instanceof HttpErrorResponse) || !VALIDATION_STATUSES.includes(err.status)) return '';
  return apiErrorMessage(err) ?? '';
}

export function withValidationDetail(label: string, err: unknown): string {
  const detail = detailOf(err);
  if (!detail) return label;
  // Un libellé qui finit une phrase reçoit le détail en phrase suivante, pas après son point.
  return label.endsWith('.') ? `${label} Détail\u00a0: ${detail}` : `${label}\u00a0: ${detail}`;
}
