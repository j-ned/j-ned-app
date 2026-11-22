import { isCommentId } from './comment-id';
import { COMMENT_LIMITS, characterCount } from './comment-text';
import type { PendingComment, PublishedThread } from './models/comment.model';

// Le temps d'une relecture, week-end compris ; au-delà, un commentaire refusé (donc supprimé, jamais
// lu publié) cesserait de s'afficher comme en attente.
export const PENDING_COMMENT_TTL_MS = 72 * 60 * 60 * 1_000;

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// Mêmes bornes que l'API : une entrée qu'elle aurait refusée ne vient pas d'un envoi accepté.
function withinLength(text: unknown, field: 'name' | 'body'): text is string {
  if (typeof text !== 'string') return false;
  const count = characterCount(text);
  return field === 'name'
    ? count >= COMMENT_LIMITS.nameMin && count <= COMMENT_LIMITS.nameMax
    : count >= COMMENT_LIMITS.bodyMin && count <= COMMENT_LIMITS.bodyMax;
}

function toPendingComment(entry: unknown, now: number): PendingComment | null {
  if (!isRecord(entry)) return null;
  const { id, name, body, parentId, createdAt } = entry;
  if (!isCommentId(id) || !withinLength(name, 'name') || !withinLength(body, 'body')) return null;
  if (parentId !== null && typeof parentId !== 'string') return null;
  if (typeof createdAt !== 'string') return null;
  const age = now - Date.parse(createdAt);
  if (!Number.isFinite(age) || age < 0 || age > PENDING_COMMENT_TTL_MS) return null;
  return { id, name, body, parentId, createdAt };
}

// Liste de champs fermée : une clé de plus (un e-mail) ne ressort jamais de la lecture.
export function parsePendingComments(raw: unknown, now: number): readonly PendingComment[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  return raw.flatMap((entry: unknown) => {
    const pending = toPendingComment(entry, now);
    if (pending === null || seen.has(pending.id)) return [];
    seen.add(pending.id);
    return [pending];
  });
}

export function withoutPublished(
  pending: readonly PendingComment[],
  { comments }: PublishedThread,
): readonly PendingComment[] {
  const published = new Set(
    comments.flatMap((comment) => [comment.id, ...comment.replies.map((reply) => reply.id)]),
  );
  const kept = pending.filter((entry) => !published.has(entry.id));
  return kept.length === pending.length ? pending : kept;
}
