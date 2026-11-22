import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, of, type Observable } from 'rxjs';
import { silentErrors } from '@core/interceptors/skip-error-toast';
import { OPTIONAL_UPSTREAM } from '@core/ssr/ssr-upstream-interceptor';
import { API_BASE_URL } from '@shared/api/api-config';
import { refreshable } from '@shared/api/refreshable';
import type {
  AdminComment,
  AdminCommentPage,
  CommentDraft,
  CommentStatus,
  CommentSubmission,
  PublishedThread,
} from '../domain/models/comment.model';
import {
  rejectAsModerationError,
  toAdminComment,
  toAdminCommentPage,
  toCommentRejection,
  toPublishedThread,
} from './comment.adapter';
import type { AdminCommentDto, AdminCommentPageDto, PublicCommentPageDto } from './comment.types';

// Plafond de l'API : au-delà, la section dit que seuls les premiers sont affichés.
const THREAD_PAGE_SIZE = 100;

@Injectable({ providedIn: 'root' })
export class CommentsGateway {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);

  // Seule la relance peut afficher un toast : un échec suivi d'une relance réussie reste muet.
  private readonly pendingCount = refreshable(() =>
    this.fetchPendingCount(silentErrors()).pipe(catchError(() => this.fetchPendingCount())),
  );

  // La section nomme elle-même l'échec ; l'article, lui, reste servi.
  getThread(slug: string): Observable<PublishedThread> {
    return this.http
      .get<PublicCommentPageDto>(`${this.apiUrl}/blog/posts/${encodeURIComponent(slug)}/comments`, {
        params: { page: 1, limit: THREAD_PAGE_SIZE },
        context: silentErrors().set(OPTIONAL_UPSTREAM, true),
      })
      .pipe(map(toPublishedThread));
  }

  // Un refus de l'API est une réponse attendue, jamais une erreur : la section le nomme elle-même.
  submit(
    slug: string,
    draft: CommentDraft,
    parentId: string | null,
  ): Observable<CommentSubmission> {
    const { name, email, body, website } = draft;
    return this.http
      .post(
        `${this.apiUrl}/blog/posts/${encodeURIComponent(slug)}/comments`,
        { name, email, body, website, ...(parentId === null ? {} : { parentId }) },
        { context: silentErrors() },
      )
      .pipe(
        map((): CommentSubmission => ({ success: true })),
        catchError((error: unknown) =>
          of<CommentSubmission>({
            success: false,
            error: toCommentRejection(error instanceof HttpErrorResponse ? error.status : 0),
          }),
        ),
      );
  }

  // Lue par l'admin seul, qui affiche son propre état d'erreur.
  getAdminPage(status: CommentStatus, page: number, limit: number): Observable<AdminCommentPage> {
    return this.http
      .get<AdminCommentPageDto>(`${this.apiUrl}/blog/comments`, {
        params: { status, page, limit },
        context: silentErrors(),
      })
      .pipe(map(toAdminCommentPage));
  }

  // Les écritures de l'admin : la page restaure son état et nomme l'échec elle-même.
  publish(id: string): Observable<AdminComment> {
    return this.http
      .patch<AdminCommentDto>(
        `${this.apiUrl}/blog/comments/${id}`,
        { status: 'published' },
        { context: silentErrors() },
      )
      .pipe(map(toAdminComment), catchError(rejectAsModerationError));
  }

  // Refuser un commentaire, c'est le supprimer : ses réponses partent avec lui.
  remove(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/blog/comments/${id}`, { context: silentErrors() })
      .pipe(catchError(rejectAsModerationError));
  }

  // Réponse du propriétaire : publiée d'emblée par l'API.
  reply(id: string, body: string): Observable<AdminComment> {
    return this.http
      .post<AdminCommentDto>(
        `${this.apiUrl}/blog/comments/${id}/replies`,
        { body },
        { context: silentErrors() },
      )
      .pipe(map(toAdminComment), catchError(rejectAsModerationError));
  }

  getPendingCount(): Observable<number> {
    return this.pendingCount.value$;
  }

  invalidatePendingCount(): void {
    this.pendingCount.refresh();
  }

  private fetchPendingCount(context = new HttpContext()): Observable<number> {
    return this.http
      .get<{ readonly count: number }>(`${this.apiUrl}/blog/comments/pending-count`, { context })
      .pipe(map(({ count }) => count));
  }
}
