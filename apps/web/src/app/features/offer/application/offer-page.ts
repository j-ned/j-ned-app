import { Component, input } from '@angular/core';
import { ContactForm } from '@features/contact/application/contact-form';
import type { OfferPageContent, OfferSummary } from '@features/offer/domain/models/offer.model';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { OfferDeliverables } from './components/offer-deliverables';
import { OfferFaq } from './components/offer-faq';
import { OfferHero } from './components/offer-hero';
import { OfferPricing } from './components/offer-pricing';
import { OfferReasons } from './components/offer-reasons';
import { OfferTimeline } from './components/offer-timeline';

@Component({
  selector: 'app-offer-page',
  imports: [
    OfferHero,
    OfferReasons,
    OfferDeliverables,
    OfferTimeline,
    OfferPricing,
    OfferFaq,
    ContactForm,
  ],
  host: { class: 'block pt-20' },
  template: `
    @let page = content();
    <app-offer-hero [hero]="page.hero" [priceTeaser]="summary().priceTeaser" />
    @if (page.reasons; as reasons) {
      <app-offer-reasons [reasons]="reasons" />
    }
    @if (page.deliverables; as deliverables) {
      <app-offer-deliverables [deliverables]="deliverables" />
    }
    @if (page.steps; as steps) {
      <app-offer-timeline [steps]="steps" />
    }
    <app-offer-pricing [pricing]="page.pricing" [vatMention]="vatMention" [maltUrl]="maltUrl" />
    @if (page.faq; as faq) {
      <app-offer-faq [faq]="faq" />
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
