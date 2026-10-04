import { Component } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import type { OfferSlug } from '../domain/models/offer.model';
import {
  OFFERS,
  OFFER_FAMILY_LABELS,
  OFFER_FAMILY_LEADS,
} from '../domain/offer-catalog.static-data';
import { offerPath } from '../domain/offer-path';
import { offerSummaryOf } from '../testing/offer-builders';
import { OfferCatalogue } from './offer-catalogue';

@Component({ template: '' })
class BlankPage {}

describe('OfferCatalogue', () => {
  let fixture: ComponentFixture<OfferCatalogue>;

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const byTestId = (id: string, root: ParentNode = host()): HTMLElement | null =>
    root.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  const allByTestId = (id: string, root: ParentNode = host()): HTMLElement[] =>
    Array.from(root.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));
  // Normalise les blancs de mise en forme du template sans toucher aux espaces insécables.
  const text = (el: Element | null | undefined): string =>
    (el?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').trim();
  const familySections = (): HTMLElement[] =>
    Array.from(host().querySelectorAll<HTMLElement>('section[aria-labelledby]'));
  const headingOf = (section: HTMLElement): Element | null =>
    host().querySelector(`[id="${section.getAttribute('aria-labelledby') ?? ''}"]`);
  const cardOf = (name: string): HTMLElement | undefined =>
    allByTestId('offer-card').find((card) => text(byTestId('cartouche-title', card)) === name);
  const rowOf = (name: string): HTMLElement | undefined =>
    allByTestId('offer-row').find((row) => text(byTestId('offer-row-name', row)) === name);
  const namesOf = (...slugs: readonly OfferSlug[]): string[] =>
    slugs.map((slug) => offerSummaryOf(slug).name);
  const entriesOf = (section: HTMLElement): { cards: string[]; rows: string[] } => ({
    cards: allByTestId('offer-card', section).map((card) =>
      text(byTestId('cartouche-title', card)),
    ),
    rows: allByTestId('offer-row', section).map((row) => text(byTestId('offer-row-name', row))),
  });

  const SITES = (['site-vitrine', 'site-atelier'] as const).map(offerSummaryOf);
  const APPLICATIONS = (
    ['application-metier', 'refonte-maintenance', 'renfort-freelance'] as const
  ).map(offerSummaryOf);

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          OFFERS.map(({ slug }) => ({ path: offerPath(slug).slice(1), component: BlankPage })),
        ),
      ],
    });
    fixture = TestBed.createComponent(OfferCatalogue);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('titles the page with a single h1 stating the catalogue promise', () => {
    const headings = host().querySelectorAll('h1');
    expect(headings).toHaveLength(1);
    expect(text(headings[0])).toBe('Cinq offres, un tarif annoncé avant de commencer.');
  });

  it('introduces the catalogue with its lead under the h1', () => {
    const lead = byTestId('offer-catalogue-lead');
    const follows =
      host()
        .querySelector('h1')
        ?.compareDocumentPosition(lead ?? host()) ?? 0;
    expect(follows & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(text(lead)).toBe(
      'Un site pour être trouvé, ou une application pour travailler mieux. Chaque offre précise ce qui est livré, en combien de temps et à quel prix.',
    );
  });

  it('gives each family section the lead of its family', () => {
    expect(
      familySections().map((section) => allByTestId('offer-family-lead', section).map(text)),
    ).toEqual([[OFFER_FAMILY_LEADS.sites], [OFFER_FAMILY_LEADS.applications]]);
  });

  it('leaves the main, banner and contentinfo landmarks to the application shell', () => {
    expect(host().querySelectorAll('main, header, footer')).toHaveLength(0);
  });

  it('groups the offers in a sites section then an applications section, each named by its h2', () => {
    const sections = familySections();

    expect(
      sections.map((section) => {
        const heading = headingOf(section);
        return { tag: heading?.tagName, label: text(heading) };
      }),
    ).toEqual([
      { tag: 'H2', label: OFFER_FAMILY_LABELS.sites },
      { tag: 'H2', label: OFFER_FAMILY_LABELS.applications },
    ]);
    expect(new Set(sections.map((section) => section.getAttribute('aria-labelledby'))).size).toBe(
      2,
    );
  });

  it('shows the sites as cards and the applications as rows, five offers with the workshop one', () => {
    expect(familySections().map(entriesOf)).toEqual([
      { cards: namesOf('site-vitrine', 'site-atelier'), rows: [] },
      {
        cards: [],
        rows: namesOf('application-metier', 'refonte-maintenance', 'renfort-freelance'),
      },
    ]);
  });

  describe.each(SITES.map((summary) => [summary.slug, summary] as const))(
    'card of %s',
    (slug, summary) => {
      it('frames the offer in a cartouche titled with its name, over its audience and price teaser', () => {
        const card = cardOf(summary.name);
        expect(card).toBeDefined();
        expect(text(byTestId('cartouche-reference', card))).toBe(summary.audience);
        expect(text(byTestId('offer-card-price', card))).toBe(summary.priceTeaser);
      });

      it('links to the offer page with a named link', () => {
        const link = byTestId('offer-card-link', cardOf(summary.name));
        expect(link?.tagName).toBe('A');
        expect(link?.getAttribute('href')).toBe(offerPath(slug));
        expect(text(link) || link?.getAttribute('aria-label')).toBeTruthy();
      });

      it('navigates to the offer page when its link is clicked', async () => {
        byTestId('offer-card-link', cardOf(summary.name))?.click();
        await fixture.whenStable();
        expect(TestBed.inject(Router).url).toBe(offerPath(slug));
      });
    },
  );

  describe.each(APPLICATIONS.map((summary) => [summary.slug, summary] as const))(
    'row of %s',
    (slug, summary) => {
      it('states the offer name, its promise and its price teaser', () => {
        const row = rowOf(summary.name);
        expect(row).toBeDefined();
        expect(text(byTestId('offer-row-promise', row))).toBe(summary.promise);
        expect(text(byTestId('offer-row-price', row))).toBe(summary.priceTeaser);
      });

      it('makes the whole row a single link to the offer page', () => {
        const row = rowOf(summary.name);
        const link = byTestId('offer-row-link', row);
        expect(row?.querySelectorAll('a')).toHaveLength(1);
        expect(link?.tagName).toBe('A');
        expect(link?.getAttribute('href')).toBe(offerPath(slug));
        expect(
          ['offer-row-name', 'offer-row-promise', 'offer-row-price'].map((id) =>
            Boolean(link?.contains(byTestId(id, row))),
          ),
        ).toEqual([true, true, true]);
        expect(text(link)).not.toBe('');
      });

      it('navigates to the offer page when the row is clicked', async () => {
        byTestId('offer-row-link', rowOf(summary.name))?.click();
        await fixture.whenStable();
        expect(TestBed.inject(Router).url).toBe(offerPath(slug));
      });
    },
  );

  it('nests no link inside another link', () => {
    expect(host().querySelectorAll('a a')).toHaveLength(0);
  });

  it('states the VAT mention of the business under the prices', () => {
    expect(text(byTestId('offer-vat-mention'))).toBe(SITE_IDENTITY.business.vatMention);
  });
});
