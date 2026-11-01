import { Component, computed, input } from '@angular/core';
import { Cartouche } from '@shared/ui/cartouche';
import type { LegendRow } from '../projects-view';
import { ProjectKindStamp } from './project-kind-stamp';

@Component({
  selector: 'app-project-kind-legend',
  imports: [Cartouche, ProjectKindStamp],
  template: `
    <app-cartouche title="Légende" reference="Nature du projet">
      <dl class="grid grid-cols-[auto_minmax(0,1fr)_auto]">
        @for (row of displayedRows(); track row.kind) {
          <div
            class="col-span-full grid grid-cols-subgrid items-center gap-x-4 border-t border-line px-3.5 py-2.5 first:border-t-0"
          >
            <dt>
              <app-project-kind-stamp data-testid="project-kind-legend-kind" [kind]="row.kind" />
            </dt>
            <dd data-testid="project-kind-legend-definition">{{ row.definition }}</dd>
            <dd
              data-testid="project-kind-legend-count"
              class="text-right font-mono font-medium tabular-nums"
            >
              {{ row.count }}
              <span data-testid="project-kind-legend-unit" class="sr-only">{{ row.unit }}</span>
            </dd>
          </div>
        }
      </dl>
    </app-cartouche>
  `,
})
export class ProjectKindLegend {
  readonly rows = input.required<readonly LegendRow[]>();

  protected readonly displayedRows = computed(() =>
    this.rows().map((row) => ({ ...row, unit: row.count > 1 ? 'projets' : 'projet' })),
  );
}
