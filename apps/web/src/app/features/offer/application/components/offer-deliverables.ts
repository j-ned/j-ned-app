import { Component, input } from '@angular/core';
import type { OfferSection } from '@features/offer/domain/models/offer.model';
import { AppIcon } from '@shared/icons/app-icon';
import { SplitSection } from '@shared/ui/split-section';

@Component({
  selector: 'app-offer-deliverables',
  imports: [SplitSection, AppIcon],
  host: { class: 'block border-t border-foreground/8' },
  template: `
    <app-split-section headingId="offer-deliverables-heading" [heading]="deliverables().heading">
      <ul class="grid gap-x-8 gap-y-4 sm:grid-cols-2" role="list">
        @for (deliverable of deliverables().items; track deliverable) {
          <li class="flex items-start gap-3 text-lg leading-[1.65]">
            <app-icon name="check" [size]="18" class="mt-1.5 text-primary" />
            <span data-testid="offer-deliverable">{{ deliverable }}</span>
          </li>
        }
      </ul>
    </app-split-section>
  `,
})
export class OfferDeliverables {
  readonly deliverables = input.required<OfferSection<string>>();
}
