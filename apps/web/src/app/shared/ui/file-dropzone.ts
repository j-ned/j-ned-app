import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  Injector,
  input,
  linkedSignal,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { formatFileSize } from './format-file-size';

@Component({
  selector: 'app-file-dropzone',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <input
      #input
      type="file"
      [accept]="accept()"
      tabindex="-1"
      aria-hidden="true"
      class="sr-only"
      (change)="onInputChange($event)"
    />

    @if (currentFile() || previewUrl()) {
      <div
        class="relative bg-surface border border-foreground/10 rounded-xl p-4 flex items-center gap-4"
      >
        @if (isImage()) {
          <img
            [src]="previewSrc()"
            [alt]="currentFile()?.name ?? 'Aperçu'"
            class="w-20 h-20 rounded-lg object-cover border border-foreground/10"
          />
        } @else {
          <div
            class="w-20 h-20 rounded-lg bg-foreground/5 border border-foreground/10 flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              class="text-muted"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
        }
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-foreground truncate">
            {{ currentFile()?.name ?? 'Fichier actuel' }}
          </p>
          @if (currentFileSize(); as size) {
            <p data-testid="file-dropzone-size" class="text-xs text-muted">{{ size }}</p>
          }
        </div>
        <div class="flex items-center gap-2">
          <button
            #replace
            type="button"
            data-testid="file-dropzone-replace"
            (click)="openPicker()"
            class="inline-flex min-h-11 items-center px-2 text-sm text-primary hover:underline focus-visible:outline-none focus-visible:underline"
          >
            Remplacer
          </button>
          <button
            type="button"
            data-testid="file-dropzone-clear"
            (click)="clear()"
            aria-label="Retirer le fichier"
            class="w-11 h-11 rounded-full bg-foreground/5 hover:bg-status-error/15 hover:text-status-error text-muted flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    } @else {
      <button
        #trigger
        type="button"
        data-testid="file-dropzone-trigger"
        (click)="openPicker()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        class="block w-full border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
               flex flex-col items-center justify-center gap-2"
        [class]="
          isDragging()
            ? 'border-primary bg-primary/5'
            : 'border-foreground/15 bg-surface hover:border-foreground/30 hover:bg-surface-elevated'
        "
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          class="text-muted"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p class="text-sm font-medium text-foreground">
          {{ label() }}
        </p>
        <p class="text-xs text-muted">Glisse un fichier ici ou clique pour parcourir</p>
        @if (helperText()) {
          <p class="text-xs text-muted/80">{{ helperText() }}</p>
        }
      </button>
    }
  `,
  imports: [],
})
export class FileDropzone {
  readonly accept = input<string>('*/*');
  readonly label = input<string>('Choisir un fichier');
  readonly helperText = input<string>('');
  readonly previewUrl = input<string>('');
  readonly resetToken = input<number>();

  readonly fileSelected = output<File>();
  readonly cleared = output<void>();

  protected readonly currentFile = linkedSignal<number | undefined, File | null>({
    source: this.resetToken,
    computation: () => null,
  });
  protected readonly isDragging = signal(false);

  private readonly _blobUrl = signal<string>('');
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _injector = inject(Injector);

  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('input');
  private readonly replaceButton = viewChild<ElementRef<HTMLButtonElement>>('replace');
  private readonly triggerButton = viewChild<ElementRef<HTMLButtonElement>>('trigger');

  protected readonly isImage = computed(() => {
    const f = this.currentFile();
    if (f) return f.type.startsWith('image/');
    return !!this.previewUrl();
  });

  protected readonly previewSrc = computed(() => this._blobUrl() || this.previewUrl());
  protected readonly currentFileSize = computed(() => {
    const file = this.currentFile();
    return file ? formatFileSize(file.size) : '';
  });

  constructor() {
    // Effect légitime : gère un blob URL, ressource externe hors état applicatif.
    effect(() => {
      const f = this.currentFile();
      const previous = untracked(() => this._blobUrl());
      if (previous) URL.revokeObjectURL(previous);
      if (f && f.type.startsWith('image/')) {
        this._blobUrl.set(URL.createObjectURL(f));
      } else {
        this._blobUrl.set('');
      }
    });

    this._destroyRef.onDestroy(() => {
      const url = this._blobUrl();
      if (url) URL.revokeObjectURL(url);
    });
  }

  protected onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    // Sans remise à blanc, choisir à nouveau le même fichier après une remise à zéro ne déclenche pas `change`.
    input.value = '';
    this.handleFile(file);
    // Un parent qui refuse le fichier remet aussitôt la zone à zéro : « Remplacer » n'existe pas.
    this.focusAfterRender(() => this.replaceButton() ?? this.triggerButton());
  }

  protected openPicker(): void {
    this.fileInput().nativeElement.click();
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.handleFile(file);
  }

  protected clear(): void {
    this.currentFile.set(null);
    this.cleared.emit();
    this.focusAfterRender(this.triggerButton);
  }

  // Le bouton qui avait le focus disparaît avec le changement d'état : sans relais, le focus tombe sur `body`.
  private focusAfterRender(target: () => ElementRef<HTMLButtonElement> | undefined): void {
    afterNextRender({ write: () => target()?.nativeElement.focus() }, { injector: this._injector });
  }

  private handleFile(file: File): void {
    this.currentFile.set(file);
    this.fileSelected.emit(file);
  }
}
