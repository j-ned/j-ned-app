import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError, type Observable } from 'rxjs';
import type {
  AdminComment,
  AdminCommentPage,
  CommentRejection,
  PublicAuthor,
  PublishedReply,
  PublishedThread,
} from '../domain/models/comment.model';
import { isCommentId } from '../domain/comment-id';
import type { ModerationRejection, ModerationResult } from '../domain/moderation-result';
import type {
  AdminCommentDto,
  AdminCommentPageDto,
  PublicCommentPageDto,
  PublicReplyDto,
} from './comment.types';

const toPublicAuthor = (author: PublicReplyDto['author']): PublicAuthor =>
  author.kind === 'owner' ? { kind: 'owner' } : { kind: 'visitor', name: author.name };

// Liste de champs fermée : l'écran ne reçoit que ce qu'il affiche.
export function toAdminComment(dto: AdminCommentDto): AdminComment {
  return {
    id: dto.id,
    post: { id: dto.post.id, slug: dto.post.slug, title: dto.post.title },
    parent: dto.parent && {
      id: dto.parent.id,
      author: toPublicAuthor(dto.parent.author),
      excerpt: dto.parent.excerpt,
    },
    author:
      dto.author.kind === 'owner'
        ? { kind: 'owner' }
        : { kind: 'visitor', name: dto.author.name, email: dto.author.email },
    body: dto.body,
    status: dto.status,
    createdAt: dto.createdAt,
    replyCount: dto.replyCount,
  };
}

// Liste de champs fermée : une clé ajoutée par l'API n'entre ni dans le modèle ni dans le DOM.
// L'état de transfert du rendu serveur garde la réponse brute : seul le schéma de sortie de l'API
// garantit qu'aucune adresse n'y figure.
const toPublishedReply = (dto: PublicReplyDto): PublishedReply => ({
  id: dto.id,
  author: toPublicAuthor(dto.author),
  body: dto.body,
  createdAt: dto.createdAt,
});

export function toPublishedThread(dto: PublicCommentPageDto): PublishedThread {
  return {
    comments: dto.data.map((comment) => ({
      ...toPublishedReply(comment),
      replies: comment.replies.map(toPublishedReply),
    })),
    total: dto.total,
  };
}

export function toAdminCommentPage(dto: AdminCommentPageDto): AdminCommentPage {
  return { comments: dto.data.map(toAdminComment), total: dto.total };
}

// 429 couvre le quota par IP et le plafond de commentaires en attente ; 503, la file pleine.
const REJECTIONS: Readonly<Record<number, CommentRejection>> = {
  0: 'network',
  400: 'invalid',
  404: 'not-found',
  409: 'conflict',
  413: 'invalid',
  429: 'rate-limited',
  503: 'closed',
};

// Corps d'un 202 lu comme `unknown` : seul un UUID sert d'identifiant à l'envoi en attente.
export function toAcceptedId(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || !('id' in body)) return null;
  const { id } = body;
  return isCommentId(id) ? id : null;
}

export function toCommentRejection(status: number): CommentRejection {
  return REJECTIONS[status] ?? 'unavailable';
}

const MODERATION_REJECTIONS: Readonly<Record<number, ModerationRejection>> = {
  404: 'not-found',
  409: 'conflict',
};

export function rejectedOrOutage<T>(error: unknown): Observable<ModerationResult<T>> {
  const rejection =
    error instanceof HttpErrorResponse ? MODERATION_REJECTIONS[error.status] : undefined;
  return rejection ? of({ success: false, error: rejection }) : throwError(() => error);
}
