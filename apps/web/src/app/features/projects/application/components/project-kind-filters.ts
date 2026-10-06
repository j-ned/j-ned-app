import { Component, input, model } from '@angular/core';
import type { ProjectKindFilter } from '../../domain/models/project.model';
import type { KindFilterOption } from '../projects-view';

@Component({
  selector: 'app-project-kind-filters',
  host: { class: 'block overflow-x-auto' },
  template: `
    <div
      data-testid="project-kind-filters"
      role="group"
      aria-label="Filtrer par nature"
      class="flex w-max min-w-full gap-1 shadow-[inset_0_-1px_0_var(--color-line)]"
    >
      @for (option of options(); track option.value) {
        <button
          data-testid="project-kind-filter"
          type="button"
          [attr.aria-pressed]="option.value === active()"
          (click)="active.set(option.value)"
          class="inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-2 text-sm sm:px-3 text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary aria-pressed:border-primary aria-pressed:font-semibold aria-pressed:text-foreground"
        >
          <span data-testid="project-kind-filter-label">{{ option.label }}</span>
          <span data-testid="project-kind-filter-count" class="font-mono text-xs tabular-nums">
            {{ option.count }}
          </span>
        </button>
      }
    </div>
  `,
})
export class ProjectKindFilters {
  readonly options = input.required<readonly KindFilterOption[]>();
  readonly active = model.required<ProjectKindFilter>();
}
