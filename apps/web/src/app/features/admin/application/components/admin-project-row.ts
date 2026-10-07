import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProjectCover } from '@features/projects/application/components/project-cover';
import { FactList } from '@shared/ui/fact-list';
import { Button } from '@shared/ui/button';
import { AppIcon } from '@shared/icons/app-icon';
import type { AdminProjectRowView } from '../admin-projects-view';

@Component({
  selector: 'li[app-admin-project-row]',
  imports: [RouterLink, ProjectCover, FactList, Button, AppIcon],
  host: {
    'data-testid': 'admin-project-row',
    class:
      'grid items-start gap-4 border-b border-line py-6.5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6 lg:grid-cols-[2.25rem_13.5rem_minmax(0,1fr)_auto] lg:gap-7',
  },
  template: `
    <span aria-hidden="true" class="pt-1 font-mono text-[0.8125rem] text-muted max-lg:hidden">
      {{ row().order }}
    </span>
    <app-project-cover [image]="row().image" alt="" [kind]="row().kind" />
    <div class="min-w-0">
      <p data-testid="admin-project-row-overline" class="font-mono text-xs text-muted">
        {{ row().overline }}
      </p>
      <h2
        data-testid="admin-project-row-title"
        class="mt-1.5 text-[1.375rem] leading-[1.1] font-extrabold tracking-[-0.03em] font-stretch-106%"
      >
        {{ row().title }}
      </h2>
      @if (row().pitch; as pitch) {
        <p
          data-testid="admin-project-row-pitch"
          class="mt-2 line-clamp-2 max-w-[62ch] text-[0.90625rem] text-muted"
        >
          {{ pitch }}
        </p>
      } @else {
        <p
          data-testid="admin-project-pitch-missing"
          class="mt-2.5 flex items-center gap-2 text-[0.8125rem] text-muted"
        >
          <span aria-hidden="true" class="size-1.5 shrink-0 rounded-full bg-primary"></span>
          Accroche vide&nbsp;: la carte publique reprend la première phrase de la description.
        </p>
      }
      @if (row().facts.length > 0) {
        <app-fact-list class="mt-3.5 max-w-[40rem]" [facts]="row().facts" />
      }
    </div>
    <div class="flex gap-1 sm:col-start-2 lg:col-start-auto">
      <a
        data-testid="admin-project-view"
        [href]="'/projects/' + row().slug"
        target="_blank"
        rel="noopener noreferrer"
        [attr.aria-label]="viewLabel()"
        [class]="iconLinkClass"
      >
        <app-icon name="external-link" [size]="18" />
      </a>
      <a
        data-testid="admin-project-edit"
        [routerLink]="['/admin/projects', row().id]"
        [attr.aria-label]="editLabel()"
        [class]="iconLinkClass"
      >
        <app-icon name="pencil" [size]="18" />
      </a>
      <app-button
        severity="danger"
        variant="text"
        size="icon"
        data-testid="admin-project-delete"
        [ariaLabel]="deleteLabel()"
        (click)="deleteRequested.emit()"
      >
        <app-icon name="trash" [size]="18" />
      </app-button>
    </div>
  `,
})
export class AdminProjectRow {
  readonly row = input.required<AdminProjectRowView>();
  readonly deleteRequested = output<void>();

  protected readonly iconLinkClass =
    'inline-flex size-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-primary';
  protected readonly viewLabel = computed(
    () => `Voir la fiche publique\u00a0: ${this.row().title} (nouvel onglet)`,
  );
  protected readonly editLabel = computed(() => `Modifier\u00a0: ${this.row().title}`);
  protected readonly deleteLabel = computed(() => `Supprimer\u00a0: ${this.row().title}`);
}
