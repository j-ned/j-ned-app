import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, type Observable } from 'rxjs';
import { silentErrors } from '@core/interceptors/skip-error-toast';
import { API_BASE_URL } from '@shared/api/api-config';
import { refreshable } from '@shared/api/refreshable';
import type { AdminComment, AdminCommentPage, CommentStatus } from '../domain/models/comment.model';
import { rejectAsModerationError, toAdminComment, toAdminCommentPage } from './comment.adapter';
import type { AdminCommentDto, AdminCommentPageDto } from './comment.types';

@Injectable({ providedIn: 'root' })
export class CommentsGateway {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);

  // Seule la relance peut afficher un toast : un échec suivi d'une relance réussie reste muet.
  private readonly pendingCount = refreshable(() =>
    this.fetchPendingCount(silentErrors()).pipe(catchError(() => this.fetchPendingCount())),
  );

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
