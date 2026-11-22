const NARROW_NBSP = ' ';

export const COMMENT_COPY = {
  heading: 'Commentaires',
  ownerMention: 'auteur de l’article',
  empty: `Aucun commentaire pour l’instant. Écris le premier${NARROW_NBSP}!`,
  loadFailed: 'Les commentaires n’ont pas pu être chargés.',
  truncated: (shown: number): string => `Seuls les ${shown} premiers commentaires sont affichés.`,
} as const;
