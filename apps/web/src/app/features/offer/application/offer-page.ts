import { Component, input } from '@angular/core';
import { ContactForm } from '@features/contact/application/contact-form';
import type { OfferPageContent, OfferSummary } from '@features/offer/domain/models/offer.model';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { FaqList } from '@shared/ui/faq-list';
import { KeyPointList } from '@shared/ui/key-point-list';
import { SplitSection } from '@shared/ui/split-section';
import { OfferDeliverables } from './components/offer-deliverables';
import { OfferHero } from './components/offer-hero';
import { OfferPricing } from './components/offer-pricing';
import { OfferTimeline } from './components/offer-timeline';

@Component({
  selector: 'app-offer-page',
  imports: [
    OfferHero,
    SplitSection,
    KeyPointList,
    OfferDeliverables,
    OfferTimeline,
    OfferPricing,
    FaqList,
    ContactForm,
  ],
  host: { class: 'block pt-20' },
  template: `
    @let page = content();
    <app-offer-hero [hero]="page.hero" [priceTeaser]="summary().priceTeaser" />
    @if (page.reasons; as reasons) {
      <app-split-section
        class="border-t border-foreground/8"
        headingId="offer-reasons-heading"
        [heading]="reasons.heading"
      >
        <app-key-point-list [points]="reasons.items" />
      </app-split-section>
    }
    @if (page.deliverables; as deliverables) {
      <app-offer-deliverables [deliverables]="deliverables" />
    }
    @if (page.steps; as steps) {
      <app-offer-timeline [steps]="steps" />
    }
    <app-offer-pricing [pricing]="page.pricing" [vatMention]="vatMention" [maltUrl]="maltUrl" />
    @if (page.faq; as faq) {
      <app-faq-list
        class="border-t border-foreground/8"
        headingId="offer-faq-heading"
        [heading]="faq.heading"
        [items]="faq.items"
      />
    }
    <div id="demande" class="scroll-mt-20" data-testid="offer-request">
      <app-contact-form [initialSubject]="page.request.subject" [intro]="page.request.intro" />
    </div>
  `,
})
export class OfferPage {
  readonly summary = input.required<OfferSummary>();
  readonly content = input.required<OfferPageContent>();
  protected readonly vatMention = SITE_IDENTITY.business.vatMention;
  protected readonly maltUrl = SITE_IDENTITY.socials.malt;
}
