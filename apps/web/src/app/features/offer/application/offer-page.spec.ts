import { ComponentFixture, DeferBlockBehavior, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ContactGateway } from '@features/contact/domain/gateways/contact.gateway';
import { stubContactGateway } from '@features/contact/testing/stub-contact-gateway';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import type { OfferPageContent, OfferSummary } from '../domain/models/offer.model';
import { OFFERS } from '../domain/offer-catalog.static-data';
import { OFFER_PAGES } from '../domain/offer-pages.static-data';
import {
  makeOfferPageContent,
  makeOfferPriceLine,
  offerSummaryOf,
  withoutSections,
} from '../testing/offer-builders';
import { OfferPage } from './offer-page';

const ATELIER: OfferPageContent = OFFER_PAGES['site-atelier'];

describe('OfferPage', () => {
  let fixture: ComponentFixture<OfferPage>;

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
  const headingOf = (testId: string): Element | null => {
    const labelledBy = sectionOf(testId)?.getAttribute('aria-labelledby') ?? '';
    return labelledBy ? host().querySelector(`[id="${labelledBy}"]`) : null;
  };
  const sectionHeadings = (): string[] =>
    Array.from(host().querySelectorAll('h2'))
      .filter((heading) => !heading.closest('[data-testid="offer-request"]'))
      .map(text);

  async function setup(
    content: OfferPageContent = ATELIER,
    summary: OfferSummary = offerSummaryOf('site-atelier'),
  ): Promise<void> {
    await TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: ContactGateway, useValue: stubContactGateway() }],
      deferBlockBehavior: DeferBlockBehavior.Manual,
    }).compileComponents();
    fixture = TestBed.createComponent(OfferPage);
    fixture.componentRef.setInput('summary', summary);
    fixture.componentRef.setInput('content', content);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  describe('given the workshop offer', () => {
    beforeEach(() => setup());

    describe('hero', () => {
      it('renders the offer title as the only h1 of the page', () => {
        const headings = host().querySelectorAll('h1');
        expect(headings).toHaveLength(1);
        expect(headings[0]).toBe(byTestId('offer-title'));
        expect(text(headings[0])).toBe(ATELIER.hero.title);
      });

      it('states the subtitle and the price teaser of the offer summary', () => {
        expect(text(byTestId('offer-subtitle'))).toBe(ATELIER.hero.subtitle);
        expect(text(byTestId('offer-hero-price'))).toBe(offerSummaryOf('site-atelier').priceTeaser);
      });

      it('offers a call to action link pointing at the request form', () => {
        const cta = byTestId('offer-cta');
        expect(cta?.tagName).toBe('A');
        expect(text(cta)).toBe(ATELIER.hero.ctaLabel);
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

    it('lists the three reasons with their lead and detail, in order', () => {
      const items = allByTestId('key-point');
      expect(items).toHaveLength(3);
      expect(
        items.map((item) => ({
          lead: text(byTestId('key-point-lead', item)),
          detail: text(byTestId('key-point-detail', item)),
        })),
      ).toEqual(ATELIER.reasons?.items.map(({ lead, detail }) => ({ lead, detail })));
    });

    it('lists the nine deliverables, in order', () => {
      const items = allByTestId('offer-deliverable');
      expect(items).toHaveLength(9);
      expect(items.map((item) => text(item))).toEqual(ATELIER.deliverables?.items);
    });

    describe('timeline', () => {
      it('renders the four steps as items of an ordered list, in order', () => {
        const items = allByTestId('offer-step');
        expect(items).toHaveLength(4);
        expect(items.map((item) => [item.tagName, item.parentElement?.tagName])).toEqual(
          Array(4).fill(['LI', 'OL']),
        );
        expect(
          items.map((item) => ({
            verb: text(byTestId('offer-step-verb', item)),
            when: text(byTestId('offer-step-when', item)),
            detail: text(byTestId('offer-step-detail', item)),
          })),
        ).toEqual(ATELIER.steps?.items.map(({ verb, when, detail }) => ({ verb, when, detail })));
      });

      it('never numbers the steps', () => {
        expect(text(sectionOf('offer-step'))).not.toMatch(/Étape/);
      });
    });

    it('links the pricing to no contracting platform', () => {
      expect(allByTestId('offer-price-link')).toHaveLength(0);
    });

    it('states the VAT exemption read from the site identity', () => {
      expect(text(byTestId('offer-vat-mention'))).toBe(SITE_IDENTITY.business.vatMention);
    });

    describe('faq', () => {
      it('renders the five questions as closed native disclosures, in order', () => {
        const items = allByTestId('faq-item');
        expect(items).toHaveLength(5);
        expect(items.map((item) => item.tagName)).toEqual(Array(5).fill('DETAILS'));
        expect(items.map((item) => (item as HTMLDetailsElement).open)).toEqual(
          Array(5).fill(false),
        );
        expect(
          items.map((item) => {
            const question = byTestId('faq-question', item);
            return {
              summary: question?.tagName === 'SUMMARY' && question.parentElement === item,
              question: text(question),
              answer: text(byTestId('faq-answer', item)),
            };
          }),
        ).toEqual(
          ATELIER.faq?.items.map(({ question, answer }) => ({ summary: true, question, answer })),
        );
      });

      it('needs no script to open an answer', () => {
        expect(sectionOf('faq-item')?.querySelectorAll('button')).toHaveLength(0);
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
        expect(subject?.value).toBe(ATELIER.request.subject);
      });

      it('speaks to a workshop owner in the form intro', () => {
        expect(text(inRequest('contact-intro'))).toBe(ATELIER.request.intro);
      });
    });
  });

  describe.each(OFFERS.map((summary) => [summary.slug, summary] as const))(
    'given the %s offer of the catalogue',
    (slug, summary) => {
      const content = OFFER_PAGES[slug];

      beforeEach(() => setup(content, summary));

      it('renders its hero title as the only h1 of the page', () => {
        const headings = host().querySelectorAll('h1');
        expect(headings).toHaveLength(1);
        expect(text(headings[0])).toBe(content.hero.title);
      });

      it('teases its price in the hero', () => {
        expect(text(byTestId('offer-hero-price'))).toBe(summary.priceTeaser);
      });

      it('prefills the request form with its own subject', () => {
        const subject = byTestId('offer-request')?.querySelector<HTMLInputElement>(
          '[data-testid="contact-subject"]',
        );
        expect(subject?.value).toBe(content.request.subject);
      });

      it('asks the request form for a timeline but not for a project type', () => {
        const request = byTestId('offer-request');
        expect([
          request?.querySelector('select[data-testid="contact-project-type"]') ?? null,
          request?.querySelector('select[data-testid="contact-timeline"]')?.tagName,
        ]).toEqual([null, 'SELECT']);
      });
    },
  );

  describe('given the freelance reinforcement offer', () => {
    const RENFORT: OfferPageContent = OFFER_PAGES['renfort-freelance'];

    beforeEach(() => setup(RENFORT, offerSummaryOf('renfort-freelance')));

    it('renders no timeline, neither its steps nor its heading', () => {
      expect(allByTestId('offer-step')).toHaveLength(0);
      expect(sectionHeadings()).toEqual([
        RENFORT.reasons?.heading,
        RENFORT.deliverables?.heading,
        RENFORT.pricing.heading,
        RENFORT.faq?.heading,
      ]);
    });

    it('states its day rate on request, without any figure', () => {
      const labels = allByTestId('offer-price-label').map((label) => text(label));
      expect(labels).toEqual(RENFORT.pricing.lines.map(({ label }) => label));
      expect(labels.filter((label) => /\d/.test(label))).toEqual([]);
    });

    it('links the pricing to the Malt profile, in a new tab', () => {
      const pricing = sectionOf('offer-price-line');
      const links = pricing ? allByTestId('offer-price-link', pricing) : [];
      expect(links).toHaveLength(1);
      expect({
        tag: links[0]?.tagName,
        href: links[0]?.getAttribute('href'),
        target: links[0]?.getAttribute('target'),
        rel: links[0]?.getAttribute('rel'),
      }).toEqual({
        tag: 'A',
        href: SITE_IDENTITY.socials.malt,
        target: '_blank',
        rel: 'noopener noreferrer',
      });
      expect(text(links[0])).not.toBe('');
    });
  });

  describe.each([
    ['the workshop offer', ATELIER],
    ['an offer with its own headings', makeOfferPageContent()],
  ])('given %s', (_label, content) => {
    beforeEach(() => setup(content));

    it.each([
      ['key-point', (c: OfferPageContent): string | undefined => c.reasons?.heading],
      ['offer-deliverable', (c: OfferPageContent): string | undefined => c.deliverables?.heading],
      ['offer-step', (c: OfferPageContent): string | undefined => c.steps?.heading],
      ['offer-price-line', (c: OfferPageContent): string | undefined => c.pricing.heading],
      ['faq-item', (c: OfferPageContent): string | undefined => c.faq?.heading],
    ])('labels the section holding %s with its h2 heading from the content', (testId, heading) => {
      const label = headingOf(testId);
      expect(label?.tagName).toBe('H2');
      expect(text(label)).toBe(heading(content));
    });

    it('titles the sections in content order', () => {
      expect(sectionHeadings()).toEqual([
        content.reasons?.heading,
        content.deliverables?.heading,
        content.steps?.heading,
        content.pricing.heading,
        content.faq?.heading,
      ]);
    });
  });

  describe('given an offer without timeline nor faq', () => {
    const content = withoutSections(makeOfferPageContent(), 'steps', 'faq');

    beforeEach(() => setup(content));

    it('renders neither steps nor questions', () => {
      expect([allByTestId('offer-step'), allByTestId('faq-item')]).toEqual([[], []]);
    });

    it('renders only the headings of the sections it has', () => {
      expect(sectionHeadings()).toEqual([
        content.reasons?.heading,
        content.deliverables?.heading,
        content.pricing.heading,
      ]);
    });
  });

  describe.each([
    ['the workshop offer', ATELIER],
    [
      'a single price line without inclusions',
      makeOfferPageContent({
        pricing: { heading: 'Tarif', lines: [makeOfferPriceLine({ id: 'audit' })] },
      }),
    ],
    [
      'three price lines',
      makeOfferPageContent({
        pricing: {
          heading: 'Tarif',
          lines: [
            makeOfferPriceLine({ id: 'a', name: 'Un', label: '1', terms: 'T1' }),
            makeOfferPriceLine({ id: 'b', name: 'Deux', label: '2', terms: 'T2', includes: ['x'] }),
            makeOfferPriceLine({ id: 'c', name: 'Trois', label: '3', terms: 'T3' }),
          ],
        },
      }),
    ],
  ])('pricing, given %s', (_label, content) => {
    beforeEach(() => setup(content));

    it('renders one card per price line with its name, label, terms and inclusions, in order', () => {
      const cards = allByTestId('offer-price-line');
      expect(cards).toHaveLength(content.pricing.lines.length);
      expect(
        cards.map((card) => ({
          name: text(byTestId('offer-price-name', card)),
          label: text(byTestId('offer-price-label', card)),
          terms: text(byTestId('offer-price-terms', card)),
          includes: allByTestId('offer-price-include', card).map((item) => text(item)),
        })),
      ).toEqual(
        content.pricing.lines.map(({ name, label, terms, includes }) => ({
          name,
          label,
          terms,
          includes: includes ?? [],
        })),
      );
    });
  });
});
