import { Component, input } from '@angular/core';
import type { OfferStep } from '@features/offer/domain/models/site-offer.model';
import { SplitSection } from '@shared/ui/split-section';

@Component({
  selector: 'app-offer-timeline',
  imports: [SplitSection],
  host: { class: 'block border-t border-foreground/8' },
  template: `
    <app-split-section headingId="offer-timeline-heading" heading="Le déroulé en 7 jours">
      <ol class="space-y-8" role="list">
        @for (step of steps(); track step.id) {
          <li class="border-l-2 border-primary/40 pl-5" data-testid="offer-step">
            <p class="font-mono text-sm text-muted" data-testid="offer-step-when">
              {{ step.when }}
            </p>
            <h3 class="mt-1 text-xl font-semibold tracking-tight" data-testid="offer-step-verb">
              {{ step.verb }}
            </h3>
            <p class="mt-2 leading-relaxed text-muted" data-testid="offer-step-detail">
              {{ step.detail }}
            </p>
          </li>
        }
      </ol>
    </app-split-section>
  `,
})
export class OfferTimeline {
  readonly steps = input.required<readonly OfferStep[]>();
}
