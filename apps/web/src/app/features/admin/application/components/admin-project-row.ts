import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import type { Project, ProjectInput } from '@features/projects/domain/models/project.model';
import { AdminProjectInlineForm } from './admin-project-inline-form';
import { AppTag } from '@shared/ui/tag';
import { Button } from '@shared/ui/button';
import { AppIcon } from '@shared/icons/app-icon';

@Component({
  selector: 'app-admin-project-row',
  imports: [NgOptimizedImage, AdminProjectInlineForm, AppTag, AppIcon, Button],
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
          <div
            class="w-12 h-12 rounded-lg bg-foreground/10 flex items-center justify-center"
          >
            <svg
              class="w-6 h-6 text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
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
          <app-tag value="Featured" severity="warn" />
        }
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <app-button
          severity="secondary"
          variant="outlined"
          [ariaLabel]="isEditing() ? 'Fermer' : 'Modifier'"
          (click)="editToggled.emit()"
        >
          @if (isEditing()) {
            <app-icon name="times" [size]="20" />
          } @else {
            <app-icon name="pencil" [size]="20" />
          }
        </app-button>
        <app-button severity="danger" ariaLabel="Supprimer" (click)="deleteClicked.emit()">
          <app-icon name="trash" [size]="20" />
        </app-button>
      </div>
    </div>

    @if (isEditing()) {
      <div class="px-5 pb-5">
        <app-admin-project-inline-form
          [project]="project()"
          (saved)="saved.emit($event)"
          (cancelled)="cancelled.emit()"
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
}
