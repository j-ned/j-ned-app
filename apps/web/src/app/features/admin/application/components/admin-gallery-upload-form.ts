import {
  Component,
  ElementRef,
  effect,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { FormField, FormRoot, form } from '@angular/forms/signals';
import { FileDropzone } from '@shared/ui/file-dropzone';
import { Button } from '@shared/ui/button';
import { imageAltSchema } from './admin-image-alt-schema';

@Component({
  selector: 'app-admin-gallery-upload-form',
  imports: [FormRoot, FormField, FileDropzone, Button],
  host: { class: 'block', 'data-testid': 'admin-gallery-upload' },
  template: `
    <form [formRoot]="uploadForm" class="space-y-4">
      <div>
        <span class="field-label">Nouvelle capture</span>
        <!-- Un nouveau jeton recrée la zone de dépôt : c'est le seul moyen d'en vider l'aperçu. -->
        @for (token of [resetToken()]; track token) {
          <app-file-dropzone
            accept="image/avif,image/webp,image/png,image/jpeg"
            label="Image de la capture"
            helperText="AVIF, WebP, PNG ou JPEG, 5 Mo au plus"
            (fileSelected)="selectFile($event)"
            (cleared)="file.set(null)"
          />
        }
        @if (fileMissing()) {
          <p data-testid="admin-gallery-upload-file-error" role="alert" class="form-error">
            Choisissez une image
          </p>
        }
      </div>
      <div>
        @let alt = uploadForm.alt();
        <label for="gallery-upload-alt" class="field-label">Texte alternatif</label>
        <input
          #altInput
          id="gallery-upload-alt"
          data-testid="admin-gallery-upload-alt"
          type="text"
          [formField]="uploadForm.alt"
          aria-required="true"
          class="form-input"
        />
        @if (alt.touched() && alt.invalid()) {
          <p data-testid="admin-gallery-upload-alt-error" role="alert" class="form-error">
            {{ alt.errors()[0].message }}
          </p>
        }
      </div>
      <app-button type="submit" severity="primary" [disabled]="busy()">
        Ajouter la capture
      </app-button>
    </form>
  `,
})
export class AdminGalleryUploadForm {
  readonly busy = input(false);
  readonly resetToken = input(0);
  readonly uploadRequested = output<{ readonly file: File; readonly alt: string }>();

  private readonly altInput = viewChild.required<ElementRef<HTMLInputElement>>('altInput');

  protected readonly file = signal<File | null>(null);
  protected readonly fileMissing = signal(false);

  private readonly _model = signal({ alt: '' });

  protected readonly uploadForm = form(this._model, imageAltSchema, {
    submission: {
      action: async () => {
        const file = this.file();
        if (!file) {
          this.fileMissing.set(true);
          return;
        }
        this.uploadRequested.emit({ file, alt: this._model().alt.trim() });
      },
      onInvalid: () => this.fileMissing.set(this.file() === null),
    },
  });

  private readonly resetEffect = effect(() => {
    this.resetToken();
    untracked(() => {
      this.uploadForm().reset({ alt: '' });
      this.file.set(null);
      this.fileMissing.set(false);
    });
  });

  focusAlt(): void {
    this.altInput().nativeElement.focus();
  }

  protected selectFile(file: File): void {
    this.file.set(file);
    this.fileMissing.set(false);
  }
}
