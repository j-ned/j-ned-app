import {
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  input,
  output,
  viewChild,
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

type SubmissionStatus = { readonly tone: 'success' | 'error'; readonly text: string };

// Le message d'un envoi ne s'affiche qu'à côté du formulaire qui l'a fait partir.
function statusOf(
  submission: CommentSubmissionState,
  parentId: string | null,
): SubmissionStatus | null {
  if (submission.kind === 'idle' || submission.parentId !== parentId) return null;
  if (submission.kind === 'sent') return { tone: 'success', text: COMMENT_COPY.sent };
  if (submission.kind === 'failed') {
    return { tone: 'error', text: COMMENT_REJECTION_COPY[submission.reason] };
  }
  return null;
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
              <li>
                <article app-comment-item [comment]="item"></article>
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
      @if (mainStatus(); as status) {
        <app-status-message #submissionStatus tabindex="-1" class="mt-4" [tone]="status.tone">{{
          status.text
        }}</app-status-message>
      }
    </div>
  `,
})
export class CommentThread {
  readonly content = input.required<CommentThreadContent>();
  readonly submission = input<CommentSubmissionState>({ kind: 'idle' });
  readonly resetToken = input(0);
  readonly submitted = output<CommentSent>();

  private readonly _status = viewChild('submissionStatus', { read: ElementRef<HTMLElement> });

  protected readonly copy = COMMENT_COPY;

  protected readonly mainStatus = computed(() => statusOf(this.submission(), null));
  protected readonly mainSending = computed(() => {
    const submission = this.submission();
    return submission.kind === 'sending' && submission.parentId === null;
  });

  // Après un envoi accepté, le focus va sur la confirmation ; un refus, en alerte, le laisse en place.
  private readonly focusConfirmation = afterRenderEffect({
    write: () => {
      if (this.submission().kind === 'sent') this._status()?.nativeElement.focus();
    },
  });

  protected readonly heading = computed(() => {
    const current = this.content();
    return current.status === 'ready' ? current.view.heading : COMMENT_COPY.heading;
  });
}
