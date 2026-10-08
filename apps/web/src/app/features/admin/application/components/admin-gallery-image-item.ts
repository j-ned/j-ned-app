import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
  type Signal,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FormField, FormRoot, form } from '@angular/forms/signals';
import type { ProjectImage } from '@features/projects/domain/models/project.model';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';
import { FieldError } from '@shared/ui/field-error';
import { imageAltSchema } from './admin-image-alt-schema';

const focusButton = (ref: ElementRef<HTMLElement> | undefined): void =>
  ref?.nativeElement.querySelector('button')?.focus();

@Component({
  selector: 'app-admin-gallery-image-item',
  imports: [NgOptimizedImage, FormRoot, FormField, Button, AppIcon, FieldError],
  host: {
    class: 'block',
    'data-testid': 'admin-gallery-item',
  },
  template: `
    <form [formRoot]="altForm" class="grid content-start gap-2">
      <img
        data-testid="admin-gallery-item-thumb"
        [ngSrc]="image().src"
        [alt]="image().alt"
        [width]="image().width"
        [height]="image().height"
        class="aspect-[16/10] h-auto w-full rounded-md border border-line-strong bg-surface object-cover"
      />
      @let altInError = altForm.alt().touched() && altForm.alt().invalid();
      <label [attr.for]="altFieldId()" class="field-label">
        Texte alternatif de la capture {{ rank() }}
      </label>
      <div class="grid gap-2">
        <input
          [id]="altFieldId()"
          data-testid="admin-gallery-item-alt"
          type="text"
          [formField]="altForm.alt"
          aria-required="true"
          [attr.aria-invalid]="altInError"
          [attr.aria-describedby]="altInError ? altErrorId() : null"
          class="form-input"
        />
        <app-button
          type="submit"
          severity="secondary"
          variant="outlined"
          [ariaLabel]="'Enregistrer le texte alternatif de la capture ' + rank()"
        >
          Enregistrer
        </app-button>
      </div>
      <app-field-error
        [field]="altForm.alt"
        [errorId]="altErrorId()"
        testId="admin-gallery-item-alt-error"
      />
      <div class="flex flex-wrap items-center justify-between gap-1">
        <span
          data-testid="admin-gallery-item-position"
          class="font-mono text-xs text-muted tabular-nums"
          >{{ rank() }} / {{ total() }}</span
        >
        <div class="flex flex-wrap justify-end">
          @if (rank() > 1) {
            <app-button
              #up
              data-testid="admin-gallery-item-up"
              severity="secondary"
              variant="text"
              size="icon"
              [ariaLabel]="'Monter la capture ' + rank()"
              [disabled]="busy()"
              (click)="moveRequested.emit(-1)"
            >
              <app-icon name="arrow-up" [size]="16" />
            </app-button>
          }
          @if (rank() < total()) {
            <app-button
              #down
              data-testid="admin-gallery-item-down"
              severity="secondary"
              variant="text"
              size="icon"
              [ariaLabel]="'Descendre la capture ' + rank()"
              [disabled]="busy()"
              (click)="moveRequested.emit(1)"
            >
              <app-icon name="arrow-down" [size]="16" />
            </app-button>
          }
          @if (confirmingRemoval()) {
            <app-button
              #confirm
              data-testid="admin-gallery-item-confirm-remove"
              severity="danger"
              variant="outlined"
              [ariaLabel]="'Confirmer la suppression de la capture ' + rank()"
              [disabled]="busy()"
              (click)="removeRequested.emit()"
            >
              Confirmer
            </app-button>
            <app-button
              data-testid="admin-gallery-item-cancel-remove"
              severity="secondary"
              variant="outlined"
              (click)="cancelRemoval()"
            >
              Annuler
            </app-button>
          } @else {
            <app-button
              #remove
              data-testid="admin-gallery-item-remove"
              severity="danger"
              variant="text"
              size="icon"
              [ariaLabel]="'Supprimer la capture ' + rank()"
              (click)="askRemoval()"
            >
              <app-icon name="trash" [size]="16" />
            </app-button>
          }
        </div>
      </div>
    </form>
  `,
})
export class AdminGalleryImageItem {
  private readonly injector = inject(Injector);

  readonly image = input.required<ProjectImage>();
  readonly rank = input.required<number>();
  readonly total = input.required<number>();
  readonly busy = input(false);
  readonly altSaved = output<string>();
  readonly moveRequested = output<-1 | 1>();
  readonly removeRequested = output<void>();

  private readonly upButton = viewChild('up', { read: ElementRef<HTMLElement> });
  private readonly downButton = viewChild('down', { read: ElementRef<HTMLElement> });
  private readonly confirmButton = viewChild('confirm', { read: ElementRef<HTMLElement> });
  private readonly removeButton = viewChild('remove', { read: ElementRef<HTMLElement> });

  protected readonly altFieldId = computed(() => `gallery-alt-${this.image().id}`);
  protected readonly altErrorId = computed(() => `${this.altFieldId()}-error`);
  protected readonly confirmingRemoval = signal(false);

  private readonly _model = linkedSignal(() => ({ alt: this.image().alt }));

  protected readonly altForm = form(this._model, imageAltSchema, {
    submission: {
      action: async () => this.altSaved.emit(this._model().alt.trim()),
    },
  });

  focusMoveButton(delta: -1 | 1): void {
    const [same, opposite] =
      delta < 0 ? [this.upButton(), this.downButton()] : [this.downButton(), this.upButton()];
    focusButton(same ?? opposite);
  }

  focusRemoveButton(): void {
    focusButton(this.removeButton());
  }

  focusConfirmButton(): void {
    focusButton(this.confirmButton());
  }

  protected askRemoval(): void {
    this.confirmingRemoval.set(true);
    this.focusAfterRender(this.confirmButton);
  }

  protected cancelRemoval(): void {
    this.confirmingRemoval.set(false);
    this.focusAfterRender(this.removeButton);
  }

  private focusAfterRender(button: Signal<ElementRef<HTMLElement> | undefined>): void {
    afterNextRender({ write: () => focusButton(button()) }, { injector: this.injector });
  }
}
