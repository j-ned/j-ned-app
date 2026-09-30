import { Component, input } from '@angular/core';
import type { ArchitectureDecision } from '@features/projects/domain/models/project.model';
import { SplitSection } from '@shared/ui/split-section';

const SUMMARY = 'Les arbitrages structurants, avec leur justification.';

@Component({
  selector: 'app-project-detail-arch-decisions',
  imports: [SplitSection],
  host: { class: 'block border-t border-foreground/8', 'data-testid': 'architecture-decisions' },
  template: `
    <app-split-section
      headingId="architecture-decisions-title"
      heading="Décisions d'architecture"
      [summary]="summary"
    >
      <dl class="border-t border-foreground/8">
        @for (item of architectureDecisions(); track item.decision) {
          <div
            class="grid gap-x-8 gap-y-1.5 border-b border-foreground/8 py-6 lg:grid-cols-[14rem_minmax(0,1fr)]"
          >
            <dt class="text-lg font-semibold tracking-tight">{{ item.decision }}</dt>
            <dd class="max-w-[70ch] text-[0.96875rem] leading-relaxed text-muted text-pretty">
              {{ item.rationale }}
            </dd>
          </div>
        }
      </dl>
    </app-split-section>
  `,
})
export class ProjectDetailArchDecisions {
  readonly architectureDecisions = input.required<readonly ArchitectureDecision[]>();

  protected readonly summary = SUMMARY;
}
