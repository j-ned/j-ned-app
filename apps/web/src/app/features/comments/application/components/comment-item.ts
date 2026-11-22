import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, ElementRef, input, output, viewChild } from '@angular/core';
import { Button } from '@shared/ui/button';
import type { CommentView } from '../comment-thread-view';

// Nom et texte viennent d'un inconnu : interpolation seule, jamais de HTML ni de lien fabriqué.
@Component({
  selector: 'article[app-comment-item]',
  imports: [DatePipe, NgTemplateOutlet, Button],
  host: {
    'data-testid': 'comment-item',
    '[attr.aria-labelledby]': 'comment().headingId',
    class: 'block',
  },
  template: `
    @let c = comment();
    <!-- Seul le niveau du titre change entre un commentaire et une réponse. -->
    <ng-template #author>
      <span [textContent]="c.author"></span>
      @if (c.ownerMention) {
        <span class="font-normal text-muted" [textContent]="', ' + c.ownerMention"></span>
      }
    </ng-template>
    <header class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      @if (level() === 'reply') {
        <h4 [id]="c.headingId" class="text-[0.9375rem] font-semibold">
          <ng-container [ngTemplateOutlet]="author" />
        </h4>
      } @else {
        <h3 [id]="c.headingId" class="text-base font-semibold">
          <ng-container [ngTemplateOutlet]="author" />
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
    @if (replyable()) {
      <button
        #replyButton
        appButton
        variant="text"
        type="button"
        data-testid="comment-reply"
        class="-ml-5 mt-1"
        [attr.aria-label]="'Répondre à ' + c.author"
        [attr.aria-expanded]="replyOpen()"
        [attr.aria-controls]="replyOpen() ? replyFormId() : null"
        (click)="replyRequested.emit()"
      >
        Répondre
      </button>
    }
  `,
})
export class CommentItem {
  readonly comment = input.required<CommentView>();
  readonly level = input<'comment' | 'reply'>('comment');
  readonly replyable = input(false);
  readonly replyOpen = input(false);
  readonly replyFormId = input<string | null>(null);
  readonly replyRequested = output<void>();

  private readonly _replyButton = viewChild('replyButton', { read: ElementRef<HTMLButtonElement> });

  // Rendu du focus au bouton quand le formulaire de réponse se ferme sans envoi.
  focusReplyButton(): void {
    this._replyButton()?.nativeElement.focus();
  }
}
