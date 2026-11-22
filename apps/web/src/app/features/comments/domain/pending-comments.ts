import type { PendingComment, PublishedThread } from './models/comment.model';

// Le temps d'une relecture, week-end compris ; au-delà, un commentaire refusé (donc supprimé, jamais
// lu publié) cesserait de s'afficher comme en attente.
export const PENDING_COMMENT_TTL_MS = 72 * 60 * 60 * 1_000;

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function toPendingComment(entry: unknown, now: number): PendingComment | null {
  if (!isRecord(entry)) return null;
  const { id, name, body, parentId, createdAt } = entry;
  if (typeof id !== 'string' || typeof name !== 'string' || typeof body !== 'string') return null;
  if (parentId !== null && typeof parentId !== 'string') return null;
  if (typeof createdAt !== 'string') return null;
  const age = now - Date.parse(createdAt);
  if (!Number.isFinite(age) || age < 0 || age > PENDING_COMMENT_TTL_MS) return null;
  return { id, name, body, parentId, createdAt };
}

// Liste de champs fermée : une clé de plus (un e-mail) ne ressort jamais de la lecture.
export function parsePendingComments(raw: unknown, now: number): readonly PendingComment[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry: unknown) => toPendingComment(entry, now) ?? []);
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
