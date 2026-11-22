import { OWNER_NAME } from '@shared/seo/site-person';
import type {
  CommentDraft,
  CommentRejection,
  PublishedReply,
  PublishedThread,
} from '../domain/models/comment.model';
import { COMMENT_COPY } from './comment-copy';

export type CommentView = {
  readonly id: string;
  readonly headingId: string;
  readonly author: string;
  readonly ownerMention: string | null;
  readonly createdAt: string;
  readonly body: string;
};

export type CommentThreadItem = CommentView & {
  readonly replies: readonly CommentView[];
  readonly repliesLabel: string;
};

export type CommentThreadView = {
  readonly heading: string;
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

// La réponse de l'auteur se dit en toutes lettres, pas par une couleur seule.
const authorOf = ({ author }: PublishedReply): Pick<CommentView, 'author' | 'ownerMention'> =>
  author.kind === 'owner'
    ? { author: OWNER_NAME, ownerMention: COMMENT_COPY.ownerMention }
    : { author: author.name, ownerMention: null };

const toCommentView = (comment: PublishedReply): CommentView => ({
  id: comment.id,
  headingId: `comment-${comment.id}-author`,
  ...authorOf(comment),
  createdAt: comment.createdAt,
  body: comment.body,
});

export function toCommentThreadView({ comments, total }: PublishedThread): CommentThreadView {
  const items = comments.map((comment): CommentThreadItem => {
    const view = toCommentView(comment);
    return {
      ...view,
      replies: comment.replies.map(toCommentView),
      repliesLabel: `Réponses à ${view.author}`,
    };
  });
  const count = items.reduce((sum, item) => sum + 1 + item.replies.length, 0);
  return {
    heading: count === 0 ? COMMENT_COPY.heading : `${COMMENT_COPY.heading} (${count})`,
    items,
    truncation: total > comments.length ? COMMENT_COPY.truncated(comments.length) : null,
  };
}
