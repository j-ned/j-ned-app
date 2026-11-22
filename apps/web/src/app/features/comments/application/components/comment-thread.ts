import { Component, computed, input } from '@angular/core';
import { COMMENT_COPY } from '../comment-copy';
import type { CommentThreadContent } from '../comment-thread-view';
import { CommentItem } from './comment-item';

@Component({
  selector: 'section[app-comment-thread]',
  imports: [CommentItem],
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
  `,
})
export class CommentThread {
  readonly content = input.required<CommentThreadContent>();

  protected readonly copy = COMMENT_COPY;

  protected readonly heading = computed(() => {
    const current = this.content();
    return current.status === 'ready' ? current.view.heading : COMMENT_COPY.heading;
  });
}
