import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import type { CommentView } from '../comment-thread-view';

// Nom et texte viennent d'un inconnu : interpolation seule, jamais de HTML ni de lien fabriqué.
@Component({
  selector: 'article[app-comment-item]',
  imports: [DatePipe],
  host: {
    'data-testid': 'comment-item',
    '[attr.aria-labelledby]': 'comment().headingId',
    class: 'block',
  },
  template: `
    @let c = comment();
    <header class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      @if (level() === 'reply') {
        <h4 [id]="c.headingId" class="text-[0.9375rem] font-semibold">
          <span [textContent]="c.author"></span>
          @if (c.ownerMention) {
            <span class="font-normal text-muted" [textContent]="', ' + c.ownerMention"></span>
          }
        </h4>
      } @else {
        <h3 [id]="c.headingId" class="text-base font-semibold">
          <span [textContent]="c.author"></span>
          @if (c.ownerMention) {
            <span class="font-normal text-muted" [textContent]="', ' + c.ownerMention"></span>
          }
        </h3>
      }
      <time [attr.datetime]="c.createdAt" class="font-mono text-[0.8125rem] text-muted">{{
        c.createdAt | date: 'd MMMM y'
      }}</time>
    </header>
    <p
      data-testid="comment-body"
      class="mt-2 whitespace-pre-line text-foreground/85 [overflow-wrap:anywhere]"
      [textContent]="c.body"
    ></p>
  `,
})
export class CommentItem {
  readonly comment = input.required<CommentView>();
  readonly level = input<'comment' | 'reply'>('comment');
}
