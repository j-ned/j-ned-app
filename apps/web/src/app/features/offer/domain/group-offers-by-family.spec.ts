import { makeOfferSummary, offerSummaryOf } from '../testing/offer-builders';
import { groupOffersByFamily } from './group-offers-by-family';
import { OFFERS } from './offer-catalog.static-data';

describe('groupOffersByFamily', () => {
  it('groups the catalogue into sites then applications, keeping the catalogue order', () => {
    expect(groupOffersByFamily(OFFERS)).toEqual([
      {
        family: 'sites',
        offers: [offerSummaryOf('site-vitrine'), offerSummaryOf('site-atelier')],
      },
      {
        family: 'applications',
        offers: [
          offerSummaryOf('application-metier'),
          offerSummaryOf('refonte-maintenance'),
          offerSummaryOf('renfort-freelance'),
        ],
      },
    ]);
  });

  it('puts sites first even when applications come first, each family in its input order', () => {
    const appA = makeOfferSummary({ family: 'applications', name: 'App A' });
    const siteA = makeOfferSummary({ family: 'sites', name: 'Site A' });
    const appB = makeOfferSummary({ family: 'applications', name: 'App B' });
    const siteB = makeOfferSummary({ family: 'sites', name: 'Site B' });

    const groups = groupOffersByFamily([appA, siteA, appB, siteB]);

    expect(groups.map(({ family, offers }) => [family, offers.map(({ name }) => name)])).toEqual([
      ['sites', ['Site A', 'Site B']],
      ['applications', ['App A', 'App B']],
    ]);
  });

  it.each([
    { missing: 'sites', present: 'applications' },
    { missing: 'applications', present: 'sites' },
  ] as const)('omits the $missing family when no offer belongs to it', ({ present }) => {
    const offers = [
      makeOfferSummary({ family: present, name: 'Une' }),
      makeOfferSummary({ family: present, name: 'Deux' }),
    ];

    const groups = groupOffersByFamily(offers);

    expect(groups.map(({ family }) => family)).toEqual([present]);
    expect(groups[0]?.offers).toEqual(offers);
  });

  it('returns no group for an empty catalogue', () => {
    expect(groupOffersByFamily([])).toEqual([]);
  });

  it('keeps the very summaries it is given', () => {
    const [sites] = groupOffersByFamily(OFFERS);
    expect(sites?.offers[0]).toBe(offerSummaryOf('site-vitrine'));
  });
});
