/**
 * Message lisible à partir d'une erreur inconnue :
 * `Error.message`, sinon le message d'erreur API (`{ error: { message } }`),
 * sinon un libellé par défaut.
 */
export function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return (err as { error?: { message?: string } })?.error?.message ?? 'Erreur inconnue';
}
