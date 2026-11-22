import type { PaginationParams } from '../common/pagination';
import type { BlogComment, CommentStatus } from '../database/schema';

export type PostRef = {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
};

// Liste fermée : ni e-mail ni empreinte ne sont lus pour une réponse publique.
export type PublicCommentRow = Pick<
  BlogComment,
  'id' | 'parentId' | 'authorKind' | 'authorName' | 'body' | 'createdAt'
>;

export type PublishedThreads = {
  readonly comments: readonly PublicCommentRow[];
  readonly replies: readonly PublicCommentRow[];
  readonly total: number;
};

export type AdminCommentRow = {
  readonly comment: BlogComment;
  readonly post: PostRef;
  readonly parent: BlogComment | null;
  readonly replyCount: number;
};

export type AdminCommentPage = {
  readonly rows: readonly AdminCommentRow[];
  readonly total: number;
};

export type NewVisitorComment = {
  readonly postId: string;
  readonly parentId: string | null;
  readonly name: string;
  readonly email: string;
  readonly senderHash: string;
  readonly body: string;
};

export type NewOwnerReply = {
  readonly postId: string;
  readonly parentId: string;
  readonly body: string;
  readonly publishedAt: Date;
};

export type PendingCaps = {
  readonly perSender: number;
  readonly total: number;
};

export type PendingInsert =
  | { readonly kind: 'inserted'; readonly row: BlogComment }
  | { readonly kind: 'sender-cap' }
  | { readonly kind: 'total-cap' }
  | { readonly kind: 'target-gone' };

export type CommentStore = {
  findPublishedPost(slug: string): Promise<PostRef | undefined>;
  findById(id: string): Promise<BlogComment | undefined>;
  // Comptage et insertion indivisibles : deux envois simultanés ne dépassent pas les plafonds.
  insertPending(
    comment: NewVisitorComment,
    caps: PendingCaps,
  ): Promise<PendingInsert>;
  // `undefined` : l'article ou le parent a disparu entre la lecture et l'écriture.
  insertOwnerReply(reply: NewOwnerReply): Promise<BlogComment | undefined>;
  findPublishedThreads(
    postId: string,
    page: PaginationParams,
  ): Promise<PublishedThreads>;
  findAdminPage(
    status: CommentStatus | undefined,
    page: PaginationParams,
  ): Promise<AdminCommentPage>;
  findAdminById(id: string): Promise<AdminCommentRow | undefined>;
  countPending(): Promise<number>;
  // Faux si la ligne a disparu ou n'est plus en attente.
  publish(id: string, at: Date): Promise<boolean>;
  // Supprime aussi les réponses (cascade) ; faux si la ligne n'existait plus.
  remove(id: string): Promise<boolean>;
};
