import { Component, input } from '@angular/core';
import type { OfferFamily, OfferSummary } from '@features/offer/domain/models/offer.model';
import { OfferCard } from './offer-card';
import { OfferRow } from './offer-row';

@Component({
  selector: 'app-offer-family-list',
  imports: [OfferCard, OfferRow],
  host: { class: 'block' },
  template: `
    @switch (family()) {
      @case ('sites') {
        <ul role="list" class="grid gap-6 sm:grid-cols-2">
          @for (offer of offers(); track offer.slug) {
            <li>
              <app-offer-card data-testid="offer-card" [summary]="offer" />
            </li>
          }
        </ul>
      }
      @case ('applications') {
        <ul role="list" class="border-y-[1.5px] border-line-strong">
          @for (offer of offers(); track offer.slug) {
            <li class="border-t border-line first:border-t-0">
              <app-offer-row data-testid="offer-row" [summary]="offer" />
            </li>
          }
        </ul>
      }
    }
  `,
})
export class OfferFamilyList {
  readonly family = input.required<OfferFamily>();
  readonly offers = input.required<readonly OfferSummary[]>();
}
