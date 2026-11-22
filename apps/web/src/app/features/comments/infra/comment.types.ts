// Formes JSON servies par l'API : dates en chaînes ISO.
type AuthorDto =
  | { readonly kind: 'visitor'; readonly name: string; readonly email: string }
  | { readonly kind: 'owner' };

type PublicAuthorDto =
  { readonly kind: 'visitor'; readonly name: string } | { readonly kind: 'owner' };

export type AdminCommentDto = {
  readonly id: string;
  readonly post: { readonly id: string; readonly slug: string; readonly title: string };
  readonly parent: {
    readonly id: string;
    readonly author: PublicAuthorDto;
    readonly excerpt: string;
  } | null;
  readonly author: AuthorDto;
  readonly body: string;
  readonly status: 'pending' | 'published';
  readonly createdAt: string;
  readonly moderatedAt: string | null;
  readonly replyCount: number;
};

export type AdminCommentPageDto = {
  readonly data: readonly AdminCommentDto[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
};

export type PublicReplyDto = {
  readonly id: string;
  readonly author: PublicAuthorDto;
  readonly body: string;
  readonly createdAt: string;
};

export type PublicCommentPageDto = {
  readonly data: readonly (PublicReplyDto & { readonly replies: readonly PublicReplyDto[] })[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
};
