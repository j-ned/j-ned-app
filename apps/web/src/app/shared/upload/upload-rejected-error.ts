// Fichier refusé dans le navigateur avant tout envoi : `message` est la phrase à montrer telle quelle.
export class UploadRejectedError extends Error {
  override readonly name = 'UploadRejectedError';
}
