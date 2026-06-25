import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import type { TechChoice } from '@features/projects/domain/models/project.model';

@Component({
  selector: 'app-project-detail-tech-choices',
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <section
      data-testid="tech-choices"
      class="page-container mt-14 md:mt-20"
      aria-labelledby="tech-choices-title"
    >
      <div class="flex items-baseline gap-4 mb-6 md:mb-8">
        <h2 id="tech-choices-title" class="text-2xl md:text-3xl font-bold text-foreground">
          Choix techniques
        </h2>
        <span class="text-sm font-medium text-muted tabular-nums">
          {{ techChoices().length | number: '2.0-0' }}
        </span>
      </div>

      <ol class="grid border-t border-foreground/10 lg:grid-cols-2 lg:gap-x-12">
        @for (choice of techChoices(); track choice.techno; let i = $index) {
          <li
            class="grid grid-cols-[2.5rem_1fr] sm:grid-cols-[3.5rem_1fr] gap-x-4 sm:gap-x-8 py-5 md:py-6 border-b border-foreground/10 animate-fade-up"
            [style.animation-delay.ms]="i * 60"
          >
            <span
              class="text-2xl sm:text-3xl font-bold leading-none text-accent/60 tabular-nums pt-1"
              aria-hidden="true"
            >
              {{ i + 1 | number: '2.0-0' }}
            </span>
            <div>
              <h3 class="text-lg md:text-xl font-semibold text-foreground">
                {{ choice.techno }}
              </h3>
              <p class="mt-1.5 text-muted leading-relaxed max-w-prose text-pretty">
                {{ choice.why }}
              </p>
            </div>
          </li>
        }
      </ol>
    </section>
  `,
})
export class ProjectDetailTechChoices {
  readonly techChoices = input.required<readonly TechChoice[]>();
}
