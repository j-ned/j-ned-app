import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { AdminComment } from '@features/comments/domain/models/comment.model';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';
import { Stamp } from '@shared/ui/stamp';
import { toAdminCommentRow } from '../admin-comments-view';

@Component({
  selector: 'li[app-admin-comment-row]',
  imports: [RouterLink, AppIcon, Button, Stamp],
  host: { 'data-testid': 'admin-comment-row', class: 'block border-b border-line py-4' },
  template: `
    @let view = row();
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
      <p data-testid="comment-author" class="font-semibold">{{ view.author }}</p>
      @if (view.email) {
        <a
          data-testid="comment-email"
          [attr.href]="view.mailto"
          class="min-w-0 text-[0.8125rem] break-all text-muted underline underline-offset-3 hover:text-primary"
          >{{ view.email }}</a
        >
      }
      <app-stamp data-testid="comment-status" [dashed]="comment().status === 'pending'">{{
        view.status
      }}</app-stamp>
      <time
        data-testid="comment-date"
        [attr.datetime]="view.createdAt"
        class="font-mono text-xs text-muted tabular-nums"
        >{{ view.received }}</time
      >
    </div>
    <p class="mt-1 text-sm text-muted">
      Sur
      <a
        data-testid="comment-post"
        [routerLink]="view.postLink"
        class="text-primary underline-offset-3 hover:underline"
        >{{ view.postTitle }}</a
      >
    </p>
    @if (view.parent) {
      <p
        data-testid="comment-parent"
        class="mt-2 max-w-[70ch] border-l-2 border-line-strong pl-3 text-sm text-muted [overflow-wrap:anywhere]"
      >
        {{ view.parent }}
      </p>
    }
    <p
      data-testid="comment-body"
      class="mt-2 max-w-[70ch] whitespace-pre-line [overflow-wrap:anywhere]"
    >
      {{ comment().body }}
    </p>
    @if (view.replies) {
      <p data-testid="comment-replies" class="mt-1 font-mono text-xs text-muted">
        {{ view.replies }}
      </p>
    }
    <div class="mt-3 flex flex-wrap items-center gap-2">
      @if (view.publishLabel) {
        <button
          appButton
          type="button"
          variant="outlined"
          data-testid="comment-publish"
          [attr.aria-label]="view.publishLabel"
          (click)="publishRequested.emit()"
        >
          <app-icon name="check" [size]="16" />
          Publier
        </button>
      }
    </div>
  `,
})
export class AdminCommentRow {
  readonly comment = input.required<AdminComment>();
  readonly publishRequested = output<void>();

  private readonly _now = new Date();

  protected readonly row = computed(() => toAdminCommentRow(this.comment(), this._now));
}
