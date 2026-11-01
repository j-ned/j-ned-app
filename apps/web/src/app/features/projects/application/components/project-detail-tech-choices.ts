import { Component, input } from '@angular/core';
import type { TechChoice } from '@features/projects/domain/models/project.model';
import { SplitSection } from '@shared/ui/split-section';

const SUMMARY = "Pourquoi chaque brique, et ce qu'elle apporte au projet.";

@Component({
  selector: 'app-project-detail-tech-choices',
  imports: [SplitSection],
  host: { class: 'block border-t border-foreground/8', 'data-testid': 'tech-choices' },
  template: `
    <app-split-section
      headingId="tech-choices-title"
      heading="Choix techniques"
      [summary]="summary"
    >
      <ul class="border-t border-foreground/8" role="list">
        @for (choice of techChoices(); track choice.techno) {
          <li
            class="grid gap-x-8 gap-y-1.5 border-b border-foreground/8 py-6 lg:grid-cols-[14rem_minmax(0,1fr)]"
          >
            <h3 class="text-lg font-semibold tracking-tight">{{ choice.techno }}</h3>
            <p class="max-w-[70ch] text-[0.96875rem] leading-relaxed text-muted text-pretty">
              {{ choice.why }}
            </p>
          </li>
        }
      </ul>
    </app-split-section>
  `,
})
export class ProjectDetailTechChoices {
  readonly techChoices = input.required<readonly TechChoice[]>();

  protected readonly summary = SUMMARY;
}
