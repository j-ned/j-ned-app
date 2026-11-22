import type { AdminComment } from '../domain/models/comment.model';

export type AdminCommentDto = AdminComment & { readonly moderatedAt: string | null };

export type AdminCommentPageDto = {
  readonly data: readonly AdminCommentDto[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
};
