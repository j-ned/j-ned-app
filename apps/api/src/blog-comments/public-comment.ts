import * as z from 'zod';
import type { PaginationParams } from '../common/pagination';
import type { PublicCommentRow, PublishedThreads } from './comment-store';

const publicAuthorSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('visitor'), name: z.string() }),
  z.object({ kind: z.literal('owner') }),
]);

const publicReplySchema = z.object({
  id: z.uuid(),
  author: publicAuthorSchema,
  body: z.string(),
  createdAt: z.iso.datetime(),
});

// Tout ce que le public reçoit passe par ce schéma : `z.object` retire toute clé non déclarée, donc
// ni e-mail ni empreinte ne sortent, même si une ligne entière lui est donnée.
export const publicCommentPageSchema = z.object({
  data: z.array(
    publicReplySchema.extend({ replies: z.array(publicReplySchema) }),
  ),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export type PublicCommentPage = z.infer<typeof publicCommentPageSchema>;
type PublicReply = z.infer<typeof publicReplySchema>;

function toPublicAuthor(row: PublicCommentRow): PublicReply['author'] {
  if (row.authorKind === 'owner') return { kind: 'owner' };
  if (row.authorName === null) {
    throw new Error(`Comment ${row.id}: visitor without name`);
  }
  return { kind: 'visitor', name: row.authorName };
}

// Champ par champ : une colonne ajoutée au schéma ne part pas vers le public sans décision.
function toPublicReply(row: PublicCommentRow): PublicReply {
  return {
    id: row.id,
    author: toPublicAuthor(row),
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toPublicCommentPage(
  threads: PublishedThreads,
  page: PaginationParams,
): PublicCommentPage {
  return {
    data: threads.comments.map((comment) => ({
      ...toPublicReply(comment),
      replies: threads.replies
        .filter((reply) => reply.parentId === comment.id)
        .map(toPublicReply),
    })),
    total: threads.total,
    page: page.page,
    limit: page.limit,
  };
}
