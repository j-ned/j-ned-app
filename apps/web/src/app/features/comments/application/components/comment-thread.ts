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
  imports: [CommentItem, CommentForm, StatusMessage],
  host: {
    'data-testid': 'comment-thread',
    'aria-labelledby': 'comments-heading',
    class: 'block border-t border-foreground/8 pt-10',
  },
  template: `
    <h2 id="comments-heading" class="text-2xl font-bold tracking-tight">{{ heading() }}</h2>
    @let current = content();
    @let mainStatus = mainSubmissionStatus();
    @let replyStatus = replySubmissionStatus();
    @switch (current.status) {
      @case ('failed') {
        <p data-testid="comments-load-error" class="mt-4 text-foreground/85">
          {{ copy.loadFailed }}
        </p>
      }
      @case ('ready') {
        @if (current.view.items.length === 0) {
          <p data-testid="comments-empty" class="mt-4 text-muted">{{ copy.empty }}</p>
        } @else {
          <ol data-testid="comment-list" class="mt-6 grid gap-8">
            @for (item of current.view.items; track item.id) {
              @let replyFormId = 'reply-' + item.id + '-form';
              @let replyOpen = replyTarget() === item.id;
              <li>
                <article
                  app-comment-item
                  [comment]="item"
                  [replyable]="true"
                  [replyOpen]="replyOpen"
                  [replyFormId]="replyFormId"
                  (replyRequested)="replyOpened.emit(item.id)"
                ></article>
                @if (replyOpen) {
                  <div
                    [id]="replyFormId"
                    data-testid="comment-reply-form"
                    class="mt-4 rounded-card border border-foreground/10 p-5"
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
                @if (item.replies.length > 0) {
                  <ol
                    [attr.aria-label]="item.repliesLabel"
                    class="mt-5 grid gap-5 border-l-2 border-foreground/10 pl-5"
                  >
                    @for (reply of item.replies; track reply.id) {
                      <li><article app-comment-item [comment]="reply" level="reply"></article></li>
                    }
                  </ol>
                }
              </li>
            }
          </ol>
          @if (current.view.truncation; as truncation) {
            <p data-testid="comments-truncated" class="mt-6 text-sm text-muted">
              {{ truncation }}
            </p>
          }
        }
      }
    }
    <div data-testid="comment-main-form" class="mt-10">
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
          class="mt-4"
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

  protected readonly heading = computed(() => {
    const current = this.content();
    return current.status === 'ready' ? current.view.heading : COMMENT_COPY.heading;
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
