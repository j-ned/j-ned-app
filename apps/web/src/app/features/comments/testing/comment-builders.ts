import type { AdminComment } from '../domain/models/comment.model';
import type { AdminCommentDto } from '../infra/comment.types';

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
