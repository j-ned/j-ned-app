import { Component, computed, input, output } from '@angular/core';
import { DatePipe, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';
import { Stamp } from '@shared/ui/stamp';
import type { AdminPostRowView } from '../admin-posts-view';

@Component({
  selector: 'tr[app-admin-post-row]',
  imports: [DatePipe, NgOptimizedImage, RouterLink, AppIcon, Button, Stamp],
  host: { 'data-testid': 'admin-post-row', class: 'border-b border-line align-middle' },
  template: `
    <td class="py-3.5 pr-3">
      <div class="flex items-center gap-4">
        <div
          data-testid="admin-post-cover"
          class="relative hidden aspect-[1200/630] w-32 shrink-0 overflow-hidden rounded-sm border border-line-strong bg-surface sm:block"
        >
          @if (row().cover) {
            <img [ngSrc]="row().cover" alt="" fill sizes="8rem" class="object-cover" />
          } @else {
            <span
              aria-hidden="true"
              class="absolute inset-0 grid place-items-center font-mono text-xs text-muted"
              >sans couverture</span
            >
          }
        </div>
        <div class="min-w-0">
          <p
            data-testid="admin-post-title"
            class="font-display text-[1.0625rem] leading-tight font-bold text-balance"
          >
            {{ row().title }}
          </p>
          @if (row().subjects) {
            <p data-testid="admin-post-subjects" class="mt-1.5 font-mono text-xs text-muted">
              {{ row().subjects }}
            </p>
          }
          <p data-testid="admin-post-meta" class="mt-1.5 font-mono text-xs text-muted md:hidden">
            @if (row().publishedAt; as date) {
              {{ date | date: 'd MMM y' }}
            } @else {
              Non publié
            }
            · {{ row().readingTime }} · {{ row().likes }}&nbsp;j'aime
          </p>
        </div>
      </div>
    </td>
    <td class="py-3.5 pr-3">
      <app-stamp data-testid="admin-post-status" [dashed]="row().status === 'draft'">
        {{ row().status === 'published' ? 'Publié' : 'Brouillon' }}
      </app-stamp>
    </td>
    <td
      data-testid="admin-post-date"
      class="hidden py-3.5 pr-3 font-mono text-sm whitespace-nowrap md:table-cell"
    >
      @if (row().publishedAt; as date) {
        {{ date | date: 'd MMM y' }}
      } @else {
        <span aria-hidden="true">—</span>
        <span data-testid="admin-post-unpublished" class="sr-only">non publié</span>
      }
    </td>
    <td
      data-testid="admin-post-reading-time"
      class="hidden py-3.5 pr-3 font-mono text-sm whitespace-nowrap md:table-cell"
    >
      {{ row().readingTime }}
    </td>
    <td
      data-testid="admin-post-likes"
      class="hidden py-3.5 pr-3 text-right font-mono text-sm tabular-nums md:table-cell"
    >
      {{ row().likes }}
    </td>
    <td class="py-3.5">
      <div class="flex flex-wrap justify-end gap-1 sm:flex-nowrap">
        @if (row().status === 'published') {
          <a
            appButton
            variant="ghost-icon"
            data-testid="admin-post-view"
            [href]="'/blog/' + row().slug"
            target="_blank"
            rel="noopener noreferrer"
            [attr.aria-label]="viewLabel()"
          >
            <app-icon name="external-link" [size]="18" />
          </a>
        }
        <a
          appButton
          variant="ghost-icon"
          data-testid="admin-post-edit"
          [routerLink]="['/admin/blog', row().id]"
          [attr.aria-label]="editLabel()"
        >
          <app-icon name="pencil" [size]="18" />
        </a>
        <button
          appButton
          type="button"
          variant="text-danger"
          size="icon"
          data-testid="admin-post-delete"
          [attr.aria-label]="deleteLabel()"
          (click)="deleteRequested.emit()"
        >
          <app-icon name="trash" [size]="18" />
        </button>
      </div>
    </td>
  `,
})
export class AdminPostRow {
  readonly row = input.required<AdminPostRowView>();
  readonly deleteRequested = output<void>();

  protected readonly viewLabel = computed(
    () => `Lire en ligne\u00a0: ${this.row().title} (nouvel onglet)`,
  );
  protected readonly editLabel = computed(() => `Modifier\u00a0: ${this.row().title}`);
  protected readonly deleteLabel = computed(() => `Supprimer\u00a0: ${this.row().title}`);
}
