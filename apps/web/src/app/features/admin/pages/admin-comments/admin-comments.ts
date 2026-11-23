import {
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, mergeMap, of, type Observable, type OperatorFunction } from 'rxjs';
import type { AdminComment } from '@features/comments/domain/models/comment.model';
import type {
  ModerationFailure,
  ModerationResult,
} from '@features/comments/domain/moderation-result';
import { CommentsGateway } from '@features/comments/infra/comments.gateway';
import { refreshAdminWhenVisible } from '../../application/refresh-admin-when-visible';
import { ToastStore } from '@core/notifications/toast-store';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { FilterGroup } from '@shared/ui/filter-group';
import {
  COMMENT_FILTERS,
  EMPTY_QUEUE,
  commentAuthorName,
  deletionPrompt,
  moderationFailureMessage,
  replyPublishedNotice,
  type ModerationAction,
} from '../../application/admin-comments-view';
import { AdminCommentRow } from '../../application/components/admin-comment-row';
import { AdminEmptyState } from '../../application/components/admin-empty-state';
import { AdminListState } from '../../application/components/admin-list-state';
import { AdminPageHeader } from '../../application/components/admin-page-header';
import { AdminPager } from '../../application/components/admin-pager';
import { PendingDeletion } from '../../application/pending-deletion';
import { CommentQueue } from './comment-queue';

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
      validation&#8239;; refuser un commentaire le supprime.
    </app-admin-page-header>

    <app-filter-group label="Filtrer par statut" [options]="filters" [(active)]="queue.status" />

    <app-admin-list-state
      [state]="queue.state()"
      testIdPrefix="admin-comments"
      loadingLabel="Chargement des commentaires…"
      errorMessage="Les commentaires n'ont pas pu être chargés. Vérifie ta connexion, puis réessaie."
      skeletonClass="h-24 rounded-sm"
      loadingClass="mt-5"
      (retry)="queue.list.reload()"
    >
      <ng-template #listEmpty>
        <app-admin-empty-state [stamp]="emptyQueue().stamp" class="mt-5">
          <p>{{ emptyQueue().message }}</p>
        </app-admin-empty-state>
      </ng-template>
      <ng-template #listReady>
        <p
          data-testid="admin-comments-summary"
          class="mt-5 font-mono text-[0.8125rem] text-primary"
        >
          {{ queue.summary() }}
        </p>
        <ul data-testid="admin-comments-list" role="list" class="mt-2">
          @for (comment of queue.comments(); track comment.id) {
            <li
              app-admin-comment-row
              [comment]="comment"
              (publishRequested)="publish(comment)"
              (deleteRequested)="deletion.request(comment)"
              [replying]="replyTarget() === comment.id"
              [replySending]="replySending()"
              [replyResetToken]="replyResetToken()"
              (replyRequested)="toggleReply(comment)"
              (replySubmitted)="sendReply(comment, $event)"
              (replyCancelled)="closeReply(comment)"
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

    @if (queue.pager().pageCount > 1) {
      <nav
        app-admin-pager
        testIdPrefix="admin-comments"
        label="Pages des commentaires"
        newerLabel="Plus récents"
        olderLabel="Plus anciens"
        [pager]="queue.pager()"
        (newer)="queue.showNewer()"
        (older)="queue.showOlder()"
      ></nav>
    }
  `,
})
export class AdminComments {
  private readonly gateway = inject(CommentsGateway);
  private readonly toast = inject(ToastStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly _pageHeader = viewChild.required(AdminPageHeader);
  private readonly _rows = viewChildren(AdminCommentRow);

  protected readonly filters = COMMENT_FILTERS;
  protected readonly queue = new CommentQueue();
  protected readonly emptyQueue = computed(() => EMPTY_QUEUE[this.queue.status()]);

  // Publier fait quitter la file en attente : même retrait immédiat qu'une suppression, remis en
  // place si l'API refuse.
  private readonly _publication = new PendingDeletion<AdminComment>({
    list: this.queue.list,
    remove: (comment): Observable<AdminComment> =>
      this.gateway.publish(comment.id).pipe(this.settlingIfStale('publish', comment)),
    succeeded: (comment): void => {
      this.toast.add({
        severity: 'success',
        detail: `Commentaire de ${commentAuthorName(comment)} publié`,
      });
      this.queue.refresh();
    },
    failed: (comment): void => this.tellFailure('publish', 'failed', comment),
  });

  protected readonly deletion = new PendingDeletion<AdminComment>({
    list: this.queue.list,
    remove: (comment): Observable<void> =>
      this.gateway.remove(comment.id).pipe(this.settlingIfStale('delete', comment)),
    succeeded: (comment): void => {
      this.toast.add({ severity: 'success', detail: deletionPrompt(comment).done });
      this.queue.refresh();
    },
    failed: (comment): void => this.tellFailure('delete', 'failed', comment),
  });
  protected readonly deletionPrompt = computed(() => {
    const target = this.deletion.target();
    return target && deletionPrompt(target);
  });

  // La file et le compteur de la navigation ont pu bouger depuis un autre onglet.
  constructor() {
    refreshAdminWhenVisible(() => this.queue.refresh());
  }

  protected confirmDeletion(): void {
    this.deletion.confirm();
    this._pageHeader().focusTitle();
  }

  protected readonly replyTarget = signal<string | null>(null);
  protected readonly replySending = signal(false);
  protected readonly replyResetToken = signal(0);

  protected toggleReply(comment: AdminComment): void {
    this.replyTarget.update((current) => (current === comment.id ? null : comment.id));
  }

  protected closeReply(comment: AdminComment): void {
    this.replyTarget.set(null);
    this._rows()
      .find((row) => row.comment().id === comment.id)
      ?.focusReply();
  }

  protected sendReply(comment: AdminComment, body: string): void {
    this.replySending.set(true);
    this.gateway
      .reply(comment.id, body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.replySending.set(false);
          if (!result.success) {
            this.tellFailure('reply', result.error, comment);
            // Le formulaire qui a le focus disparaît avec la cible : le titre le reprend.
            this.replyTarget.set(null);
            this._pageHeader().focusTitle();
            this.queue.refresh();
            return;
          }
          this.replyResetToken.update((token) => token + 1);
          this.queue.addReply(comment, result.data);
          this.toast.add({ severity: 'success', detail: replyPublishedNotice(comment) });
          this.closeReply(comment);
        },
        error: () => {
          this.replySending.set(false);
          this.tellFailure('reply', 'failed', comment);
        },
      });
  }

  protected publish(comment: AdminComment): void {
    this._publication.delete(comment);
    this._pageHeader().focusTitle();
  }

  // Un commentaire changé ailleurs (déjà publié, supprimé) : la ligne ne revient pas, la liste
  // est relue. Seule une panne la remet en place, par l'échec que reçoit `PendingDeletion`.
  private settlingIfStale<T>(
    action: ModerationAction,
    comment: AdminComment,
  ): OperatorFunction<ModerationResult<T>, T> {
    return mergeMap((result) => {
      if (result.success) return of(result.data);
      this.tellFailure(action, result.error, comment);
      this.queue.refresh();
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
}
