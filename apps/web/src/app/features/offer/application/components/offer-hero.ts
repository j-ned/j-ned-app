import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { OfferPageContent } from '@features/offer/domain/models/offer.model';
import { OFFER_REQUEST_FRAGMENT } from '@features/offer/domain/offer-path';
import { Button } from '@shared/ui/button';

@Component({
  selector: 'app-offer-hero',
  imports: [RouterLink, Button],
  host: { class: 'block' },
  template: `
    <section class="page-container pt-18 pb-22 md:pt-26 md:pb-30" aria-labelledby="offer-heading">
      <h1
        id="offer-heading"
        class="text-[clamp(2.25rem,5.4vw,4.5rem)] font-extrabold leading-[1.04] tracking-[-0.035em] text-balance max-w-[20ch]"
        data-testid="offer-title"
      >
        {{ hero().title }}
      </h1>
      <p class="mt-7 max-w-[60ch] text-lg leading-[1.65] text-muted" data-testid="offer-subtitle">
        {{ hero().subtitle }}
      </p>
      <div
        class="animate-fade-up [animation-delay:120ms] mt-9 flex flex-wrap items-center gap-x-6 gap-y-3"
      >
        <a
          appButton
          routerLink="."
          [fragment]="requestFragment"
          data-testid="offer-cta"
          (click)="requestOpened.emit()"
        >
          {{ hero().ctaLabel }}
        </a>
        <p class="font-semibold text-primary" data-testid="offer-hero-price">
          {{ priceTeaser() }}
        </p>
      </div>
    </section>
  `,
})
export class OfferHero {
  readonly hero = input.required<OfferPageContent['hero']>();
  readonly priceTeaser = input.required<string>();
  readonly requestOpened = output<void>();

  protected readonly requestFragment = OFFER_REQUEST_FRAGMENT;
}
