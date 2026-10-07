import { Component, ElementRef, afterRenderEffect, input, output, viewChild } from '@angular/core';
import { Button } from './button';

let nextDialogId = 0;

@Component({
  selector: 'app-confirm-dialog',
  imports: [Button],
  template: `
    <dialog
      #dialog
      data-testid="confirm-dialog"
      [attr.aria-labelledby]="headingId"
      [attr.aria-describedby]="descriptionId"
      class="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-line-strong bg-background p-6 text-foreground shadow-xl backdrop:bg-black/60"
      (cancel)="dismiss($event)"
    >
      <h2
        [id]="headingId"
        data-testid="confirm-dialog-heading"
        class="text-lg font-bold text-foreground"
      >
        {{ heading() }}
      </h2>
      <div [id]="descriptionId" class="mt-3 text-sm text-muted">
        <ng-content />
      </div>
      <div class="mt-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          autofocus
          data-testid="confirm-dialog-cancel"
          class="inline-flex min-h-11 items-center justify-center rounded-md border border-foreground/15 bg-foreground/10 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/15"
          (click)="dismiss()"
        >
          {{ cancelLabel() }}
        </button>
        <app-button severity="danger" data-testid="confirm-dialog-confirm" (click)="confirm()">
          {{ confirmLabel() }}
        </app-button>
      </div>
    </dialog>
  `,
})
export class ConfirmDialog {
  readonly open = input.required<boolean>();
  readonly heading = input.required<string>();
  readonly confirmLabel = input.required<string>();
  readonly cancelLabel = input('Annuler');
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  private readonly _dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  private readonly _instance = nextDialogId++;
  protected readonly headingId = `confirm-dialog-heading-${this._instance}`;
  protected readonly descriptionId = `confirm-dialog-description-${this._instance}`;

  private readonly _syncOpenState = afterRenderEffect({
    write: () => {
      const dialog = this._dialog().nativeElement;
      if (this.open() && !dialog.open) dialog.showModal();
      else if (!this.open() && dialog.open) dialog.close();
    },
  });

  // Fermé avant d'émettre : tant que le modal est ouvert, le reste de la page est inerte et le
  // parent ne pourrait pas y déplacer le focus.
  protected confirm(): void {
    this._dialog().nativeElement.close();
    this.confirmed.emit();
  }

  protected dismiss(event?: Event): void {
    event?.preventDefault();
    this._dialog().nativeElement.close();
    this.cancelled.emit();
  }
}
