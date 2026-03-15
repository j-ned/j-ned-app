export type CommentStatus = 'pending' | 'approved' | 'rejected';

export type Comment = {
  readonly id: string;
  readonly idArticle: string;
  readonly author: string;
  readonly content: string;
  readonly date: string;
  readonly email: string;
  readonly rating: number;
  readonly status: CommentStatus;
  readonly featured: boolean;
};
