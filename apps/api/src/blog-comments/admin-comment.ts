import type { BlogComment, CommentStatus } from '../database/schema';
import { toCommentRecord, type CommentAuthor } from './comment-record';
import type { AdminCommentRow, PostRef } from './comment-store';

const EXCERPT_LENGTH = 140;

type ParentAuthor =
  | { readonly kind: 'visitor'; readonly name: string }
  | { readonly kind: 'owner' };

export type AdminComment = {
  readonly id: string;
  readonly post: PostRef;
  readonly parent: {
    readonly id: string;
    readonly author: ParentAuthor;
    readonly excerpt: string;
  } | null;
  readonly author: CommentAuthor;
  readonly body: string;
  readonly status: CommentStatus;
  readonly createdAt: Date;
  readonly moderatedAt: Date | null;
  readonly replyCount: number;
};

// Coupé par caractère, pas par unité UTF-16 : un émoji n'est jamais tranché en deux.
function excerptOf(body: string): string {
  const characters = Array.from(body);
  return characters.length <= EXCERPT_LENGTH
    ? body
    : `${characters.slice(0, EXCERPT_LENGTH).join('')}…`;
}

function toParent(row: BlogComment): NonNullable<AdminComment['parent']> {
  const { author } = toCommentRecord(row);
  return {
    id: row.id,
    author:
      author.kind === 'owner'
        ? { kind: 'owner' }
        : { kind: 'visitor', name: author.name },
    excerpt: excerptOf(row.body),
  };
}

export function toAdminComment(row: AdminCommentRow): AdminComment {
  const record = toCommentRecord(row.comment);
  return {
    id: record.id,
    post: { id: row.post.id, slug: row.post.slug, title: row.post.title },
    parent: row.parent === null ? null : toParent(row.parent),
    author: record.author,
    body: record.body,
    status: record.moderation.status,
    createdAt: record.createdAt,
    moderatedAt:
      record.moderation.status === 'pending'
        ? null
        : record.moderation.moderatedAt,
    replyCount: row.replyCount,
  };
}
