// Réponse de POST /auth/2fa/enable, inconnue jusqu'à validation : sans codes lisibles, l'activation
// laisserait l'administrateur sans recours s'il perd son application, donc on échoue franchement.
export function toBackupCodes(body: unknown): readonly string[] {
  if (typeof body !== 'object' || body === null || !('backupCodes' in body)) {
    throw new TypeError('2FA enable response without backup codes');
  }
  const codes: unknown = body.backupCodes;
  if (
    !Array.isArray(codes) ||
    codes.length === 0 ||
    !codes.every((code): code is string => typeof code === 'string')
  ) {
    throw new TypeError('2FA enable response with malformed backup codes');
  }
  return codes;
}
