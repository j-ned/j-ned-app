import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import type { ArchitectureDecision } from '@features/projects/domain/models/project.model';

@Component({
  selector: 'app-project-detail-arch-decisions',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <section
      data-testid="architecture-decisions"
      class="page-container mt-14 md:mt-20"
      aria-labelledby="architecture-decisions-title"
    >
      <h2
        id="architecture-decisions-title"
        class="text-2xl md:text-3xl font-bold text-foreground mb-6 md:mb-8"
      >
        Décisions d'architecture
      </h2>

      <dl class="grid border-t border-foreground/10 lg:grid-cols-2 lg:gap-x-12">
        @for (item of architectureDecisions(); track item.decision; let i = $index) {
          <div
            class="grid gap-y-1.5 py-5 md:py-6 border-b border-foreground/10 animate-fade-up md:grid-cols-[2fr_3fr] md:gap-x-8 lg:grid-cols-1 lg:gap-x-0"
            [style.animation-delay.ms]="i * 60"
          >
            <dt class="flex items-start gap-3 text-base md:text-lg font-semibold text-foreground">
              <span
                class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                aria-hidden="true"
              ></span>
              {{ item.decision }}
            </dt>
            <dd class="text-muted leading-relaxed max-w-prose text-pretty pl-[1.625rem] md:pl-0 lg:pl-[1.625rem]">
              {{ item.rationale }}
            </dd>
          </div>
        }
      </dl>
    </section>
  `,
})
export class ProjectDetailArchDecisions {
  readonly architectureDecisions = input.required<readonly ArchitectureDecision[]>();
}
