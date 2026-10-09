import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Motivation } from '@features/profile/domain/models/what-i-do.model';
import { Button } from '@shared/ui/button';
import { AppIcon } from '@shared/icons/app-icon';

// Conclusion de la page : la motivation, puis deux sorties (projets, contact) au lieu d'une impasse.
@Component({
  selector: 'app-about-motivation',
  imports: [RouterLink, Button, AppIcon],
  host: { class: 'block border-t border-foreground/8' },
  template: `
    @let m = motivation();
    @if (m) {
      <section class="page-container py-26 md:py-34" aria-labelledby="motivation-heading">
        <h2 id="motivation-heading" class="font-mono text-[0.8125rem] font-medium text-muted">
          {{ m.title }}
        </h2>
        <p
          class="mt-4 max-w-[28ch] text-[clamp(1.75rem,3.6vw,3rem)] font-bold leading-[1.12] tracking-[-0.025em] text-balance"
          data-testid="motivation-statement"
        >
          {{ m.statement }}
        </p>
        <p class="mt-5 max-w-[56ch] text-[1.0625rem] text-muted">{{ m.description }}</p>
        <div class="mt-9 flex flex-wrap gap-3">
          <a appButton routerLink="/projects" data-testid="about-cta-projects">
            Voir les projets
            <app-icon name="arrow-right" [size]="20" />
          </a>
          <button
            appButton
            type="button"
            variant="outlined"
            data-testid="about-cta-contact"
            (click)="contactRequested.emit()"
          >
            Me contacter
          </button>
        </div>
      </section>
    }
  `,
})
export class AboutMotivation {
  readonly motivation = input.required<Motivation | undefined>();

  readonly contactRequested = output<void>();
}
