import { Component, input } from '@angular/core';
import type { OfferFaqItem, OfferSection } from '@features/offer/domain/models/offer.model';
import { SplitSection } from '@shared/ui/split-section';

@Component({
  selector: 'app-offer-faq',
  imports: [SplitSection],
  host: { class: 'block border-t border-foreground/8' },
  template: `
    <app-split-section headingId="offer-faq-heading" [heading]="faq().heading">
      @for (item of faq().items; track item.id) {
        <details class="border-b border-foreground/8" data-testid="offer-faq-item">
          <summary
            class="min-h-11 cursor-pointer py-3 font-semibold"
            data-testid="offer-faq-question"
          >
            {{ item.question }}
          </summary>
          <p class="pb-4 leading-relaxed text-muted" data-testid="offer-faq-answer">
            {{ item.answer }}
          </p>
        </details>
      }
    </app-split-section>
  `,
})
export class OfferFaq {
  readonly faq = input.required<OfferSection<OfferFaqItem>>();
}
