/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { HOME_WORK_FRAME } from '@features/home/domain/home-hero.static-data';
import { STATIC_HERO } from '@features/home/infra/data/home.static-data';
import { FORBIDDEN_WORDINGS } from '@shared/identity/forbidden-wordings';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
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

describe('one identity across the site', () => {
  it.each([
    ['the home lead', (): string => STATIC_HERO.lead],
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
    ['a word that only contains the letters', 'Cdi5TzDRplmKECE'],
    ['the CNC machining trade', 'Tourneur CNC en journée.'],
  ])('does not mistake %s for the CDI', (_label, text) => {
    const cdi = FORBIDDEN_IDENTITIES.find(([label]) => label === '« CDI »')?.[1];
    expect(cdi?.test(text)).toBe(false);
  });

  // Spec 029 : plus d'activité commerciale. Le cadre « le soir et le week-end » vendait une
  // disponibilité ; il ne doit plus apparaître sur la home ni dans le pied de page.
  it.each([
    ['the home lead', (): string => STATIC_HERO.lead],
    ['the home meta description', homeDescription],
    [
      'the work frame of the home',
      (): string => HOME_WORK_FRAME.rows.map(({ value }) => value).join(' '),
    ],
    ['the footer tagline', (): string => FOOTER_COPY.tagline],
  ])('%s no longer sells an evening and weekend availability', (_place, textOf) => {
    expect(textOf()).not.toMatch(EVENING_AND_WEEKEND);
  });
});
