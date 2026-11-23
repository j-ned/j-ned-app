// `not-found` et `conflict` : le commentaire a changé entre-temps (supprimé, déjà publié ailleurs).
export type ModerationRejection = 'not-found' | 'conflict';

// `failed` est une panne : elle reste dans le canal d'erreur, l'écran la nomme sans relire la file.
export type ModerationFailure = ModerationRejection | 'failed';

export type ModerationResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: ModerationRejection };
