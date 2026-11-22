import type { AdminComment } from './models/comment.model';

// Un seul niveau de réponse, et jamais sous un commentaire que les lecteurs ne voient pas.
export function canReply(comment: Pick<AdminComment, 'status' | 'parent'>): boolean {
  return comment.status === 'published' && comment.parent === null;
}
