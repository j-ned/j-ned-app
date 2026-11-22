import { Component, computed, inject, linkedSignal, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  EMPTY,
  catchError,
  map,
  of,
  switchMap,
  tap,
  throwError,
  type Observable,
  type OperatorFunction,
} from 'rxjs';
import type {
  AdminComment,
  AdminCommentPage,
  CommentStatus,
} from '@features/comments/domain/models/comment.model';
import {
  ModerationError,
  type ModerationFailure,
} from '@features/comments/domain/moderation-error';
import { CommentsGateway } from '@features/comments/infra/comments.gateway';
import { ToastStore } from '@core/notifications/toast-store';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { FilterGroup } from '@shared/ui/filter-group';
import { loadState, resourceValueOr } from '@shared/ui/load-state';
import {
  ADMIN_COMMENTS_PAGE_SIZE,
  COMMENT_FILTERS,
  commentAuthorName,
  commentsSummary,
  deletionPrompt,
  moderationFailureMessage,
  type ModerationAction,
} from '../../application/admin-comments-view';
import { AdminCommentRow } from '../../application/components/admin-comment-row';
import { AdminEmptyState } from '../../application/components/admin-empty-state';
import { AdminListState } from '../../application/components/admin-list-state';
import { AdminPageHeader } from '../../application/components/admin-page-header';
import { AdminPager } from '../../application/components/admin-pager';
import { pager } from '../../application/pager';
import { PendingDeletion } from '../../application/pending-deletion';

type PageRequest = { readonly status: CommentStatus; readonly page: number };

@Component({
  selector: 'app-admin-comments',
  imports: [
    ConfirmDialog,
    FilterGroup,
    AdminCommentRow,
    AdminEmptyState,
    AdminListState,
    AdminPageHeader,
    AdminPager,
  ],
  host: { class: 'block' },
  template: `
    <app-admin-page-header heading="Commentaires">
      Les commentaires des articles, du plus récent au plus ancien. Rien n'est publié sans ta
      validation&nbsp;; refuser un commentaire le supprime.
    </app-admin-page-header>

    <app-filter-group label="Filtrer par statut" [options]="filters" [(active)]="status" />

    <app-admin-list-state
      [state]="listState()"
      testIdPrefix="admin-comments"
      loadingLabel="Chargement des commentaires…"
      errorMessage="Les commentaires n'ont pas pu être chargés. Vérifie ta connexion, puis réessaie."
      skeletonClass="h-24 rounded-sm"
      loadingClass="mt-5"
      (retry)="commentsRes.reload()"
    >
      <ng-template #listEmpty>
        <app-admin-empty-state [stamp]="emptyStamp()" class="mt-5">
          <p>{{ emptyMessage() }}</p>
        </app-admin-empty-state>
      </ng-template>
      <ng-template #listReady>
        <p
          data-testid="admin-comments-summary"
          class="mt-5 font-mono text-[0.8125rem] text-primary"
        >
          {{ summary() }}
        </p>
        <ul data-testid="admin-comments-list" role="list" class="mt-2">
          @for (comment of comments(); track comment.id) {
            <li
              app-admin-comment-row
              [comment]="comment"
              (publishRequested)="publish(comment)"
              (deleteRequested)="deletion.request(comment)"
            ></li>
          }
        </ul>
      </ng-template>
    </app-admin-list-state>

    <app-confirm-dialog
      [open]="deletionPrompt() !== null"
      [heading]="deletionPrompt()?.heading ?? ''"
      [confirmLabel]="deletionPrompt()?.confirmLabel ?? ''"
      (confirmed)="confirmDeletion()"
      (cancelled)="deletion.cancel()"
    >
      <p>{{ deletionPrompt()?.description }}</p>
    </app-confirm-dialog>

    @if (pager().pageCount > 1) {
      <app-admin-pager
        testIdPrefix="admin-comments"
        label="Pages des commentaires"
        newerLabel="Plus récents"
        olderLabel="Plus anciens"
        [pager]="pager()"
        (newer)="showNewer()"
        (older)="showOlder()"
      />
    }
  `,
})
export class AdminComments {
  private readonly gateway = inject(CommentsGateway);
  private readonly toast = inject(ToastStore);
  private readonly _pageHeader = viewChild.required(AdminPageHeader);

  protected readonly filters = COMMENT_FILTERS;
  protected readonly status = signal<CommentStatus>('pending');
  // Changer de filtre ramène à la première page.
  private readonly _requestedPage = linkedSignal({ source: this.status, computation: () => 1 });
  private readonly _served = signal<PageRequest & { readonly total: number }>({
    status: 'pending',
    page: 1,
    total: 0,
  });

  protected readonly commentsRes = rxResource({
    params: (): PageRequest => ({ status: this.status(), page: this._requestedPage() }),
    stream: ({ params }) => this.loadPage(params),
  });

  protected readonly comments = computed(() => resourceValueOr(this.commentsRes, []));
  protected readonly listState = computed(() =>
    loadState(this.commentsRes, () => this.comments().length === 0),
  );
  protected readonly summary = computed(() =>
    commentsSummary(this._served().status, this._served().total),
  );
  protected readonly pager = computed(() =>
    pager(this._served().total, this._served().page, ADMIN_COMMENTS_PAGE_SIZE),
  );
  protected readonly emptyStamp = computed(() =>
    this.status() === 'pending' ? 'File vide' : 'Aucun commentaire',
  );
  protected readonly emptyMessage = computed(() =>
    this.status() === 'pending'
      ? 'Aucun commentaire en attente. Chaque nouveau commentaire arrive ici et par e-mail.'
      : "Aucun commentaire publié pour l'instant.",
  );

  // Publier fait quitter la file en attente : même retrait immédiat qu'une suppression, remis en
  // place si l'API refuse.
  private readonly _publication = new PendingDeletion<AdminComment>({
    list: this.commentsRes,
    remove: (comment): Observable<AdminComment> =>
      this.gateway.publish(comment.id).pipe(this.settlingIfStale('publish', comment)),
    succeeded: (comment): void => {
      this.toast.add({
        severity: 'success',
        detail: `Commentaire de ${commentAuthorName(comment)} publié`,
      });
      this.refresh();
    },
    failed: (comment): void => this.tellFailure('publish', 'failed', comment),
  });

  protected readonly deletion = new PendingDeletion<AdminComment>({
    list: this.commentsRes,
    remove: (comment): Observable<void> =>
      this.gateway.remove(comment.id).pipe(this.settlingIfStale('delete', comment)),
    succeeded: (comment): void => {
      this.toast.add({ severity: 'success', detail: deletionPrompt(comment).done });
      this.refresh();
    },
    failed: (comment): void => this.tellFailure('delete', 'failed', comment),
  });
  protected readonly deletionPrompt = computed(() => {
    const target = this.deletion.target();
    return target && deletionPrompt(target);
  });

  protected confirmDeletion(): void {
    this.deletion.confirm();
    this._pageHeader().focusTitle();
  }

  protected publish(comment: AdminComment): void {
    this._publication.delete(comment);
    this._pageHeader().focusTitle();
  }

  protected showNewer(): void {
    if (this.pager().hasNewer) this.show(this._served().page - 1);
  }

  protected showOlder(): void {
    if (this.pager().hasOlder) this.show(this._served().page + 1);
  }

  // Après un repli, la page servie n'est plus la page demandée : la redemander ne changerait pas
  // le paramètre de la ressource, il faut la relancer.
  private show(page: number): void {
    if (page === this._requestedPage()) this.commentsRes.reload();
    else this._requestedPage.set(page);
  }

  // Le compteur de la navigation et la page servie (total, pages) suivent la file réelle.
  private refresh(): void {
    this.gateway.invalidatePendingCount();
    this.commentsRes.reload();
  }

  // Un commentaire changé ailleurs (déjà publié, supprimé) : la ligne ne revient pas, la liste
  // est relue. Seule une panne la remet en place, par l'échec que reçoit `PendingDeletion`.
  private settlingIfStale<T>(
    action: ModerationAction,
    comment: AdminComment,
  ): OperatorFunction<T, T> {
    return catchError((error: unknown) => {
      const reason = error instanceof ModerationError ? error.reason : 'failed';
      if (reason === 'failed') return throwError(() => error);
      this.tellFailure(action, reason, comment);
      this.refresh();
      return EMPTY;
    });
  }

  private tellFailure(
    action: ModerationAction,
    reason: ModerationFailure,
    comment: AdminComment,
  ): void {
    this.toast.add({
      severity: 'error',
      detail: moderationFailureMessage(action, reason, comment),
    });
  }

  // Une suppression faite ailleurs peut vider la dernière page : on retombe sur la nouvelle
  // dernière page plutôt que d'afficher une page vide.
  private loadPage({ status, page }: PageRequest): Observable<readonly AdminComment[]> {
    const fetch = (at: number): Observable<AdminCommentPage & { readonly page: number }> =>
      this.gateway
        .getAdminPage(status, at, ADMIN_COMMENTS_PAGE_SIZE)
        .pipe(map((loaded) => ({ ...loaded, page: at })));
    return fetch(page).pipe(
      switchMap((loaded) => {
        const lastPage = pager(loaded.total, page, ADMIN_COMMENTS_PAGE_SIZE).pageCount;
        return page <= lastPage ? of(loaded) : fetch(lastPage);
      }),
      tap(({ total, page: served }) => this._served.set({ status, page: served, total })),
      map(({ comments }) => comments),
    );
  }
}
