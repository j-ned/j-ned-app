import { ComponentFixture, DeferBlockBehavior, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ContactGateway } from '@features/contact/domain/gateways/contact.gateway';
import { stubContactGateway } from '@features/contact/testing/stub-contact-gateway';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import type { OfferPageContent, OfferSummary } from '../domain/models/offer.model';
import { OFFERS } from '../domain/offer-catalog.static-data';
import { OFFER_PAGES } from '../domain/offer-pages.static-data';
import {
  makeOfferDemo,
  makeOfferPageContent,
  makeOfferPriceLine,
  offerSummaryOf,
  withoutSections,
} from '../testing/offer-builders';
import { OfferPage } from './offer-page';

const ATELIER: OfferPageContent = OFFER_PAGES['site-atelier'];
const NBSP = '\u00a0';
const DEMO_IMAGE_SIZES =
  '(min-width: 80rem) 54rem, (min-width: 64rem) calc(100vw - 26rem), (min-width: 40rem) calc(100vw - 3rem), calc(100vw - 2rem)';

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

      // Titre du premier écran : un fondu d'entrée (opacité nulle) le masque au premier rendu.
      it('shows the title on the first render, without any entrance animation', () => {
        const title = byTestId('offer-title');
        expect(title).not.toBeNull();
        expect(title?.className).not.toMatch(/\banimate-/);
      });

      // Sous-titre = élément LCP de la page : un fondu d'entrée repousse le LCP à la fin de l'animation.
      it('shows the subtitle on the first render, without any entrance animation', () => {
        const subtitle = byTestId('offer-subtitle');
        expect(subtitle).not.toBeNull();
        expect(subtitle?.className).not.toMatch(/\banimate-/);
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

    describe('examples', () => {
      const demos = (): HTMLElement[] => allByTestId('offer-demo');
      const inDemo = (id: string): HTMLElement | null => {
        const demo = demos()[0];
        return demo ? byTestId(id, demo) : null;
      };

      it('states under its heading that the demo sites are fictitious companies', () => {
        expect(text(sectionOf('offer-examples')?.querySelector('header p'))).toBe(
          'Des sites de démonstration, construits pour montrer le résultat. Les entreprises sont fictives.',
        );
      });

      it('presents the single demo by its fictitious name, its sector, a Démo badge and what it illustrates', () => {
        expect(demos()).toHaveLength(1);
        expect({
          tag: demos()[0]?.tagName,
          list: demos()[0]?.parentElement === byTestId('offer-examples'),
          name: text(inDemo('cartouche-title')),
          sector: text(inDemo('cartouche-reference')),
          badge: text(inDemo('offer-demo-badge')),
          illustrates: text(inDemo('offer-demo-illustrates')),
        }).toEqual({
          tag: 'LI',
          list: true,
          name: 'Delaunay Précision',
          sector: "Atelier d'usinage CN à Élancourt",
          badge: 'Démo',
          illustrates: ATELIER.examples?.items[0]?.illustrates,
        });
      });

      it('links to the demo site in a new tab, naming the demo and the new tab after the visible label', () => {
        const link = inDemo('offer-demo-link');
        expect({
          tag: link?.tagName,
          href: link?.getAttribute('href'),
          target: link?.getAttribute('target'),
          rel: link?.getAttribute('rel'),
          ariaLabel: link?.getAttribute('aria-label') ?? null,
          name: text(link),
        }).toEqual({
          tag: 'A',
          href: 'https://site-industrie.nedellec-julien.fr/',
          target: '_blank',
          rel: 'noopener',
          ariaLabel: null,
          name: `Voir la démo${NBSP}: Delaunay Précision, nouvel onglet`,
        });
      });

      it('makes the link the only interactive element of the card', () => {
        expect(demos()[0]?.querySelectorAll('a, button')).toHaveLength(1);
      });

      it('offers the AVIF variants, then the WebP ones, ahead of the fallback image of a picture', () => {
        const avif = inDemo('offer-demo-source-avif');
        const picture = avif?.parentElement;
        expect(picture?.tagName).toBe('PICTURE');
        expect(
          Array.from(picture?.children ?? []).map((child) => child.getAttribute('data-testid')),
        ).toEqual(['offer-demo-source-avif', 'offer-demo-source-webp', 'offer-demo-image']);
        expect(
          ['offer-demo-source-avif', 'offer-demo-source-webp'].map((id) => {
            const source = inDemo(id);
            return {
              type: source?.getAttribute('type'),
              srcset: source?.getAttribute('srcset'),
              sizes: source?.getAttribute('sizes'),
            };
          }),
        ).toEqual([
          {
            type: 'image/avif',
            srcset:
              '/demos/site-industrie-20261005-800.avif 800w, /demos/site-industrie-20261005-1600.avif 1600w',
            sizes: DEMO_IMAGE_SIZES,
          },
          {
            type: 'image/webp',
            srcset:
              '/demos/site-industrie-20261005-800.webp 800w, /demos/site-industrie-20261005-1600.webp 1600w',
            sizes: DEMO_IMAGE_SIZES,
          },
        ]);
      });

      it('loads the fallback image lazily, never as a priority, at its intrinsic size and with the alt of the content', () => {
        const image = inDemo('offer-demo-image');
        expect({
          tag: image?.tagName,
          src: image?.getAttribute('src'),
          width: image?.getAttribute('width'),
          height: image?.getAttribute('height'),
          loading: image?.getAttribute('loading'),
          fetchpriority: image?.getAttribute('fetchpriority'),
          srcset: image?.getAttribute('srcset') ?? null,
          sizes: image?.getAttribute('sizes') ?? null,
          alt: image?.getAttribute('alt'),
        }).toEqual({
          tag: 'IMG',
          src: '/demos/site-industrie-20261005-1600.webp',
          width: '1600',
          height: '1000',
          loading: 'lazy',
          fetchpriority: 'auto',
          srcset: null,
          sizes: null,
          alt: ATELIER.examples?.items[0]?.image.alt,
        });
      });
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
      ['offer-demo', (c: OfferPageContent): string | undefined => c.examples?.heading],
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
        content.examples?.heading,
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
        content.examples?.heading,
        content.pricing.heading,
      ]);
    });
  });

  describe('given an offer without examples', () => {
    const content = withoutSections(makeOfferPageContent(), 'examples');

    beforeEach(() => setup(content));

    it('renders neither the examples section nor any demo', () => {
      expect([allByTestId('offer-examples'), allByTestId('offer-demo')]).toEqual([[], []]);
    });

    it('goes straight from the deliverables to the timeline', () => {
      expect(sectionHeadings()).toEqual([
        content.reasons?.heading,
        content.deliverables?.heading,
        content.steps?.heading,
        content.pricing.heading,
        content.faq?.heading,
      ]);
    });
  });

  describe.each([
    ['a single demo', [makeOfferDemo()]],
    [
      'two demos',
      [
        makeOfferDemo({
          id: 'a',
          name: 'Alpha',
          sector: 'Boulangerie',
          illustrates: 'La carte du jour.',
          url: 'https://alpha.example.test/',
          image: { file: '/demos/alpha-20260102', alt: 'Accueil Alpha' },
        }),
        makeOfferDemo({
          id: 'b',
          name: 'Bravo',
          sector: 'Garage',
          illustrates: 'La prise de rendez-vous.',
          url: 'https://bravo.example.test/',
          image: { file: '/demos/bravo-20260203', alt: 'Accueil Bravo' },
        }),
      ],
    ],
  ])('examples, given %s', (_label, items) => {
    const content = makeOfferPageContent({
      examples: { heading: 'Exemples', lead: 'Des démos.', items },
    });

    beforeEach(() => setup(content));

    it('renders one card per demo with its name, sector, badge, sentence, link and image, in order', () => {
      expect(
        allByTestId('offer-demo').map((demo) => ({
          name: text(byTestId('cartouche-title', demo)),
          sector: text(byTestId('cartouche-reference', demo)),
          badge: text(byTestId('offer-demo-badge', demo)),
          illustrates: text(byTestId('offer-demo-illustrates', demo)),
          href: byTestId('offer-demo-link', demo)?.getAttribute('href'),
          linkName: text(byTestId('offer-demo-link', demo)),
          src: byTestId('offer-demo-image', demo)?.getAttribute('src'),
          alt: byTestId('offer-demo-image', demo)?.getAttribute('alt'),
        })),
      ).toEqual(
        items.map(({ name, sector, illustrates, url, image }) => ({
          name,
          sector,
          badge: 'Démo',
          illustrates,
          href: url,
          linkName: `Voir la démo${NBSP}: ${name}, nouvel onglet`,
          src: `${image.file}-1600.webp`,
          alt: image.alt,
        })),
      );
    });

    it('states the lead of the content under the section heading', () => {
      expect(text(sectionOf('offer-examples')?.querySelector('header p'))).toBe('Des démos.');
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
