import {
  makeConversions,
  makeEventCount,
  makeStatsOverview,
} from '@features/analytics/testing/analytics-builders';
import {
  channelLabel,
  conversionTotals,
  conversionsNote,
  placementLabel,
  toChannelEntries,
  toPlacementEntries,
} from './audience-conversions-view';

describe('conversionTotals', () => {
  it('Given measured conversions When the totals are listed Then forms, direct contacts, profiles, CV, demos and arrivals on the home form are named and counted, in that order', () => {
    const overview = makeStatsOverview({
      cvDownloads: 4,
      conversions: makeConversions({
        contactSubmits: 2,
        contactClicks: 3,
        profileClicks: 1,
        demoClicks: 5,
        contactSectionViews: 6,
      }),
    });

    expect(conversionTotals(overview)).toEqual([
      { name: 'Formulaires envoyés', count: 2 },
      { name: 'Contacts directs', count: 3 },
      { name: 'Profils ouverts', count: 1 },
      { name: 'CV téléchargés', count: 4 },
      { name: 'Démos ouvertes', count: 5 },
      { name: "Arrivées sur le formulaire de l'accueil", count: 6 },
    ]);
  });

  it('Given conversions never measured over the period When the totals are listed Then no zero is shown', () => {
    const overview = makeStatsOverview({
      cvDownloads: 4,
      conversions: makeConversions({ measuredSince: null }),
    });

    expect(conversionTotals(overview)).toEqual([]);
  });
});

describe('conversionsNote', () => {
  it.each([
    { case: 'no figures yet', overview: null, note: '' },
    {
      case: 'conversions measured from the first day of the period',
      overview: makeStatsOverview({
        conversions: makeConversions({ measuredSince: '2026-09-07' }),
      }),
      note: '',
    },
    {
      case: 'conversions measured from a later day',
      overview: makeStatsOverview({
        conversions: makeConversions({ measuredSince: '2026-10-11' }),
      }),
      note: 'Mesurées depuis le 11 octobre 2026.',
    },
    {
      case: 'conversions measured from the first of a month',
      overview: makeStatsOverview({
        conversions: makeConversions({ measuredSince: '2026-10-01' }),
      }),
      note: 'Mesurées depuis le 1er octobre 2026.',
    },
    {
      case: 'conversions never measured over the period',
      overview: makeStatsOverview({ conversions: makeConversions({ measuredSince: null }) }),
      note: 'Conversions non mesurées sur la période.',
    },
  ])('Given $case When the note is written Then it reads « $note »', ({ overview, note }) => {
    expect(conversionsNote(overview, '2026-09-07')).toBe(note);
  });
});

describe('placementLabel', () => {
  it.each([
    ['home', 'Accueil'],
    ['offer_site-vitrine', 'Offre Site vitrine'],
    ['offer_site-atelier', 'Offre Site atelier'],
    ['offer_renfort-freelance', 'Offre Renfort Angular / NestJS'],
    ['offer_ancienne-offre', 'Emplacement inconnu (offer_ancienne-offre)'],
    ['footer', 'Emplacement inconnu (footer)'],
  ])('Given the placement %s When it is named Then it reads « %s »', (entityId, label) => {
    expect(placementLabel(entityId)).toBe(label);
  });
});

describe('channelLabel', () => {
  it.each([
    ['email', 'E-mail'],
    ['phone', 'Téléphone'],
    ['malt', 'Malt'],
    ['discord', 'Discord'],
    ['linkedin', 'LinkedIn'],
    ['github', 'GitHub'],
    ['demo', 'Démos'],
    ['twitter', 'Canal inconnu (twitter)'],
  ])('Given the channel %s When it is named Then it reads « %s »', (entityId, label) => {
    expect(channelLabel(entityId)).toBe(label);
  });
});

describe('detail entries', () => {
  it('Given counts per placement When they are listed Then each keeps its count under its name, in the API order', () => {
    expect(
      toPlacementEntries([
        makeEventCount({ entityId: 'offer_site-vitrine', count: 3 }),
        makeEventCount({ entityId: 'home', count: 1 }),
      ]),
    ).toEqual([
      { name: 'Offre Site vitrine', count: 3 },
      { name: 'Accueil', count: 1 },
    ]);
  });

  it('Given counts per channel When they are listed Then each keeps its count under its name, in the API order', () => {
    expect(
      toChannelEntries([
        makeEventCount({ entityId: 'linkedin', count: 4 }),
        makeEventCount({ entityId: 'email', count: 2 }),
      ]),
    ).toEqual([
      { name: 'LinkedIn', count: 4 },
      { name: 'E-mail', count: 2 },
    ]);
  });
});
