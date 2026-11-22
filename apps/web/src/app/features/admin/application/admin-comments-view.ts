import type {
  AdminComment,
  CommentStatus,
  ParentAuthor,
} from '@features/comments/domain/models/comment.model';
import { counted } from '@shared/format/counted';
import type { FilterOption } from '@shared/ui/filter-group';
import { receivedAgo } from './admin-messages-view';

export const ADMIN_COMMENTS_PAGE_SIZE = 20;

const NBSP = ' ';

export const COMMENT_FILTERS: readonly FilterOption<CommentStatus>[] = [
  { value: 'pending', label: 'En attente' },
  { value: 'published', label: 'Publiés' },
];

const STATUS_LABELS: Record<CommentStatus, string> = {
  pending: 'En attente',
  published: 'Publié',
};

const SUMMARY_WORDS: Record<CommentStatus, readonly [string, string]> = {
  pending: ['commentaire en attente', 'commentaires en attente'],
  published: ['commentaire publié', 'commentaires publiés'],
};

type AdminCommentRow = {
  readonly author: string;
  readonly email: string | null;
  readonly mailto: string | null;
  readonly postTitle: string;
  readonly postLink: readonly string[];
  readonly parent: string | null;
  readonly status: string;
  readonly received: string;
  readonly createdAt: string;
  readonly replies: string;
};

const parentName = (author: ParentAuthor): string =>
  author.kind === 'owner' ? 'toi' : author.name;

export function toAdminCommentRow(comment: AdminComment, now: Date): AdminCommentRow {
  const { author, parent } = comment;
  const email = author.kind === 'visitor' ? author.email : null;
  return {
    author: author.kind === 'visitor' ? author.name : 'Toi, auteur du site',
    email,
    mailto: email && `mailto:${email}`,
    postTitle: comment.post.title,
    postLink: ['/blog', comment.post.slug],
    parent:
      parent &&
      `En réponse à ${parentName(parent.author)}${NBSP}: «${NBSP}${parent.excerpt}${NBSP}»`,
    status: STATUS_LABELS[comment.status],
    received: receivedAgo(comment.createdAt, now),
    createdAt: comment.createdAt,
    replies: comment.replyCount === 0 ? '' : counted(comment.replyCount, 'réponse', 'réponses'),
  };
}

export function commentsSummary(status: CommentStatus, total: number): string {
  const [singular, plural] = SUMMARY_WORDS[status];
  return counted(total, singular, plural);
}
