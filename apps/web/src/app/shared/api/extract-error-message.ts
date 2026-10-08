import { apiErrorMessage } from './api-error-message';

export function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return apiErrorMessage(err) ?? 'Erreur inconnue';
}
