import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-file-drop-zone',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div
      role="button"
      tabindex="0"
      [attr.aria-label]="dropLabel()"
      (drop)="onDrop($event)"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (click)="fileInput.click()"
      (keydown.enter)="fileInput.click()"
      (keydown.space)="fileInput.click()"
      [class]="
        'relative flex flex-col items-center justify-center w-full min-h-40 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ' +
        (isDragging()
          ? 'border-primary bg-primary/10 scale-[1.01]'
          : 'border-foreground/20 bg-foreground/[0.03] hover:border-primary/40 hover:bg-foreground/[0.06]')
      "
    >
      @if (preview()) {
        <div class="relative w-full group">
          @if (previewType() === 'image') {
            <img
              [src]="preview()"
              [alt]="previewAlt()"
              class="w-full max-h-56 object-contain rounded-xl p-2"
            />
            <div
              class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-200"
            >
              <div class="flex flex-col items-center gap-1">
                <svg
                  class="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                  />
                </svg>
                <span class="text-white text-sm font-medium">{{ changeLabel() }}</span>
              </div>
            </div>
          } @else {
            <div class="flex flex-col items-center py-8 text-foreground">
              <svg class="w-10 h-10 mb-3 text-primary" aria-hidden="true">
                <use href="/icons/sprite.svg#lucide-file-text" />
              </svg>
              <p class="text-sm font-medium">{{ preview() }}</p>
              @if (previewDetail()) {
                <p class="text-xs text-muted mt-1">{{ previewDetail() }}</p>
              }
            </div>
          }
        </div>
      } @else {
        <div class="flex flex-col items-center py-10 text-muted">
          <div
            class="w-14 h-14 mb-4 rounded-xl bg-foreground/[0.06] flex items-center justify-center"
          >
            <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
          </div>
          <p class="text-sm font-medium text-foreground">{{ dropLabel() }}</p>
          <p class="text-xs mt-1.5 text-muted/70">ou cliquez pour parcourir</p>
        </div>
      }
    </div>
    <input
      #fileInput
      type="file"
      [accept]="accept()"
      (change)="onFileSelected($event)"
      class="hidden"
    />
  `,
})
export class FileDropZone {
  readonly accept = input('image/*');
  readonly dropLabel = input('Glissez une image ici');
  readonly changeLabel = input("Changer l'image");
  readonly previewAlt = input('Aperçu');
  readonly preview = input('');
  readonly previewType = input<'image' | 'file'>('image');
  readonly previewDetail = input('');

  readonly fileSelected = output<File>();

  protected readonly isDragging = signal(false);

  protected onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.fileSelected.emit(file);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.fileSelected.emit(file);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }
}
