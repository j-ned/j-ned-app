import { ComponentFixture, DeferBlockBehavior, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ContactGateway } from '@features/contact/domain/gateways/contact.gateway';
import { stubContactGateway } from '@features/contact/testing/stub-contact-gateway';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { SITE_OFFER, SITE_OFFER_PRICES } from '../domain/site-offer.static-data';
import { SiteOffer } from './site-offer';

const NBSP = ' ';

describe('SiteOffer', () => {
  let fixture: ComponentFixture<SiteOffer>;

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const byTestId = (id: string, root: ParentNode = host()): HTMLElement | null =>
    root.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  const allByTestId = (id: string, root: ParentNode = host()): HTMLElement[] =>
    Array.from(root.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));
  // Normalise les blancs de mise en forme du template sans toucher aux espaces insécables.
  const text = (el: Element | null | undefined): string =>
    (el?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').trim();
  const sectionOf = (testId: string): HTMLElement | null =>
    byTestId(testId)?.closest('section') ?? null;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: ContactGateway, useValue: stubContactGateway() }],
      deferBlockBehavior: DeferBlockBehavior.Manual,
    }).compileComponents();
    fixture = TestBed.createComponent(SiteOffer);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  describe('hero', () => {
    it('renders the offer title as the only h1 of the page', () => {
      const headings = host().querySelectorAll('h1');
      expect(headings).toHaveLength(1);
      expect(headings[0]).toBe(byTestId('offer-title'));
      expect(text(headings[0])).toBe(SITE_OFFER.hero.title);
    });

    it('states the subtitle and the final price', () => {
      expect(text(byTestId('offer-subtitle'))).toBe(SITE_OFFER.hero.subtitle);
      expect(text(byTestId('offer-hero-price'))).toContain(SITE_OFFER.hero.priceLabel);
    });

    it('offers a call to action link pointing at the request form', () => {
      const cta = byTestId('offer-cta');
      expect(cta?.tagName).toBe('A');
      expect(text(cta)).toBe(SITE_OFFER.hero.ctaLabel);
      expect(cta?.getAttribute('href')).toMatch(/#demande$/);
    });

    it('navigates to the request fragment when the call to action is clicked', async () => {
      const router = TestBed.inject(Router);
      byTestId('offer-cta')?.click();
      await fixture.whenStable();
      expect(router.parseUrl(router.url).fragment).toBe('demande');
    });
  });

  it('leaves the main and contentinfo landmarks to the application shell', () => {
    expect(host().querySelectorAll('main, footer')).toHaveLength(0);
  });

  describe('reasons', () => {
    it('lists every reason with its lead and detail, in order', () => {
      const items = allByTestId('offer-reason');
      expect(items).toHaveLength(SITE_OFFER.reasons.length);
      expect(
        items.map((item) => ({
          lead: text(byTestId('offer-reason-lead', item)),
          detail: text(byTestId('offer-reason-detail', item)),
        })),
      ).toEqual(SITE_OFFER.reasons.map(({ lead, detail }) => ({ lead, detail })));
    });
  });

  describe('deliverables', () => {
    it('lists the nine deliverables, in order', () => {
      const items = allByTestId('offer-deliverable');
      expect(items).toHaveLength(9);
      expect(items.map((item) => text(item))).toEqual([...SITE_OFFER.deliverables]);
    });
  });

  describe('timeline', () => {
    it('renders the four steps as items of an ordered list, in order', () => {
      const items = allByTestId('offer-step');
      expect(items).toHaveLength(4);
      for (const item of items) {
        expect(item.tagName).toBe('LI');
        expect(item.parentElement?.tagName).toBe('OL');
      }
      expect(
        items.map((item) => ({
          verb: text(byTestId('offer-step-verb', item)),
          when: text(byTestId('offer-step-when', item)),
          detail: text(byTestId('offer-step-detail', item)),
        })),
      ).toEqual(SITE_OFFER.steps.map(({ verb, when, detail }) => ({ verb, when, detail })));
    });

    it('never numbers the steps', () => {
      expect(text(sectionOf('offer-step'))).not.toMatch(/Étape/);
    });
  });

  describe('pricing', () => {
    it('shows the creation price and its payment terms', () => {
      const creation = text(byTestId('offer-price-creation'));
      expect(creation).toContain(SITE_OFFER.pricing.creation.priceLabel);
      expect(creation).toContain(SITE_OFFER.pricing.creation.terms);
      expect(creation).toContain(`${SITE_OFFER_PRICES.creationEur}${NBSP}€`);
    });

    it('shows the monthly maintenance price and everything it includes', () => {
      const maintenance = byTestId('offer-price-maintenance');
      expect(text(maintenance)).toContain(SITE_OFFER.pricing.maintenance.priceLabel);
      expect(text(maintenance)).toContain(
        `${SITE_OFFER_PRICES.maintenanceMonthlyEur}${NBSP}€/mois`,
      );
      expect(allByTestId('offer-maintenance-include').map((item) => text(item))).toEqual([
        ...SITE_OFFER.pricing.maintenance.includes,
      ]);
    });

    it('states the VAT exemption read from the site identity', () => {
      expect(text(byTestId('offer-vat-mention'))).toBe(SITE_IDENTITY.business.vatMention);
    });
  });

  describe('faq', () => {
    it('renders each question as a closed native disclosure, in order', () => {
      const items = allByTestId('offer-faq-item');
      expect(items).toHaveLength(5);
      expect(items.map((item) => item.tagName)).toEqual(Array(5).fill('DETAILS'));
      expect(items.map((item) => (item as HTMLDetailsElement).open)).toEqual(Array(5).fill(false));
      expect(
        items.map((item) => {
          const question = byTestId('offer-faq-question', item);
          return {
            summary: question?.tagName === 'SUMMARY' && question.parentElement === item,
            question: text(question),
            answer: text(byTestId('offer-faq-answer', item)),
          };
        }),
      ).toEqual(
        SITE_OFFER.faq.map(({ question, answer }) => ({ summary: true, question, answer })),
      );
    });

    it('needs no script to open an answer', () => {
      expect(sectionOf('offer-faq-item')?.querySelectorAll('button')).toHaveLength(0);
    });
  });

  describe('request', () => {
    const request = (): HTMLElement | null => byTestId('offer-request');
    const inRequest = (id: string): HTMLElement | null => {
      const root = request();
      return root ? byTestId(id, root) : null;
    };

    it('is the target of the call to action and holds the contact form', () => {
      expect(request()?.id).toBe('demande');
      expect(request()?.querySelector('form')).not.toBeNull();
    });

    it('renders the form on the first render, outside any deferred block', async () => {
      expect(await fixture.getDeferBlocks()).toHaveLength(0);
      expect(inRequest('contact-subject')).not.toBeNull();
    });

    it('prefills the subject with the offer request subject', () => {
      const subject = inRequest('contact-subject') as HTMLInputElement | null;
      expect(subject?.value).toBe(SITE_OFFER.requestSubject);
    });

    it('speaks to a workshop owner in the form intro', () => {
      expect(text(inRequest('contact-intro'))).toBe(SITE_OFFER.requestIntro);
    });
  });

  it.each([
    ['offer-reason', "Pourquoi un tourneur plutôt qu'une agence"],
    ['offer-deliverable', 'Ce que contient le site'],
    ['offer-step', 'Le déroulé en 7 jours'],
    ['offer-price-creation', 'Tarif'],
    ['offer-faq-item', 'Questions fréquentes'],
  ])('labels the section holding %s with its h2 "%s"', (testId, heading) => {
    const section = sectionOf(testId);
    const labelledBy = section?.getAttribute('aria-labelledby') ?? '';
    const label = labelledBy ? host().querySelector(`[id="${labelledBy}"]`) : null;
    expect(label?.tagName).toBe('H2');
    expect(text(label)).toBe(heading);
  });
});
