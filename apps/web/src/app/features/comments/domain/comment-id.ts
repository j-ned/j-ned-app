const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Forme des identifiants de commentaire de l'API : toute autre valeur vient d'ailleurs.
export function isCommentId(value: unknown): value is string {
  return typeof value === 'string' && UUID.test(value);
}
