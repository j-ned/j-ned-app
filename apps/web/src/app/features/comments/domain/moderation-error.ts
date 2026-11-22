// `not-found` et `conflict` : le commentaire a changé entre-temps (supprimé, déjà publié ailleurs).
export type ModerationFailure = 'not-found' | 'conflict' | 'failed';

export class ModerationError extends Error {
  constructor(readonly reason: ModerationFailure) {
    super(`Comment moderation failed: ${reason}`);
    this.name = 'ModerationError';
  }
}
