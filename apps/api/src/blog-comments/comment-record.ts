import type { BlogComment } from '../database/schema';

export type CommentAuthor =
  | { readonly kind: 'visitor'; readonly name: string; readonly email: string }
  | { readonly kind: 'owner' };

type CommentModeration =
  | { readonly status: 'pending' }
  | {
      readonly status: 'published';
      readonly moderatedAt: Date;
    };

export type CommentRecord = {
  readonly id: string;
  readonly postId: string;
  readonly parentId: string | null;
  readonly author: CommentAuthor;
  readonly moderation: CommentModeration;
  readonly body: string;
  readonly createdAt: Date;
};

function toAuthor(row: BlogComment): CommentAuthor {
  if (row.authorKind === 'owner') return { kind: 'owner' };
  if (row.authorName === null || row.authorEmail === null) {
    throw new Error(`Comment ${row.id}: visitor without name or e-mail`);
  }
  return { kind: 'visitor', name: row.authorName, email: row.authorEmail };
}

function toModeration(row: BlogComment): CommentModeration {
  if (row.status === 'pending') return { status: 'pending' };
  if (row.moderatedAt === null) {
    throw new Error(`Comment ${row.id}: ${row.status} without moderation date`);
  }
  return { status: row.status, moderatedAt: row.moderatedAt };
}

// Une ligne incohérente est impossible tant que les CHECK de la table tiennent : mieux vaut lever.
export function toCommentRecord(row: BlogComment): CommentRecord {
  return {
    id: row.id,
    postId: row.postId,
    parentId: row.parentId,
    author: toAuthor(row),
    moderation: toModeration(row),
    body: row.body,
    createdAt: row.createdAt,
  };
}
