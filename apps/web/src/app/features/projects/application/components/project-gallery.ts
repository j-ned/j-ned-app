import {
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import type { ProjectImage } from '@features/projects/domain/models/project.model';
import { SplitSection } from '@shared/ui/split-section';

const SUMMARY = 'Les écrans du projet, en situation.';
const NBSP = '\u00a0';
const ENLARGE_LABEL = `Agrandir${NBSP}:`;
const DIALOG_LABEL_PREFIX = `Capture agrandie${NBSP}: `;

@Component({
  selector: 'app-project-gallery',
  imports: [NgOptimizedImage, SplitSection],
  host: { class: 'block border-t border-foreground/8', 'data-testid': 'project-gallery' },
  template: `
    <app-split-section headingId="gallery-title" heading="Captures" [summary]="summary">
      <ul class="grid items-start gap-6 md:grid-cols-2" role="list">
        @for (image of images(); track image.id) {
          <li>
            <button
              #trigger
              type="button"
              data-testid="project-gallery-open"
              class="block w-full cursor-zoom-in overflow-hidden rounded-xl border border-foreground/8 bg-surface"
              (click)="enlarge(image, trigger)"
            >
              <span class="sr-only">{{ enlargeLabel }}</span>
              <img
                [ngSrc]="image.src"
                [alt]="image.alt"
                [width]="image.width"
                [height]="image.height"
                class="block h-auto w-full"
              />
            </button>
          </li>
        }
      </ul>
    </app-split-section>

    <dialog
      #dialog
      data-testid="project-gallery-dialog"
      class="m-auto max-h-[calc(100svh-2rem)] max-w-[calc(100vw-2rem)] rounded-xl border border-line-strong bg-background p-3 text-foreground backdrop:bg-background/90 open:flex open:flex-col open:items-end open:gap-3"
      [attr.aria-label]="dialogLabel()"
      (close)="returnToThumbnail()"
    >
      <button
        type="button"
        data-testid="project-gallery-close"
        class="inline-flex min-h-11 items-center rounded-md border border-foreground/15 bg-foreground/10 px-5 text-sm font-medium hover:bg-foreground/15"
        (click)="dialog.close()"
      >
        Fermer
      </button>
      @if (selected(); as image) {
        <img
          data-testid="project-gallery-enlarged"
          [ngSrc]="image.src"
          [alt]="image.alt"
          [width]="image.width"
          [height]="image.height"
          class="block h-auto max-h-[calc(100svh-8rem)] w-auto max-w-full object-contain"
        />
      }
    </dialog>
  `,
})
export class ProjectGallery {
  readonly images = input.required<readonly ProjectImage[]>();

  private readonly _dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly summary = SUMMARY;
  protected readonly enlargeLabel = ENLARGE_LABEL;
  protected readonly selected = signal<ProjectImage | null>(null);
  protected readonly dialogLabel = computed(() => {
    const image = this.selected();
    return image ? `${DIALOG_LABEL_PREFIX}${image.alt}` : null;
  });

  private _trigger: HTMLButtonElement | null = null;

  private readonly _showSelected = afterRenderEffect({
    write: () => {
      const dialog = this._dialog().nativeElement;
      if (this.selected() && !dialog.open) dialog.showModal();
    },
  });

  protected enlarge(image: ProjectImage, trigger: HTMLButtonElement): void {
    this._trigger = trigger;
    this.selected.set(image);
  }

  protected returnToThumbnail(): void {
    this.selected.set(null);
    this._trigger?.focus();
  }
}
