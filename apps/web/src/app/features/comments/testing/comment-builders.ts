import type {
  AdminComment,
  CommentDraft,
  PendingComment,
  PublishedThread,
  PublishedComment,
  PublishedReply,
} from '../domain/models/comment.model';
import type { AdminCommentDto, PublicCommentPageDto } from '../infra/comment.types';

export function makeAdminComment(overrides: Partial<AdminComment> = {}): AdminComment {
  return {
    id: 'c-1',
    post: { id: 'p-1', slug: 'article-temoin', title: 'Article témoin' },
    parent: null,
    author: { kind: 'visitor', name: 'Camille', email: 'camille@example.test' },
    body: 'Merci pour cet article.',
    status: 'pending',
    createdAt: '2026-11-21T10:00:00.000Z',
    replyCount: 0,
    ...overrides,
  };
}

// La forme que l'API renvoie pour ce commentaire : `moderatedAt` en plus, que le front ignore.
export function toAdminCommentDto(comment: AdminComment): AdminCommentDto {
  return {
    ...comment,
    moderatedAt: comment.status === 'published' ? '2026-11-21T12:00:00.000Z' : null,
  };
}

export function makePublishedReply(overrides: Partial<PublishedReply> = {}): PublishedReply {
  return {
    id: 'r-1',
    author: { kind: 'owner' },
    body: 'Avec plaisir.',
    createdAt: '2026-11-21T11:00:00.000Z',
    ...overrides,
  };
}

export function makePublishedComment(overrides: Partial<PublishedComment> = {}): PublishedComment {
  return {
    id: 'c-1',
    author: { kind: 'visitor', name: 'Camille' },
    body: 'Merci pour cet article.',
    createdAt: '2026-11-21T09:30:00.000Z',
    replies: [],
    ...overrides,
  };
}

export function makePublishedThread(overrides: Partial<PublishedThread> = {}): PublishedThread {
  const comments = overrides.comments ?? [makePublishedComment()];
  return { comments, total: overrides.total ?? comments.length };
}

export function makeCommentDraft(overrides: Partial<CommentDraft> = {}): CommentDraft {
  return {
    name: 'Camille',
    email: 'camille@example.test',
    body: 'Merci pour cet article.',
    website: '',
    ...overrides,
  };
}

// La page publique que l'API sert pour ce fil : première page de 100 commentaires.
export function toPublicCommentPageDto(thread: PublishedThread): PublicCommentPageDto {
  return { data: thread.comments, total: thread.total, page: 1, limit: 100 };
}

// Un commentaire envoyé par ce lecteur, gardé dans l'onglet en attendant sa publication.
export function makePendingComment(overrides: Partial<PendingComment> = {}): PendingComment {
  return {
    id: 'p-1',
    name: 'Lou',
    body: 'Bel article.',
    parentId: null,
    createdAt: '2026-11-22T11:00:00.000Z',
    ...overrides,
  };
}
