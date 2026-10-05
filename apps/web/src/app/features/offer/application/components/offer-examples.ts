import { Component, input } from '@angular/core';
import type { OfferExamples as OfferExamplesContent } from '@features/offer/domain/models/offer.model';
import { SplitSection } from '@shared/ui/split-section';
import { OfferDemoCard } from './offer-demo-card';

@Component({
  selector: 'app-offer-examples',
  imports: [SplitSection, OfferDemoCard],
  host: { class: 'block border-t border-foreground/8' },
  template: `
    <app-split-section
      headingId="offer-examples-heading"
      [heading]="examples().heading"
      [summary]="examples().lead"
    >
      <ul class="grid gap-10" role="list" data-testid="offer-examples">
        @for (demo of examples().items; track demo.id) {
          <li data-testid="offer-demo">
            <app-offer-demo-card [demo]="demo" />
          </li>
        }
      </ul>
    </app-split-section>
  `,
})
export class OfferExamples {
  readonly examples = input.required<OfferExamplesContent>();
}
