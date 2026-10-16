import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '@shared/ui/button';
import { PROJECT_FOLLOW_UP_COPY } from '../project-follow-up-copy';

@Component({
  selector: 'app-project-follow-up',
  imports: [RouterLink, Button],
  host: { class: 'block border-t border-foreground/8' },
  template: `
    <section
      class="page-container py-22 md:py-30"
      aria-labelledby="project-follow-up-heading"
      data-testid="project-follow-up"
    >
      <h2
        id="project-follow-up-heading"
        class="text-[clamp(1.75rem,3.4vw,2.75rem)] font-bold leading-[1.1] tracking-[-0.025em] text-balance"
      >
        {{ copy.heading }}
      </h2>
      <p
        class="mt-4 max-w-[52ch] text-[clamp(1.0625rem,1.4vw,1.25rem)] text-muted"
        data-testid="project-follow-up-text"
      >
        {{ copy.text }}
      </p>
      <a
        appButton
        class="mt-8 py-2.5"
        [routerLink]="offer().path"
        data-testid="project-follow-up-offer"
        (click)="offerOpened.emit()"
        >{{ offer().label }}</a
      >
    </section>
  `,
})
export class ProjectFollowUp {
  readonly offer = input.required<{ readonly label: string; readonly path: string }>();

  readonly offerOpened = output<void>();

  protected readonly copy = PROJECT_FOLLOW_UP_COPY;
}
