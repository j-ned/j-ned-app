export type CommentStatus = 'pending' | 'published';

type CommentAuthor =
  | { readonly kind: 'visitor'; readonly name: string; readonly email: string }
  | { readonly kind: 'owner' };

// Auteur tel que le public le voit, et tel que l'admin voit l'auteur d'un parent : jamais d'e-mail.
export type PublicAuthor =
  { readonly kind: 'visitor'; readonly name: string } | { readonly kind: 'owner' };

export type AdminComment = {
  readonly id: string;
  readonly post: { readonly id: string; readonly slug: string; readonly title: string };
  readonly parent: {
    readonly id: string;
    readonly author: PublicAuthor;
    readonly excerpt: string;
  } | null;
  readonly author: CommentAuthor;
  readonly body: string;
  readonly status: CommentStatus;
  readonly createdAt: string;
  readonly replyCount: number;
};

export type AdminCommentPage = {
  readonly comments: readonly AdminComment[];
  // Nombre de commentaires du filtre dans toute la file, pas dans la page.
  readonly total: number;
};

export type PublishedReply = {
  readonly id: string;
  readonly author: PublicAuthor;
  readonly body: string;
  readonly createdAt: string;
};

export type PublishedComment = PublishedReply & { readonly replies: readonly PublishedReply[] };

export type PublishedThread = {
  readonly comments: readonly PublishedComment[];
  // Nombre de commentaires publiés de l'article, réponses non comprises, au-delà de la page lue.
  readonly total: number;
};

export type CommentDraft = {
  readonly name: string;
  readonly email: string;
  readonly body: string;
  readonly website: string;
};

export type CommentRejection =
  'invalid' | 'not-found' | 'conflict' | 'rate-limited' | 'closed' | 'unavailable' | 'network';

// `id` nul : l'API a accepté sans renvoyer d'identifiant exploitable.
export type CommentSubmission =
  | { readonly success: true; readonly id: string | null }
  | { readonly success: false; readonly error: CommentRejection };

// Ce que l'onglet garde d'un envoi accepté en attendant sa publication : jamais l'e-mail.
export type PendingComment = {
  readonly id: string;
  readonly name: string;
  readonly body: string;
  readonly parentId: string | null;
  readonly createdAt: string;
};
