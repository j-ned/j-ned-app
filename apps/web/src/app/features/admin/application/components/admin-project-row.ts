import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import type {
  Project,
  ProjectImage,
  ProjectInput,
} from '@features/projects/domain/models/project.model';
import { AdminProjectInlineForm } from './admin-project-inline-form';
import { AdminProjectGallery } from './admin-project-gallery';
import { AppTag } from '@shared/ui/tag';
import { Stamp } from '@shared/ui/stamp';
import { Button } from '@shared/ui/button';
import { AppIcon } from '@shared/icons/app-icon';

@Component({
  selector: 'app-admin-project-row',
  imports: [
    NgOptimizedImage,
    AdminProjectInlineForm,
    AdminProjectGallery,
    AppTag,
    Stamp,
    AppIcon,
    Button,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block bg-surface border border-foreground/10 rounded-xl overflow-hidden' },
  template: `
    <div class="flex items-center gap-4 px-5 py-4">
      <div class="shrink-0">
        @if (project().image) {
          <img
            [ngSrc]="project().image"
            [alt]="project().title"
            width="48"
            height="48"
            class="w-12 h-12 rounded-lg object-cover"
          />
        } @else {
          <div class="w-12 h-12 rounded-lg bg-foreground/10 flex items-center justify-center">
            <svg class="w-6 h-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        }
      </div>

      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-foreground truncate">{{ project().title }}</p>
        <div class="flex flex-wrap gap-1 mt-1">
          @for (tag of project().tags.slice(0, 4); track tag) {
            <app-tag [value]="tag" severity="info" />
          }
          @if (project().tags.length > 4) {
            <app-tag [value]="'+' + (project().tags.length - 4)" severity="secondary" />
          }
        </div>
      </div>

      <div class="hidden sm:flex flex-col items-end gap-1 shrink-0">
        <span class="text-xs text-muted">{{ project().category }}</span>
        @if (project().featured) {
          <app-stamp data-testid="admin-project-featured">Mis en avant</app-stamp>
        }
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <button
          type="button"
          data-testid="admin-project-edit-toggle"
          [attr.aria-label]="editLabel()"
          [attr.aria-expanded]="isEditing()"
          [attr.aria-controls]="panelId()"
          (click)="editToggled.emit()"
          class="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md border border-muted/30 text-foreground transition-colors hover:border-foreground/30 hover:bg-surface-elevated"
        >
          <app-icon [name]="isEditing() ? 'times' : 'pencil'" [size]="20" />
        </button>
        <app-button
          severity="danger"
          [ariaLabel]="deleteLabel()"
          data-testid="admin-project-delete"
          (click)="deleteClicked.emit()"
        >
          <app-icon name="trash" [size]="20" />
        </app-button>
      </div>
    </div>

    @if (isEditing()) {
      <div [id]="panelId()" class="px-5 pb-5 space-y-5">
        <app-admin-project-inline-form
          [project]="project()"
          (saved)="saved.emit($event)"
          (cancelled)="cancelled.emit()"
        />
        <app-admin-project-gallery
          [projectId]="project().id"
          [images]="project().gallery"
          (galleryChange)="galleryChange.emit($event)"
        />
      </div>
    }
  `,
})
export class AdminProjectRow {
  readonly project = input.required<Project>();
  readonly isEditing = input<boolean>(false);

  readonly editToggled = output<void>();
  readonly deleteClicked = output<void>();
  readonly saved = output<{ data: ProjectInput; file: File | null }>();
  readonly cancelled = output<void>();
  readonly galleryChange = output<readonly ProjectImage[]>();

  protected readonly panelId = computed(() => `admin-project-edit-${this.project().id}`);
  protected readonly editLabel = computed(() =>
    this.isEditing()
      ? `Fermer l'édition\u00a0: ${this.project().title}`
      : `Modifier\u00a0: ${this.project().title}`,
  );
  protected readonly deleteLabel = computed(() => `Supprimer\u00a0: ${this.project().title}`);
}
