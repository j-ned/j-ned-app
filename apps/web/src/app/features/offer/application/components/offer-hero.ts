import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { OfferHeroContent } from '@features/offer/domain/models/site-offer.model';

@Component({
  selector: 'app-offer-hero',
  imports: [RouterLink],
  host: { class: 'block' },
  template: `
    <section class="page-container pt-18 pb-22 md:pt-26 md:pb-30" aria-labelledby="offer-heading">
      <h1
        id="offer-heading"
        class="animate-fade-up text-[clamp(2.25rem,5.4vw,4.5rem)] font-extrabold leading-[1.04] tracking-[-0.035em] text-balance max-w-[20ch]"
        data-testid="offer-title"
      >
        {{ hero().title }}
      </h1>
      <p
        class="animate-fade-up [animation-delay:60ms] mt-7 max-w-[60ch] text-lg leading-[1.65] text-muted"
        data-testid="offer-subtitle"
      >
        {{ hero().subtitle }}
      </p>
      <div
        class="animate-fade-up [animation-delay:120ms] mt-9 flex flex-wrap items-center gap-x-6 gap-y-3"
      >
        <a routerLink="." fragment="demande" class="link-btn-primary" data-testid="offer-cta">
          {{ hero().ctaLabel }}
        </a>
        <p class="font-semibold text-primary" data-testid="offer-hero-price">
          {{ hero().priceLabel }}
        </p>
      </div>
    </section>
  `,
})
export class OfferHero {
  readonly hero = input.required<OfferHeroContent>();
}
