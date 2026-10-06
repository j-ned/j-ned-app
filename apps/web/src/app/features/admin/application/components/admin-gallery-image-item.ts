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
import { Button } from '@shared/ui/button';
import { galleryAltSchema } from './admin-gallery-alt-schema';

const focusButton = (ref: ElementRef<HTMLElement> | undefined): void =>
  ref?.nativeElement.querySelector('button')?.focus();

@Component({
  selector: 'app-admin-gallery-image-item',
  imports: [NgOptimizedImage, FormRoot, FormField, Button],
  host: {
    class: 'flex flex-col gap-4 sm:flex-row sm:items-start',
    'data-testid': 'admin-gallery-item',
  },
  template: `
    <img
      data-testid="admin-gallery-item-thumb"
      [ngSrc]="image().src"
      [alt]="image().alt"
      [width]="image().width"
      [height]="image().height"
      class="w-32 h-auto shrink-0 rounded-lg border border-line"
    />
    <div class="flex-1 min-w-0 space-y-3">
      <form [formRoot]="altForm">
        @let alt = altForm.alt();
        <label [attr.for]="altFieldId()" class="form-label">
          Texte alternatif de la capture {{ rank() }}
        </label>
        <div class="flex flex-col gap-2 sm:flex-row">
          <input
            [id]="altFieldId()"
            data-testid="admin-gallery-item-alt"
            type="text"
            [formField]="altForm.alt"
            aria-required="true"
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
        @if (alt.touched() && alt.invalid()) {
          <p data-testid="admin-gallery-item-alt-error" role="alert" class="form-error">
            {{ alt.errors()[0].message }}
          </p>
        }
      </form>
      <div class="flex flex-wrap gap-2">
        @if (rank() > 1) {
          <app-button
            #up
            data-testid="admin-gallery-item-up"
            severity="secondary"
            variant="outlined"
            [ariaLabel]="'Monter la capture ' + rank()"
            [disabled]="busy()"
            (click)="moveRequested.emit(-1)"
          >
            Monter
          </app-button>
        }
        @if (rank() < total()) {
          <app-button
            #down
            data-testid="admin-gallery-item-down"
            severity="secondary"
            variant="outlined"
            [ariaLabel]="'Descendre la capture ' + rank()"
            [disabled]="busy()"
            (click)="moveRequested.emit(1)"
          >
            Descendre
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
            variant="outlined"
            [ariaLabel]="'Supprimer la capture ' + rank()"
            (click)="askRemoval()"
          >
            Supprimer
          </app-button>
        }
      </div>
    </div>
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
  protected readonly confirmingRemoval = signal(false);

  private readonly _model = linkedSignal(() => ({ alt: this.image().alt }));

  protected readonly altForm = form(this._model, galleryAltSchema, {
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
