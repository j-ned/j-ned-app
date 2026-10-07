import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormField, form, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { BlogGateway } from '@features/blog/domain/gateways/blog.gateway';
import { FileDropzone } from '@shared/ui/file-dropzone';
import { imageAltSchema } from './admin-image-alt-schema';

const UPLOAD_ERRORS: Readonly<Record<number, string>> = {
  413: "L'image dépasse 5\u00a0Mo.",
  422: 'Image refusée\u00a0: format non pris en charge ou fichier illisible.',
};

const uploadErrorDetail = (error: unknown): string =>
  (error instanceof HttpErrorResponse && UPLOAD_ERRORS[error.status]) ||
  "L'image n'a pas pu être envoyée. Réessayez.";

// Vit dans le formulaire de l'article : pas de <form> imbriqué, Entrée ne doit pas l'enregistrer.
@Component({
  selector: 'app-admin-content-image-upload',
  imports: [FormField, FileDropzone],
  host: {
    role: 'group',
    '[attr.aria-labelledby]': 'titleId()',
    'data-testid': 'markdown-image-panel',
    class: 'mb-2 grid grid-cols-1 gap-4 rounded-md border border-line bg-surface p-4',
    '(keydown.escape)': 'cancel($event)',
  },
  template: `
    <p [id]="titleId()" class="field-label">Insérer une image</p>
    <div>
      <app-file-dropzone
        accept="image/avif,image/webp,image/png,image/jpeg"
        label="Image à insérer"
        helperText="AVIF, WebP, PNG ou JPEG, 5&nbsp;Mo au plus"
        (fileSelected)="selectFile($event)"
        (cleared)="file.set(null)"
      />
      @if (fileMissing()) {
        <p data-testid="markdown-image-file-error" role="alert" class="form-error">
          Choisissez une image
        </p>
      }
    </div>
    <div>
      @let alt = altForm.alt();
      @let altInError = alt.touched() && alt.invalid();
      <label [for]="altId()" class="field-label">Texte alternatif</label>
      <input
        [id]="altId()"
        data-testid="markdown-image-alt"
        type="text"
        [formField]="altForm.alt"
        aria-required="true"
        [attr.aria-invalid]="altInError"
        [attr.aria-describedby]="altInError ? altErrorId() : null"
        class="form-input"
        (keydown.enter)="send($event)"
      />
      @if (altInError) {
        <p
          [id]="altErrorId()"
          data-testid="markdown-image-alt-error"
          role="alert"
          class="form-error"
        >
          {{ alt.errors()[0].message }}
        </p>
      }
    </div>
    @if (error(); as message) {
      <p data-testid="markdown-image-error" role="alert" class="form-error">{{ message }}</p>
    }
    <div class="flex flex-wrap gap-2.5">
      <button
        type="button"
        data-testid="markdown-image-submit"
        [attr.aria-disabled]="altForm().submitting()"
        class="link-btn-primary cursor-pointer aria-disabled:cursor-wait aria-disabled:opacity-60"
        (click)="send()"
      >
        Insérer l'image
      </button>
      <button
        type="button"
        data-testid="markdown-image-cancel"
        class="link-btn-outline cursor-pointer"
        (click)="cancelled.emit()"
      >
        Annuler
      </button>
    </div>
  `,
})
export class AdminContentImageUpload {
  private readonly _gateway = inject(BlogGateway);
  private readonly _host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  // Préfixe des id internes ; l'hôte ne lie pas son propre id, qui écraserait celui que pose TestBed sur sa racine.
  readonly id = input('markdown-image');
  readonly inserted = output<{ readonly alt: string; readonly url: string }>();
  readonly cancelled = output<void>();

  protected readonly titleId = computed(() => `${this.id()}-title`);
  protected readonly altId = computed(() => `${this.id()}-alt`);
  protected readonly altErrorId = computed(() => `${this.id()}-alt-error`);
  protected readonly file = signal<File | null>(null);
  protected readonly fileMissing = signal(false);
  protected readonly error = signal('');

  private readonly _model = signal({ alt: '' });

  protected readonly altForm = form(this._model, imageAltSchema, {
    submission: {
      action: async () => {
        const file = this.file();
        if (!file) {
          this.fileMissing.set(true);
          return;
        }
        this.error.set('');
        try {
          const image = await firstValueFrom(this._gateway.uploadContentImage(file));
          this.inserted.emit({ alt: this._model().alt.trim(), url: image.url });
        } catch (error) {
          this.error.set(uploadErrorDetail(error));
        }
      },
      onInvalid: () => this.fileMissing.set(this.file() === null),
    },
  });

  constructor() {
    afterNextRender({ write: () => this._host.querySelector('button')?.focus() });
  }

  protected send(event?: Event): void {
    event?.preventDefault();
    void submit(this.altForm);
  }

  protected cancel(event: Event): void {
    event.preventDefault();
    this.cancelled.emit();
  }

  protected selectFile(file: File): void {
    this.file.set(file);
    this.fileMissing.set(false);
  }
}
