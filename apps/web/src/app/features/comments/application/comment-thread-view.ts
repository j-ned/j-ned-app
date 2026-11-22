import { OWNER_NAME } from '@shared/seo/site-person';
import type {
  CommentDraft,
  CommentRejection,
  PendingComment,
  PublishedReply,
  PublishedThread,
} from '../domain/models/comment.model';
import { withoutPublished } from '../domain/pending-comments';
import { COMMENT_COPY } from './comment-copy';

export type CommentView = {
  readonly id: string;
  readonly headingId: string;
  readonly author: string;
  readonly ownerMention: string | null;
  // Première lettre du nom, pour la pastille décorative.
  readonly initial: string;
  readonly createdAt: string;
  readonly body: string;
  // Envoyé par ce lecteur et pas encore publié : lui seul le voit.
  readonly pending: boolean;
};

export type CommentThreadItem = CommentView & {
  readonly replies: readonly CommentView[];
  readonly repliesLabel: string;
};

export type CommentThreadView = {
  // Commentaires et réponses publiés ; ceux qui attendent la relecture ne comptent pas.
  readonly count: number;
  readonly items: readonly CommentThreadItem[];
  readonly truncation: string | null;
};

export type CommentThreadContent =
  | { readonly status: 'loading' }
  | { readonly status: 'failed' }
  | { readonly status: 'ready'; readonly view: CommentThreadView };

// `parentId` nul : le commentaire du formulaire principal ; sinon, la réponse à ce commentaire.
export type CommentSubmissionState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'sending'; readonly parentId: string | null }
  | { readonly kind: 'sent'; readonly parentId: string | null }
  | {
      readonly kind: 'failed';
      readonly parentId: string | null;
      readonly reason: CommentRejection;
    };

export type CommentSent = { readonly draft: CommentDraft; readonly parentId: string | null };

const initialOf = (name: string): string =>
  Array.from(name.trim())[0]?.toLocaleUpperCase('fr-FR') ?? '?';

// La réponse de l'auteur se dit en toutes lettres, pas par une couleur seule.
const authorOf = ({ author }: PublishedReply): Pick<CommentView, 'author' | 'ownerMention'> =>
  author.kind === 'owner'
    ? { author: OWNER_NAME, ownerMention: COMMENT_COPY.ownerMention }
    : { author: author.name, ownerMention: null };

function toCommentView(
  id: string,
  { author, ownerMention }: Pick<CommentView, 'author' | 'ownerMention'>,
  { createdAt, body }: Pick<CommentView, 'createdAt' | 'body'>,
  pending: boolean,
): CommentView {
  return {
    id,
    headingId: `comment-${id}-author`,
    author,
    ownerMention,
    initial: initialOf(author),
    createdAt,
    body,
    pending,
  };
}

const toPublishedView = (comment: PublishedReply): CommentView =>
  toCommentView(comment.id, authorOf(comment), comment, false);

const toPendingView = (comment: PendingComment): CommentView =>
  toCommentView(comment.id, { author: comment.name, ownerMention: null }, comment, true);

const toThreadItem = (view: CommentView, replies: readonly CommentView[]): CommentThreadItem => ({
  ...view,
  replies,
  repliesLabel: `Réponses à ${view.author}`,
});

// Les envois en attente de ce lecteur suivent les publiés : un commentaire en fin de liste, une
// réponse sous son parent (et nulle part si le parent n'est pas dans la page lue).
export function toCommentThreadView(
  thread: PublishedThread,
  pending: readonly PendingComment[] = [],
): CommentThreadView {
  const waiting = withoutPublished(pending, thread);
  const published = thread.comments.map((comment) =>
    toThreadItem(toPublishedView(comment), [
      ...comment.replies.map(toPublishedView),
      ...waiting.filter((entry) => entry.parentId === comment.id).map(toPendingView),
    ]),
  );
  const waitingComments = waiting
    .filter((entry) => entry.parentId === null)
    .map((entry) => toThreadItem(toPendingView(entry), []));
  return {
    count: thread.comments.reduce((sum, comment) => sum + 1 + comment.replies.length, 0),
    items: [...published, ...waitingComments],
    truncation:
      thread.total > thread.comments.length ? COMMENT_COPY.truncated(thread.comments.length) : null,
  };
}
