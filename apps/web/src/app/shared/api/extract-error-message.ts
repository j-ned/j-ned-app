export function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return (err as { error?: { message?: string } })?.error?.message ?? 'Erreur inconnue';
}
