import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';

/**
 * Drag & drop file picker avec preview, accessible clavier (Enter/Espace).
 * - Clique sur la zone → ouvre le file picker natif
 * - Drag a file from desktop → highlight + dépose
 * - Preview image si type image, sinon nom de fichier
 * - Bouton X pour clear la sélection
 */
@Component({
  selector: 'app-file-dropzone',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <input
      #input
      type="file"
      [accept]="accept()"
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
          @if (currentFile(); as f) {
            <p class="text-xs text-muted">{{ formatSize(f.size) }}</p>
          }
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="openPicker()"
            class="text-xs text-primary hover:underline focus-visible:outline-none focus-visible:underline"
          >
            Remplacer
          </button>
          <button
            type="button"
            (click)="clear()"
            aria-label="Retirer le fichier"
            class="w-7 h-7 rounded-full bg-foreground/5 hover:bg-red-500/15 hover:text-red-400 text-muted flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
      <div
        role="button"
        tabindex="0"
        [attr.aria-label]="label()"
        (click)="openPicker()"
        (keydown.enter)="openPicker()"
        (keydown.space)="onKeySpace($event)"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        class="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
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
      </div>
    }
  `,
  imports: [],
})
export class FileDropzone {
  readonly accept = input<string>('*/*');
  readonly label = input<string>('Choisir un fichier');
  readonly helperText = input<string>('');
  readonly previewUrl = input<string>('');

  readonly fileSelected = output<File>();
  readonly cleared = output<void>();

  protected readonly currentFile = signal<File | null>(null);
  protected readonly isDragging = signal(false);

  private readonly _blobUrl = signal<string>('');
  private readonly _destroyRef = inject(DestroyRef);

  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('input');

  protected readonly isImage = computed(() => {
    const f = this.currentFile();
    if (f) return f.type.startsWith('image/');
    return !!this.previewUrl();
  });

  protected readonly previewSrc = computed(() => this._blobUrl() || this.previewUrl());

  constructor() {
    // Genere/revoque le blob URL quand currentFile change. Pur effect = side-effect
    // sur ressource externe (URL.createObjectURL alloue, URL.revokeObjectURL libere).
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
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.handleFile(file);
  }

  protected openPicker(): void {
    this.fileInput().nativeElement.click();
  }

  protected onKeySpace(event: Event): void {
    event.preventDefault();
    this.openPicker();
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
    this.fileInput().nativeElement.value = '';
    this.cleared.emit();
  }

  protected formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }

  private handleFile(file: File): void {
    this.currentFile.set(file);
    this.fileSelected.emit(file);
  }
}
