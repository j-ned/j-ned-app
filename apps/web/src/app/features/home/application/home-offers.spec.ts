import { Component } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import {
  OFFERS,
  OFFER_FAMILY_LABELS,
  OFFER_FAMILY_LEADS,
} from '@features/offer/domain/offer-catalog.static-data';
import { offerPath } from '@features/offer/domain/offer-path';
import { offerSummaryOf } from '@features/offer/testing/offer-builders';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { HOME_OFFERS_CATALOGUE_LINK, HOME_OFFERS_HEADING } from '../domain/home-offers.static-data';
import { HomeOffers } from './home-offers';

@Component({ template: '' })
class BlankPage {}

const FEATURED = OFFERS.filter((offer) => offer.featuredOnHome);

describe('HomeOffers', () => {
  let fixture: ComponentFixture<HomeOffers>;

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const byTestId = (id: string, root: ParentNode = host()): HTMLElement | null =>
    root.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  const allByTestId = (id: string, root: ParentNode = host()): HTMLElement[] =>
    Array.from(root.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));
  const text = (el: Element | null | undefined): string =>
    (el?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').trim();
  const section = (): HTMLElement | null => byTestId('home-offers');
  const cardNames = (root: ParentNode = host()): string[] =>
    allByTestId('offer-card', root).map((card) => text(byTestId('cartouche-title', card)));
  const rowNames = (root: ParentNode = host()): string[] =>
    allByTestId('offer-row', root).map((row) => text(byTestId('offer-row-name', row)));
  const linkOf = (name: string): HTMLAnchorElement | null => {
    const card = allByTestId('offer-card').find(
      (el) => text(byTestId('cartouche-title', el)) === name,
    );
    if (card) return card.querySelector<HTMLAnchorElement>('[data-testid="offer-card-link"]');
    const row = allByTestId('offer-row').find(
      (el) => text(byTestId('offer-row-name', el)) === name,
    );
    return row?.querySelector<HTMLAnchorElement>('[data-testid="offer-row-link"]') ?? null;
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'offres', component: BlankPage },
          ...OFFERS.map(({ slug }) => ({ path: offerPath(slug).slice(1), component: BlankPage })),
        ]),
      ],
    });
    fixture = TestBed.createComponent(HomeOffers);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('is a section labelled by its h2, stating what can be done for the visitor', () => {
    const labelledBy = section()?.getAttribute('aria-labelledby') ?? '';
    const heading = host().querySelector(`[id="${labelledBy}"]`);
    expect(section()?.tagName).toBe('SECTION');
    expect(heading?.tagName).toBe('H2');
    expect(text(heading)).toBe(HOME_OFFERS_HEADING);
    expect(HOME_OFFERS_HEADING).toBe('Ce que je peux faire pour vous.');
  });

  it('shows the offers featured on the home page only, the workshop offer staying in the catalogue', () => {
    expect([...cardNames(), ...rowNames()]).toEqual(FEATURED.map((offer) => offer.name));
  });

  it('groups the offers by family, sites first, each family titled by its label', () => {
    const families = allByTestId('home-offers-family');
    expect(families.map((family) => text(family.querySelector('h3')))).toEqual([
      OFFER_FAMILY_LABELS.sites,
      OFFER_FAMILY_LABELS.applications,
    ]);
  });

  it('presents the sites as cards and the applications as rows, like the catalogue', () => {
    const [sites, applications] = allByTestId('home-offers-family');
    expect(cardNames(sites)).toEqual([offerSummaryOf('site-vitrine').name]);
    expect(rowNames(sites)).toEqual([]);
    expect(rowNames(applications)).toEqual(
      (['application-metier', 'refonte-maintenance', 'renfort-freelance'] as const).map(
        (slug) => offerSummaryOf(slug).name,
      ),
    );
    expect(cardNames(applications)).toEqual([]);
  });

  describe.each(FEATURED.map((offer) => [offer.name, offer] as const))('%s', (name, offer) => {
    it('links to its offer page', () => {
      expect(linkOf(name)?.getAttribute('href')).toBe(offerPath(offer.slug));
    });

    it('leads to its offer page when clicked', async () => {
      linkOf(name)?.click();
      await fixture.whenStable();
      expect(TestBed.inject(Router).url).toBe(offerPath(offer.slug));
    });
  });

  describe('link to the catalogue', () => {
    const catalogueLink = (): HTMLElement | null => byTestId('home-offers-catalogue-link');

    it('is a named link to the offer catalogue', () => {
      expect(catalogueLink()?.tagName).toBe('A');
      expect(catalogueLink()?.getAttribute('href')).toBe('/offres');
      expect(text(catalogueLink())).toBe(HOME_OFFERS_CATALOGUE_LINK);
      expect(HOME_OFFERS_CATALOGUE_LINK).toBe('Voir toutes les offres et leurs prix');
    });

    it('leads to the offer catalogue when clicked', async () => {
      catalogueLink()?.click();
      await fixture.whenStable();
      expect(TestBed.inject(Router).url).toBe('/offres');
    });
  });

  it('introduces each family with its lead, sites first', () => {
    const leads = allByTestId('home-offers-family').map((family) =>
      allByTestId('home-offers-family-lead', family).map((lead) => text(lead)),
    );
    expect(leads).toEqual([[OFFER_FAMILY_LEADS.sites], [OFFER_FAMILY_LEADS.applications]]);
  });

  it('states the VAT mention under the prices', () => {
    expect(text(byTestId('home-offers-vat-mention'))).toBe(SITE_IDENTITY.business.vatMention);
  });

  it('emits no landmark of its own', () => {
    expect(host().querySelectorAll('main, header, footer')).toHaveLength(0);
  });
});
