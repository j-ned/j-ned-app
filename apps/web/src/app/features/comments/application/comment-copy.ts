import type { CommentRejection } from '../domain/models/comment.model';

const NBSP = '\u00a0';
const NARROW_NBSP = '\u202F';

export const COMMENT_COPY = {
  heading: 'Commentaires',
  ownerMention: 'auteur de l’article',
  empty: `Aucun commentaire pour l’instant. Écris le premier${NARROW_NBSP}!`,
  loadFailed: 'Les commentaires n’ont pas pu être chargés.',
  truncated: (shown: number): string => `Seuls les ${shown} premiers commentaires sont affichés.`,
  formLegend: 'Laisser un commentaire',
  sent: `Merci${NARROW_NBSP}! Ton commentaire sera publié après relecture.`,
  pending: 'En attente de relecture',
} as const;

// Repris des messages de l'API (`createCommentSchema`), au mot près.
export const COMMENT_FORM_COPY = {
  nameRequired: 'Ton nom est obligatoire.',
  nameLength: 'Ton nom doit compter entre 2 et 80 caractères.',
  nameCharacters: 'Ton nom contient des caractères non autorisés.',
  nameInvisible: 'Ton nom doit contenir au moins un caractère visible.',
  emailRequired: 'Ton adresse e-mail est obligatoire.',
  emailInvalid: 'Ton adresse e-mail n’est pas valide.',
  bodyRequired: 'Ton message est obligatoire.',
  bodyLength: `Ton message doit compter entre 2 et 2${NARROW_NBSP}000 caractères.`,
  bodyCharacters: 'Ton message contient des caractères non autorisés.',
  bodyInvisible: 'Ton message doit contenir au moins un caractère visible.',
  privacyNote: 'Ton nom et ton message sont publiés après relecture, ton e-mail jamais.',
  send: 'Envoyer',
  sending: 'Envoi…',
} as const;

// 429 couvre deux refus de l'API que la réponse ne distingue pas : le quota par IP et le plafond
// de commentaires en attente par expéditeur.
export const COMMENT_REJECTION_COPY: Readonly<Record<CommentRejection, string>> = {
  'rate-limited':
    'Trop d’envois en peu de temps, ou plusieurs de tes commentaires attendent encore leur relecture. Réessaie plus tard.',
  closed: 'Les commentaires sont momentanément fermés. Réessaie plus tard.',
  'not-found': 'Cet article ou ce commentaire n’accepte plus de réponse.',
  conflict: `On ne répond pas à une réponse${NBSP}: réponds au commentaire d’origine.`,
  invalid: 'Certains champs ne vont pas. Vérifie ta saisie et réessaie.',
  network: 'Connexion impossible. Vérifie ton réseau, puis réessaie dans un instant.',
  unavailable: 'Le serveur a un souci passager. Réessaie dans quelques minutes.',
};
