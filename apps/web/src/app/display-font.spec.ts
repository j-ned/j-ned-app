/// <reference types="node" />
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const STYLES_PATH = 'src/styles.css';
const INDEX_PATH = 'src/index.html';
const FONTS_DIR = 'public/fonts';
const DISPLAY_FONT_FILE = 'bricolage-grotesque-1.001-latin-opsz48-wdth100-wght600-800.woff2';
const DISPLAY_FONT_LICENSE = 'OFL-bricolage-grotesque.txt';

const STYLES = readFileSync(STYLES_PATH, 'utf8');

const normalized = (value: string): string => value.replace(/\s+/g, ' ').trim();

const declarationsOf = (block: string): Readonly<Record<string, string>> =>
  Object.fromEntries(
    block
      .split(';')
      .map((declaration) => declaration.trim())
      .filter((declaration) => declaration.includes(':'))
      .map((declaration) => {
        const separator = declaration.indexOf(':');
        return [
          declaration.slice(0, separator).trim(),
          normalized(declaration.slice(separator + 1)),
        ];
      }),
  );

const FONT_FACES = STYLES.split('@font-face')
  .slice(1)
  .map((segment) => declarationsOf(segment.slice(segment.indexOf('{') + 1, segment.indexOf('}'))));

const faceOf = (family: string): Readonly<Record<string, string>> | undefined =>
  FONT_FACES.find((face) => face['font-family'] === `'${family}'`);

const fileHeader = (path: string): string | null =>
  existsSync(path) ? readFileSync(path).subarray(0, 4).toString('latin1') : null;

const textOf = (path: string): string | null =>
  existsSync(path) ? readFileSync(path, 'utf8') : null;

const typeScriptSourcesUnder = (root: string): readonly string[] =>
  readdirSync(root, { recursive: true, encoding: 'utf8' })
    .map((path) => path.replaceAll('\\', '/'))
    .filter((path) => path.endsWith('.ts') && !path.endsWith('.spec.ts'))
    .sort()
    .map((path) => `${root}/${path}`);

const WIDTH_CLASS = /font-stretch-|\[font-stretch:/;

describe('display font', () => {
  it('Given the stylesheet When the browser loads the heading face Then Bricolage Grotesque comes from its versioned file, 600 to 800, swapped, at a single width', () => {
    expect(faceOf('Bricolage Grotesque')).toEqual({
      'font-family': "'Bricolage Grotesque'",
      src: `url('/fonts/${DISPLAY_FONT_FILE}') format('woff2')`,
      'font-weight': '600 800',
      'font-display': 'swap',
    });
  });

  it('Given the heading font is not loaded yet When the browser draws a heading Then the fallback is a bold Arial resized to the Bricolage Grotesque metrics', () => {
    expect(faceOf('Bricolage Grotesque Fallback')).toEqual({
      'font-family': "'Bricolage Grotesque Fallback'",
      src: "local('Arial Bold'), local('Arial-BoldMT'), local('Liberation Sans Bold'), local('LiberationSans-Bold')",
      'font-weight': '600 800',
      'size-adjust': '97.56%',
      'ascent-override': '95.32%',
      'descent-override': '27.67%',
      'line-gap-override': '0%',
    });
  });

  it('Given the stylesheet When its font faces are listed Then only the three families and their two fallbacks are declared', () => {
    expect(FONT_FACES.map((face) => face['font-family']).sort()).toEqual([
      "'Bricolage Grotesque Fallback'",
      "'Bricolage Grotesque'",
      "'JN Mono'",
      "'JN Sans Fallback'",
      "'JN Sans'",
      "'JN Sans'",
    ]);
  });

  it('Given the theme When a heading uses the display font Then it asks for Bricolage Grotesque, then its fallback, then the system font', () => {
    const [, value = ''] = /--font-display:\s*([^;]+);/.exec(STYLES) ?? [];

    expect(normalized(value)).toBe(
      "'Bricolage Grotesque', 'Bricolage Grotesque Fallback', system-ui, sans-serif",
    );
  });

  it('Given the stylesheet When headings are styled Then no width is requested, the font having a single one', () => {
    expect(STYLES.match(/font-stretch/g) ?? []).toEqual([]);
  });

  it.each([STYLES_PATH, INDEX_PATH])(
    'Given %s When it is read Then it no longer names the previous heading font',
    (path) => {
      expect(readFileSync(path, 'utf8').match(/archivo/gi) ?? []).toEqual([]);
    },
  );

  it('Given the static page When the browser parses its head Then it preloads only the heading font file, as a cross-origin woff2', () => {
    const preloads = [
      ...new DOMParser()
        .parseFromString(readFileSync(INDEX_PATH, 'utf8'), 'text/html')
        .querySelectorAll('link[rel="preload"][as="font"]'),
    ];

    expect(
      preloads.map((link) => ({
        href: link.getAttribute('href'),
        type: link.getAttribute('type'),
        crossorigin: link.getAttribute('crossorigin'),
      })),
    ).toEqual([{ href: `/fonts/${DISPLAY_FONT_FILE}`, type: 'font/woff2', crossorigin: '' }]);
  });

  it('Given the public fonts folder When it is listed Then it holds the three families and their two licences, nothing else', () => {
    expect(readdirSync(FONTS_DIR).sort()).toEqual([
      DISPLAY_FONT_LICENSE,
      'OFL-ibm-plex.txt',
      DISPLAY_FONT_FILE,
      'jn-mono-2.3-latin-500.woff2',
      'jn-sans-3.201-latin-wght-italic.woff2',
      'jn-sans-3.201-latin-wght.woff2',
    ]);
  });

  it('Given the heading font file When its header is read Then it is a woff2 font', () => {
    expect(fileHeader(`${FONTS_DIR}/${DISPLAY_FONT_FILE}`)).toBe('wOF2');
  });

  it('Given the heading font licence When it is read Then it is the SIL Open Font License of the Bricolage Grotesque project', () => {
    const licence = textOf(`${FONTS_DIR}/${DISPLAY_FONT_LICENSE}`) ?? '';

    expect({
      openFontLicense: licence.includes('SIL OPEN FONT LICENSE Version 1.1'),
      copyright: licence.includes('The Bricolage Grotesque Project Authors'),
    }).toEqual({ openFontLicense: true, copyright: true });
  });

  it('Given the application templates When their classes are read Then none asks for a font width', () => {
    const offenders = typeScriptSourcesUnder('src/app').flatMap((path) =>
      readFileSync(path, 'utf8')
        .split('\n')
        .flatMap((line, index) => (WIDTH_CLASS.test(line) ? [`${path}:${index + 1}`] : [])),
    );

    expect(offenders).toEqual([]);
  });
});
