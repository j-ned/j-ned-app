import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, ElementRef, computed, input, output, viewChild } from '@angular/core';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';
import { Stamp } from '@shared/ui/stamp';
import { COMMENT_COPY } from '../comment-copy';
import type { CommentView } from '../comment-thread-view';

// Nom et texte viennent d'un inconnu : interpolation seule, jamais de HTML ni de lien fabriqué.
@Component({
  selector: 'article[app-comment-item]',
  imports: [AppIcon, Button, DatePipe, NgTemplateOutlet, Stamp],
  host: {
    'data-testid': 'comment-item',
    '[attr.aria-labelledby]': 'labelledBy()',
    class: 'block',
  },
  template: `
    @let c = comment();
    <!-- Seul le niveau du titre change entre un commentaire et une réponse. -->
    <ng-template #author>
      <span [textContent]="c.author"></span>
      @if (c.ownerMention) {
        <span
          data-testid="comment-owner-badge"
          class="ml-2 inline-block rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 align-middle text-xs font-semibold text-primary first-letter:uppercase"
          [textContent]="c.ownerMention"
        ></span>
      }
    </ng-template>
    <header class="flex items-center gap-3">
      <span
        aria-hidden="true"
        class="grid shrink-0 place-items-center rounded-full font-display font-bold"
        [class]="avatarClass()"
        [textContent]="c.initial"
      ></span>
      <div class="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div class="flex min-w-0 flex-wrap items-center gap-2">
          @if (level() === 'reply') {
            <h4
              [id]="c.headingId"
              class="text-[0.9375rem] font-semibold [overflow-wrap:anywhere]"
              [attr.aria-label]="headingLabel()"
            >
              <ng-container [ngTemplateOutlet]="author" />
            </h4>
          } @else {
            <h3
              [id]="c.headingId"
              class="text-base font-semibold [overflow-wrap:anywhere]"
              [attr.aria-label]="headingLabel()"
            >
              <ng-container [ngTemplateOutlet]="author" />
            </h3>
          }
          @if (c.pending) {
            <app-stamp [id]="pendingId()" [dashed]="true" data-testid="comment-pending">{{
              copy.pending
            }}</app-stamp>
          }
        </div>
        <time
          [attr.datetime]="c.createdAt"
          class="font-mono text-xs tabular-nums whitespace-nowrap text-muted"
          >{{ c.createdAt | date: 'd MMMM y' }}</time
        >
      </div>
    </header>
    <p
      data-testid="comment-body"
      class="mt-3 whitespace-pre-line leading-relaxed text-foreground [overflow-wrap:anywhere]"
      [class]="textIndent()"
      [textContent]="c.body"
    ></p>
    @if (replyable()) {
      <div [class]="textIndent()">
        <button
          #replyButton
          appButton
          variant="text-muted"
          type="button"
          data-testid="comment-reply"
          class="-ml-3 mt-1"
          [attr.aria-label]="'Répondre à ' + c.author"
          [attr.aria-expanded]="replyOpen()"
          [attr.aria-controls]="replyOpen() ? replyFormId() : null"
          (click)="replyRequested.emit()"
        >
          <app-icon name="comment" [size]="16" />
          Répondre
        </button>
      </div>
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

  protected readonly copy = COMMENT_COPY;

  // Nommé en toutes lettres : Chromium insère des espaces autour du badge en bloc en ligne.
  protected readonly headingLabel = computed(() => {
    const { author, ownerMention } = this.comment();
    return ownerMention ? `${author}, ${ownerMention}` : null;
  });

  protected readonly pendingId = computed(() => `comment-${this.comment().id}-pending`);

  // Un envoi en attente se nomme aussi par son état : « Lou En attente de relecture ».
  protected readonly labelledBy = computed(() => {
    const { headingId, pending } = this.comment();
    return pending ? `${headingId} ${this.pendingId()}` : headingId;
  });

  // Sous la pastille sur mobile, aligné sur le nom au-delà.
  protected readonly textIndent = computed(() =>
    this.level() === 'reply' ? 'sm:pl-11' : 'sm:pl-12',
  );

  // La pastille de l'auteur du site prend l'aplat orange, celle d'un lecteur reste neutre.
  protected readonly avatarClass = computed(() => {
    const size = this.level() === 'reply' ? 'size-8 text-sm' : 'size-9 text-base';
    const tone = this.comment().ownerMention
      ? 'bg-primary-bg text-on-primary'
      : 'bg-foreground/8 text-foreground';
    return `${size} ${tone}`;
  });

  // Rendu du focus au bouton quand le formulaire de réponse se ferme sans envoi.
  focusReplyButton(): void {
    this._replyButton()?.nativeElement.focus();
  }
}
