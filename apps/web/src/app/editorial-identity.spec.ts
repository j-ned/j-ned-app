/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { OFFERS } from '@features/offer/domain/offer-catalog.static-data';
import { OFFER_PAGES } from '@features/offer/domain/offer-pages.static-data';
import { OFFER_PRICES } from '@features/offer/domain/offer-prices.static-data';
import { formatEur } from '@features/offer/domain/format-eur';
import type { OfferSummary } from '@features/offer/domain/models/offer.model';
import { toOfferCatalogueSeo } from '@features/offer/offer-seo';
import { HOME_WORK_FRAME } from '@features/home/domain/home-hero.static-data';
import { HOME_FAQ } from '@features/home/domain/home-pitch.static-data';
import { STATIC_HERO } from '@features/home/infra/data/home.static-data';
import { FORBIDDEN_WORDINGS } from '@shared/identity/forbidden-wordings';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import PROFILE_FIXTURE from '../../ci/api-stub/fixtures/profile.json';
import { FOOTER_COPY } from './layout/components/footer/footer.static-data';
import { routes } from './app.routes';
import { EDITORIAL_SOURCES, editorialTexts } from './testing/editorial-sources';

const aboutDescription = (): string =>
  String(routes.find((route) => route.path === 'about')?.data?.['seo']?.description ?? '');

const homeDescription = (): string =>
  String(routes.find((route) => route.path === '')?.data?.['seo']?.description ?? '');

const occurrencesOf = (text: string, part: string): number => text.split(part).length - 1;

const TECHNICAL_VALUE = /^(https?:\/\/|mailto:|tel:|\/)\S*$/u;

const INDEX_HTML = readFileSync('src/index.html', 'utf8');

const IDENTITY_SOURCES: readonly (readonly [string, unknown])[] = [
  ...EDITORIAL_SOURCES,
  ['src/index.html', INDEX_HTML],
];

const FORBIDDEN_IDENTITIES: readonly (readonly [string, RegExp])[] = [
  ...FORBIDDEN_WORDINGS.map(({ label, pattern }) => [`« ${label} »`, pattern] as const),
  ["« aujourd'hui développeur »", /aujourd'hui développeur/iu],
  ["« aujourd'hui tourneur CN en »", /aujourd'hui tourneur CN en/iu],
  ['« Je suis tourneur CN »', /Je suis tourneur CN/iu],
  ['« puis développeur »', /puis développeur/iu],
  ['« 7 jours »', /(?<!\d)7\s+jours\b/u],
  ['« sept jours »', /sept\s+jours/iu],
  ['« jour N »', /\bjours?\s+\d/iu],
  ['« ouvrées »', /ouvrées/iu],
  ['« CDI »', /(?<![\p{L}\p{N}])CDI(?![\p{L}\p{N}])/u],
  ['« recrutez »', /recrutez/iu],
  ['« démarrage sous »', /démarrage\s+sous/iu],
  ['« sur site en »', /sur\s+site\s+en/iu],
  ['« régie »', /(?<!\p{L})r[ée]gie(?!\p{L})/iu],
  ['« temps partiel »', /temps\s+partiel/iu],
];

const EVENING_AND_WEEKEND = /le soir et le week-end/iu;

const EVOLUTION = 'evolution-application';

const summaryOf = (slug: string): OfferSummary | undefined =>
  OFFERS.find((summary) => summary.slug === slug);

const evolutionSeoDescription = (): string => summaryOf(EVOLUTION)?.seo.description ?? '';

describe('one identity across the site', () => {
  it.each([
    ['the home lead', (): string => STATIC_HERO.lead],
    ['the workshop offer subtitle', (): string => OFFER_PAGES['site-atelier'].hero.subtitle],
    ['the about meta description', aboutDescription],
  ])('%s tells the journey exactly once, in its single wording', (_place, textOf) => {
    expect(occurrencesOf(textOf(), SITE_IDENTITY.journey)).toBe(1);
  });

  describe.each(FORBIDDEN_IDENTITIES)('never publishes %s', (_label, pattern) => {
    it.each(IDENTITY_SOURCES)('in %s', (name, source) => {
      expect(
        editorialTexts(source, name)
          .filter(({ text }) => !TECHNICAL_VALUE.test(text) && pattern.test(text))
          .map(({ path }) => path),
      ).toEqual([]);
    });
  });

  it.each([
    ['the CDI', 'Ouvert au CDI en Île-de-France.'],
    ['the CDI before a comma', 'Poste en CDI, temps plein.'],
  ])('flags a sentence that mentions %s', (_label, sentence) => {
    const cdi = FORBIDDEN_IDENTITIES.find(([label]) => label === '« CDI »')?.[1];
    expect(cdi?.test(sentence)).toBe(true);
  });

  it.each([
    ['the Google review link', SITE_IDENTITY.googleReviewUrl],
    ['a word that only contains the letters', 'Cdi5TzDRplmKECE'],
    ['the CNC machining trade', 'Tourneur CNC en journée.'],
  ])('does not mistake %s for the CDI', (_label, text) => {
    const cdi = FORBIDDEN_IDENTITIES.find(([label]) => label === '« CDI »')?.[1];
    expect(cdi?.test(text)).toBe(false);
  });

  it('announces on the home lead the showcase site price read from the offer prices', () => {
    expect(
      occurrencesOf(STATIC_HERO.lead, formatEur(OFFER_PRICES['site-vitrine'].creationEur)),
    ).toBe(1);
  });

  it.each([
    ['the availability', (): string => SITE_IDENTITY.availability],
    ['the home lead', (): string => STATIC_HERO.lead],
    ['the home meta description', homeDescription],
    [
      'the work frame of the home',
      (): string => HOME_WORK_FRAME.rows.map(({ value }) => value).join(' '),
    ],
    ['the home FAQ', (): string => HOME_FAQ.items.map(({ question }) => question).join(' ')],
    ['the footer tagline', (): string => FOOTER_COPY.tagline],
    ['the catalogue meta description', (): string => toOfferCatalogueSeo(OFFERS).description],
    ['the reinforcement subtitle', (): string => OFFER_PAGES['renfort-freelance'].hero.subtitle],
    ['the application evolution meta description', evolutionSeoDescription],
    [
      'the motivation served on the Parcours page',
      (): string => PROFILE_FIXTURE.motivation.description,
    ],
  ])('%s states the evening and weekend frame', (_place, textOf) => {
    expect(textOf()).toMatch(EVENING_AND_WEEKEND);
  });
});
