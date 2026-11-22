export type CommentStatus = 'pending' | 'published';

type CommentAuthor =
  | { readonly kind: 'visitor'; readonly name: string; readonly email: string }
  | { readonly kind: 'owner' };

// L'API ne renvoie pas l'e-mail de l'auteur du commentaire parent.
export type ParentAuthor =
  { readonly kind: 'visitor'; readonly name: string } | { readonly kind: 'owner' };

export type AdminComment = {
  readonly id: string;
  readonly post: { readonly id: string; readonly slug: string; readonly title: string };
  readonly parent: {
    readonly id: string;
    readonly author: ParentAuthor;
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
