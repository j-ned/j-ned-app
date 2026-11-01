import { NgOptimizedImage } from '@angular/common';
import {
  Component,
  ElementRef,
  afterRenderEffect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Button } from '@shared/ui/button';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { FileDropzone } from '@shared/ui/file-dropzone';

const PORTRAIT_TYPES = ['image/avif', 'image/webp', 'image/png', 'image/jpeg'];
// Certains systèmes ne donnent aucun type à un AVIF : l'extension décide, l'API reste juge.
const PORTRAIT_EXTENSIONS = /\.(avif|webp|png|jpe?g)$/i;

const isPortraitFile = (file: File): boolean =>
  file.type === '' ? PORTRAIT_EXTENSIONS.test(file.name) : PORTRAIT_TYPES.includes(file.type);
const DEFAULT_PORTRAIT_URL = '/avatar.avif';
const REMOVE_LABEL = 'Revenir au portrait par défaut';

@Component({
  selector: 'app-admin-profile-portrait',
  imports: [NgOptimizedImage, Button, ConfirmDialog, FileDropzone],
  host: { class: 'grid items-start gap-4.5 sm:grid-cols-[10rem_minmax(0,1fr)]' },
  template: `
    <div class="grid gap-2.5">
      <figure
        data-testid="admin-profile-portrait-current"
        class="relative aspect-[4/5] w-40 overflow-hidden rounded-md border border-line-strong bg-surface"
      >
        <img
          [ngSrc]="portraitUrl() ?? defaultPortraitUrl"
          alt="Portrait de Julien Nédellec"
          fill
          sizes="10rem"
          class="object-cover"
        />
      </figure>
      @if (portraitUrl() === null) {
        <p data-testid="admin-profile-portrait-default" class="field-hint">Portrait par défaut</p>
      }
    </div>
    <div class="grid gap-2.5">
      <app-file-dropzone
        data-testid="admin-profile-portrait-dropzone"
        accept="image/avif,image/webp,image/png,image/jpeg"
        label="Remplacer le portrait"
        helperText="AVIF, WebP, PNG ou JPEG, 5 Mo au plus"
        [resetToken]="resetToken()"
        (fileSelected)="select($event)"
      />
      @if (portraitUrl() !== null) {
        <button
          appButton
          type="button"
          variant="text-danger"
          data-testid="admin-profile-portrait-remove"
          class="justify-self-start"
          [disabled]="busy()"
          (click)="confirmingRemoval.set(true)"
        >
          {{ removeLabel }}
        </button>
      }
      <p data-testid="admin-profile-portrait-busy" role="status" class="field-hint empty:hidden">
        @if (busy()) {
          Envoi du portrait…
        }
      </p>
    </div>
    <!-- Rendu à la demande : la page ne garde qu'un dialogue de confirmation à la fois. -->
    @if (confirmingRemoval()) {
      <app-confirm-dialog
        [open]="true"
        heading="Revenir au portrait par défaut&#8239;?"
        [confirmLabel]="removeLabel"
        (confirmed)="confirmRemoval()"
        (cancelled)="confirmingRemoval.set(false)"
      >
        <p>Le site affiche de nouveau le portrait d'origine.</p>
      </app-confirm-dialog>
    }
  `,
})
export class AdminProfilePortrait {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly portraitUrl = input.required<string | null>();
  readonly busy = input(false);
  readonly portraitSelected = output<File>();
  readonly portraitRejected = output<void>();
  readonly removeConfirmed = output<void>();

  protected readonly defaultPortraitUrl = DEFAULT_PORTRAIT_URL;
  protected readonly removeLabel = REMOVE_LABEL;
  protected readonly confirmingRemoval = signal(false);
  // Le fichier part dès le dépôt : la zone est remise à zéro pour le dépôt suivant.
  protected readonly resetToken = signal(0);
  private removalPending = false;

  // Bouton désactivé pendant l'envoi : focus rendu à lui en cas d'échec, sinon à la zone de dépôt.
  private readonly focusAfterRemoval = afterRenderEffect({
    write: () => {
      const removed = this.portraitUrl() === null;
      const busy = this.busy();
      if (!this.removalPending || busy) return;
      this.removalPending = false;
      const target = removed
        ? '[data-testid="admin-profile-portrait-dropzone"] button'
        : '[data-testid="admin-profile-portrait-remove"]';
      this.host.nativeElement.querySelector<HTMLElement>(target)?.focus();
    },
  });

  protected select(file: File): void {
    if (isPortraitFile(file)) this.portraitSelected.emit(file);
    else this.portraitRejected.emit();
    this.resetToken.update((token) => token + 1);
  }

  protected confirmRemoval(): void {
    this.removalPending = true;
    this.confirmingRemoval.set(false);
    this.removeConfirmed.emit();
  }
}
