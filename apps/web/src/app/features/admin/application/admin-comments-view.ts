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

const NBSP = '\u00a0';
const NARROW_NBSP = '\u202f';

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
  readonly deleteLabel: string;
};

export const commentAuthorName = (comment: AdminComment): string =>
  comment.author.kind === 'visitor' ? comment.author.name : 'Toi, auteur du site';

function deleteLabel(comment: AdminComment, authorName: string): string {
  if (comment.author.kind === 'owner') return 'Supprimer ta réponse';
  const verb = comment.status === 'pending' ? 'Refuser' : 'Supprimer';
  return `${verb} le commentaire de ${authorName}`;
}

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
    deleteLabel: deleteLabel(comment, authorName),
    publishLabel: comment.status === 'pending' ? `Publier le commentaire de ${authorName}` : null,
  };
}

export type ModerationAction = 'publish' | 'delete';

const UP_TO_DATE = 'La liste est à jour.';
const DELETE_FAILED = "Le commentaire n'a pas pu être supprimé. Réessaie dans un instant.";

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
  delete: {
    'not-found': () => `Ce commentaire était déjà supprimé. ${UP_TO_DATE}`,
    conflict: () => DELETE_FAILED,
    failed: () => DELETE_FAILED,
  },
};

type DeletionPrompt = {
  readonly heading: string;
  readonly description: string;
  readonly confirmLabel: string;
  readonly done: string;
};

const FINAL = 'Cette action est définitive.';

const repliesGoing = (replyCount: number): string => {
  if (replyCount === 0) return '';
  return replyCount === 1 ? ', et sa réponse avec lui' : `, et ses ${replyCount} réponses avec lui`;
};

// Refuser un commentaire en attente, c'est le supprimer : l'API ne garde aucun refus.
export function deletionPrompt(comment: AdminComment): DeletionPrompt {
  if (comment.author.kind === 'owner') {
    return {
      heading: `Supprimer ta réponse${NARROW_NBSP}?`,
      description: `Ta réponse disparaît de l'article. ${FINAL}`,
      confirmLabel: 'Supprimer la réponse',
      done: 'Ta réponse est supprimée',
    };
  }
  const { name } = comment.author;
  if (comment.status === 'pending') {
    return {
      heading: `Refuser le commentaire de ${name}${NARROW_NBSP}?`,
      description: 'Un commentaire refusé est supprimé définitivement.',
      confirmLabel: 'Refuser et supprimer',
      done: `Commentaire de ${name} refusé et supprimé`,
    };
  }
  return {
    heading: `Supprimer le commentaire de ${name}${NARROW_NBSP}?`,
    description: `Le commentaire disparaît de l'article${repliesGoing(comment.replyCount)}. ${FINAL}`,
    confirmLabel: 'Supprimer le commentaire',
    done: `Commentaire de ${name} supprimé`,
  };
}

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
