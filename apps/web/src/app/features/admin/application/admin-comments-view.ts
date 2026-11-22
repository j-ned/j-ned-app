import type {
  AdminComment,
  CommentStatus,
  ParentAuthor,
} from '@features/comments/domain/models/comment.model';
import type { ModerationFailure } from '@features/comments/domain/moderation-error';
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
  readonly publishLabel: string | null;
};

export const commentAuthorName = (comment: AdminComment): string =>
  comment.author.kind === 'visitor' ? comment.author.name : 'Toi, auteur du site';

const parentName = (author: ParentAuthor): string =>
  author.kind === 'owner' ? 'toi' : author.name;

export function toAdminCommentRow(comment: AdminComment, now: Date): AdminCommentRow {
  const { author, parent } = comment;
  const email = author.kind === 'visitor' ? author.email : null;
  const authorName = commentAuthorName(comment);
  return {
    author: authorName,
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
    publishLabel: comment.status === 'pending' ? `Publier le commentaire de ${authorName}` : null,
  };
}

type ModerationAction = 'publish';

const UP_TO_DATE = 'La liste est à jour.';

const FAILURE_MESSAGES: Record<
  ModerationAction,
  Record<ModerationFailure, (comment: AdminComment) => string>
> = {
  publish: {
    'not-found': () => `Ce commentaire a été supprimé entre-temps. ${UP_TO_DATE}`,
    // L'API répond 409 aussi bien à un commentaire déjà publié qu'à une réponse dont le parent attend.
    conflict: (comment) =>
      comment.parent === null
        ? `Ce commentaire est déjà publié. ${UP_TO_DATE}`
        : `Ce commentaire est déjà publié, ou celui auquel il répond ne l'est pas encore. ${UP_TO_DATE}`,
    failed: () => "Le commentaire n'a pas pu être publié. Réessaie dans un instant.",
  },
};

export function moderationFailureMessage(
  action: ModerationAction,
  reason: ModerationFailure,
  comment: AdminComment,
): string {
  return FAILURE_MESSAGES[action][reason](comment);
}

export function commentsSummary(status: CommentStatus, total: number): string {
  const [singular, plural] = SUMMARY_WORDS[status];
  return counted(total, singular, plural);
}
