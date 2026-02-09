export type CommentStatus = 'pending' | 'approved' | 'rejected';

export type Comment = {
  readonly id: number;
  readonly idArticle: number;
  readonly author: string;
  readonly content: string;
  readonly date: string;
  readonly email: string;
  readonly rating: number;
  readonly status: CommentStatus;
  readonly featured: boolean;
};
