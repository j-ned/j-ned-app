import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  afterRenderEffect,
  computed,
  inject,
  input,
  output,
  viewChild,
  viewChildren,
} from '@angular/core';
import { AppIcon } from '@shared/icons/app-icon';
import { StatusMessage } from '@shared/ui/status-message';
import { COMMENT_COPY, COMMENT_REJECTION_COPY } from '../comment-copy';
import type {
  CommentSent,
  CommentSubmissionState,
  CommentThreadContent,
} from '../comment-thread-view';
import { CommentForm } from './comment-form';
import { CommentItem } from './comment-item';

// `parentId` dit sous quel commentaire s'affiche le message d'une réponse.
type SubmissionStatus = {
  readonly parentId: string | null;
  readonly tone: 'success' | 'error';
  readonly text: string;
};

function statusOf(submission: CommentSubmissionState): SubmissionStatus | null {
  switch (submission.kind) {
    case 'sent':
      return { parentId: submission.parentId, tone: 'success', text: COMMENT_COPY.sent };
    case 'failed':
      return {
        parentId: submission.parentId,
        tone: 'error',
        text: COMMENT_REJECTION_COPY[submission.reason],
      };
    default:
      return null;
  }
}

@Component({
  selector: 'section[app-comment-thread]',
  imports: [AppIcon, CommentItem, CommentForm, StatusMessage],
  host: {
    'data-testid': 'comment-thread',
    'aria-labelledby': 'comments-heading',
    class: 'block border-t border-line pt-10',
  },
  template: `
    @let current = content();
    @let mainStatus = mainSubmissionStatus();
    @let replyStatus = replySubmissionStatus();
    <h2 id="comments-heading" class="flex items-center gap-3 text-2xl font-bold tracking-tight">
      {{ copy.heading }}
      @if (count(); as shown) {
        <span class="sr-only">(</span
        ><span
          data-testid="comments-count"
          class="inline-grid min-w-8 place-items-center rounded-full bg-foreground/8 px-2.5 py-0.5 font-mono text-sm font-medium tabular-nums"
          >{{ shown }}</span
        ><span class="sr-only">)</span>
      }
    </h2>
    @switch (current.status) {
      @case ('failed') {
        <p
          data-testid="comments-load-error"
          class="mt-6 flex items-center gap-3 rounded-card border border-line p-5 text-foreground"
        >
          <app-icon name="exclamation-triangle" class="text-status-error" />
          {{ copy.loadFailed }}
        </p>
      }
      @case ('ready') {
        @if (current.view.items.length === 0) {
          <p
            data-testid="comments-empty"
            class="mt-6 flex items-center gap-3 rounded-card border border-dashed border-line-strong p-5 text-muted"
          >
            <app-icon name="comment" />
            {{ copy.empty }}
          </p>
        } @else {
          <ol data-testid="comment-list" class="mt-6 grid gap-4">
            @for (item of current.view.items; track item.id) {
              @let replyFormId = 'reply-' + item.id + '-form';
              @let replyOpen = replyTarget() === item.id;
              <li
                class="rounded-card border bg-surface p-5 sm:p-6"
                [class]="item.pending ? 'border-dashed border-line-strong' : 'border-line'"
              >
                <article
                  app-comment-item
                  [comment]="item"
                  [replyable]="!item.pending"
                  [replyOpen]="replyOpen"
                  [replyFormId]="replyFormId"
                  (replyRequested)="replyOpened.emit(item.id)"
                ></article>
                @if (item.replies.length > 0) {
                  <ol
                    [attr.aria-label]="item.repliesLabel"
                    class="mt-5 grid gap-5 border-l-2 border-line pl-4 sm:ml-4 sm:pl-6"
                  >
                    @for (reply of item.replies; track reply.id) {
                      <li><article app-comment-item [comment]="reply" level="reply"></article></li>
                    }
                  </ol>
                }
                @if (replyOpen) {
                  <div
                    [id]="replyFormId"
                    data-testid="comment-reply-form"
                    class="mt-5 rounded-field border border-line bg-background p-4 sm:p-5"
                  >
                    <app-comment-form
                      [idPrefix]="'reply-' + item.id"
                      [legend]="'Répondre à ' + item.author"
                      [cancellable]="true"
                      [focusOnOpen]="true"
                      [sending]="replySending()"
                      (submitted)="submitted.emit({ draft: $event, parentId: item.id })"
                      (cancelled)="closeReply(item.id)"
                    />
                  </div>
                }
                @if (replyStatus && replyStatus.parentId === item.id) {
                  <app-status-message
                    #replyStatusMessage
                    tabindex="-1"
                    class="mt-4"
                    [tone]="replyStatus.tone"
                    >{{ replyStatus.text }}</app-status-message
                  >
                }
              </li>
            }
          </ol>
          @if (current.view.truncation; as truncation) {
            <p data-testid="comments-truncated" class="mt-4 text-sm text-muted">
              {{ truncation }}
            </p>
          }
        }
      }
    }
    <div
      data-testid="comment-main-form"
      class="mt-8 rounded-card border-2 border-foreground bg-surface p-5 sm:p-7"
    >
      <app-comment-form
        idPrefix="comment"
        [legend]="copy.formLegend"
        [sending]="mainSending()"
        [resetToken]="resetToken()"
        (submitted)="submitted.emit({ draft: $event, parentId: null })"
      />
      @if (mainStatus) {
        <app-status-message
          #mainStatusMessage
          tabindex="-1"
          class="mt-5"
          [tone]="mainStatus.tone"
          >{{ mainStatus.text }}</app-status-message
        >
      }
    </div>
  `,
})
export class CommentThread {
  private readonly _injector = inject(Injector);

  readonly content = input.required<CommentThreadContent>();
  readonly submission = input<CommentSubmissionState>({ kind: 'idle' });
  readonly replySubmission = input<CommentSubmissionState>({ kind: 'idle' });
  readonly resetToken = input(0);
  readonly replyTarget = input<string | null>(null);
  readonly submitted = output<CommentSent>();
  readonly replyOpened = output<string>();
  readonly replyClosed = output<void>();

  private readonly _mainStatus = viewChild('mainStatusMessage', { read: ElementRef<HTMLElement> });
  private readonly _replyStatus = viewChild('replyStatusMessage', {
    read: ElementRef<HTMLElement>,
  });
  private readonly _items = viewChildren(CommentItem);

  protected readonly copy = COMMENT_COPY;

  // Nul tant que rien n'est publié : le titre se lit alors « Commentaires », sans pastille.
  protected readonly count = computed(() => {
    const current = this.content();
    return current.status === 'ready' ? current.view.count : 0;
  });

  protected readonly mainSubmissionStatus = computed(() => statusOf(this.submission()));
  protected readonly replySubmissionStatus = computed(() => statusOf(this.replySubmission()));
  protected readonly mainSending = computed(() => this.submission().kind === 'sending');
  protected readonly replySending = computed(() => this.replySubmission().kind === 'sending');

  // Après un envoi accepté, le focus va sur sa confirmation ; un refus, en alerte, le laisse en place.
  private readonly focusMainConfirmation = afterRenderEffect({
    write: () => {
      if (this.submission().kind === 'sent') this._mainStatus()?.nativeElement.focus();
    },
  });

  private readonly focusReplyConfirmation = afterRenderEffect({
    write: () => {
      if (this.replySubmission().kind === 'sent') this._replyStatus()?.nativeElement.focus();
    },
  });

  protected closeReply(id: string): void {
    this.replyClosed.emit();
    afterNextRender(
      {
        write: () =>
          this._items()
            .find((item) => item.comment().id === id)
            ?.focusReplyButton(),
      },
      { injector: this._injector },
    );
  }
}
