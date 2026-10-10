import { OFFER_PAGES } from '@features/offer/domain/offer-pages.static-data';
import { OFFER_PRICES } from '@features/offer/domain/offer-prices.static-data';
import { formatEur } from '@features/offer/domain/format-eur';
import { STATIC_HERO } from '@features/home/infra/data/home.static-data';
import { STATIC_BIOGRAPHY } from '@features/profile/infra/data/profile.static-data';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { routes } from './app.routes';
import { EDITORIAL_SOURCES, editorialTexts } from './testing/editorial-sources';

const aboutDescription = (): string =>
  String(routes.find((route) => route.path === 'about')?.data?.['seo']?.description ?? '');

const occurrencesOf = (text: string, part: string): number => text.split(part).length - 1;

const FORBIDDEN_IDENTITIES: readonly (readonly [string, RegExp])[] = [
  ["« aujourd'hui développeur »", /aujourd'hui développeur/iu],
  ["« aujourd'hui tourneur CN en »", /aujourd'hui tourneur CN en/iu],
  ['« Je suis tourneur CN »', /Je suis tourneur CN/iu],
  ['« puis développeur »', /puis développeur/iu],
  ['« métallurgie »', /métallurgie/iu],
  ['a career length', /(vingt|20)[\s\u00a0\u202f]ans/iu],
];

describe('one identity across the site', () => {
  it.each([
    ['the home lead', (): string => STATIC_HERO.lead],
    ['the about lead', (): string => STATIC_BIOGRAPHY.lead],
    ['the workshop offer subtitle', (): string => OFFER_PAGES['site-atelier'].hero.subtitle],
    ['the about meta description', aboutDescription],
  ])('%s tells the journey exactly once, in its single wording', (_place, textOf) => {
    expect(occurrencesOf(textOf(), SITE_IDENTITY.journey)).toBe(1);
  });

  describe.each(FORBIDDEN_IDENTITIES)('never publishes %s', (_label, pattern) => {
    it.each(EDITORIAL_SOURCES)('in %s', (name, source) => {
      expect(
        editorialTexts(source, name)
          .filter(({ text }) => pattern.test(text))
          .map(({ path }) => path),
      ).toEqual([]);
    });
  });

  it('announces on the home lead the showcase site price read from the offer prices', () => {
    expect(
      occurrencesOf(STATIC_HERO.lead, formatEur(OFFER_PRICES['site-vitrine'].creationEur)),
    ).toBe(1);
  });
});
