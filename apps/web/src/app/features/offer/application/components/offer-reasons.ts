import { Component, input } from '@angular/core';
import type { OfferReason, OfferSection } from '@features/offer/domain/models/offer.model';
import { SplitSection } from '@shared/ui/split-section';

@Component({
  selector: 'app-offer-reasons',
  imports: [SplitSection],
  host: { class: 'block border-t border-foreground/8' },
  template: `
    <app-split-section headingId="offer-reasons-heading" [heading]="reasons().heading">
      <ul class="space-y-6" role="list">
        @for (reason of reasons().items; track reason.id) {
          <li class="text-lg leading-[1.65]" data-testid="offer-reason">
            <span class="font-semibold" data-testid="offer-reason-lead">{{ reason.lead }}</span>
            <span class="text-muted">&nbsp;: </span>
            <span class="text-muted" data-testid="offer-reason-detail">{{ reason.detail }}</span>
          </li>
        }
      </ul>
    </app-split-section>
  `,
})
export class OfferReasons {
  readonly reasons = input.required<OfferSection<OfferReason>>();
}
