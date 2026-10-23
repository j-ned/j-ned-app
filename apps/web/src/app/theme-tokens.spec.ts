/// <reference types="node" />
import { readFileSync } from 'node:fs';

const STYLES = readFileSync('src/styles.css', 'utf8');
const LIGHT_SELECTOR = ':root:not(.app-dark) {';

const normalizedValue = (value: string): string =>
  value.replace(/\s+/g, ' ').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').trim();

const declarationsOf = (css: string, prefix: string): Readonly<Record<string, string>> => {
  const declarations: Record<string, string> = {};
  for (const [, name, value] of css.matchAll(new RegExp(`(${prefix}[\\w-]+):\\s*([^;]+);`, 'g'))) {
    declarations[name] ??= normalizedValue(value);
  }
  return declarations;
};

const [DARK_SOURCE, LIGHT_SOURCE] = STYLES.split(LIGHT_SELECTOR);
const THEMES = {
  light: declarationsOf(LIGHT_SOURCE ?? '', '--theme-'),
  dark: declarationsOf(DARK_SOURCE ?? '', '--theme-'),
} as const;

const pick = (
  declarations: Readonly<Record<string, string>>,
  names: readonly string[],
): Readonly<Record<string, string | undefined>> =>
  Object.fromEntries(names.map((name) => [name, declarations[name]]));

const mix = (percent: number): string =>
  `color-mix(in srgb, var(--theme-foreground) ${percent}%, transparent)`;

const LIGHT_PALETTE = {
  '--theme-background': 'oklch(97% 0.015 70)',
  '--theme-surface': 'oklch(100% 0 0)',
  '--theme-surface-elevated': 'oklch(98.5% 0.01 70)',
  '--theme-foreground': 'oklch(24% 0.03 265)',
  '--theme-muted': 'oklch(45% 0.03 265)',
  '--theme-primary-text': 'oklch(53.2% 0.178 37)',
  '--theme-primary-bg': 'oklch(68% 0.18 48)',
  '--theme-on-primary': 'var(--theme-foreground)',
  '--theme-status-success': 'oklch(48% 0.13 150)',
  '--theme-status-warn': 'oklch(50.2% 0.122 56)',
  '--theme-status-error': 'oklch(50% 0.19 25)',
  '--theme-on-status-success': 'oklch(100% 0 0)',
  '--theme-on-status-error': 'oklch(100% 0 0)',
  '--theme-field': mix(50),
  '--theme-line': mix(12),
  '--theme-line-strong': mix(28),
  '--theme-nav-border': 'var(--theme-line)',
  '--theme-sticker-sage': 'oklch(90.1% 0.081 150)',
  '--theme-on-sticker-sage': 'oklch(35.8% 0.079 150)',
  '--theme-sticker-lavender': 'oklch(91% 0.043 261)',
  '--theme-on-sticker-lavender': 'oklch(36% 0.1 265)',
};

const DARK_PALETTE = {
  '--theme-background': 'oklch(22% 0.03 265)',
  '--theme-surface': 'oklch(27% 0.035 265)',
  '--theme-surface-elevated': 'oklch(31% 0.04 265)',
  '--theme-foreground': 'oklch(96% 0.01 70)',
  '--theme-muted': 'oklch(78% 0.02 265)',
  '--theme-primary-text': 'oklch(76% 0.15 55)',
  '--theme-primary-bg': 'oklch(76% 0.15 55)',
  '--theme-on-primary': 'var(--theme-background)',
  '--theme-status-success': 'oklch(78% 0.15 150)',
  '--theme-status-warn': 'oklch(83% 0.13 85)',
  '--theme-status-error': 'oklch(72% 0.161 22)',
  '--theme-on-status-success': 'var(--theme-background)',
  '--theme-on-status-error': 'var(--theme-background)',
  '--theme-field': mix(38),
  '--theme-line': mix(12),
  '--theme-line-strong': mix(28),
  '--theme-nav-border': 'var(--theme-line)',
  '--theme-sticker-sage': 'oklch(40% 0.08 150)',
  '--theme-on-sticker-sage': 'oklch(94% 0.049 150)',
  '--theme-sticker-lavender': 'oklch(38.1% 0.079 264)',
  '--theme-on-sticker-lavender': 'oklch(92% 0.038 264)',
};

const CODE_ROLES = ['keyword', 'function', 'string', 'number', 'tag', 'comment'] as const;

const LIGHT_CODE = {
  '--theme-code-keyword': 'oklch(51.5% 0.16 40)',
  '--theme-code-function': 'oklch(51% 0.15 280)',
  '--theme-code-string': 'oklch(48.5% 0.12 150)',
  '--theme-code-number': 'oklch(50.5% 0.1 80)',
  '--theme-code-tag': 'oklch(52.5% 0.18 355)',
  '--theme-code-comment': 'oklch(45% 0.03 265)',
};

const DARK_CODE = {
  '--theme-code-keyword': 'oklch(76% 0.15 55)',
  '--theme-code-function': 'oklch(75.5% 0.11 280)',
  '--theme-code-string': 'oklch(73.5% 0.13 150)',
  '--theme-code-number': 'oklch(75% 0.12 90)',
  '--theme-code-tag': 'oklch(76.5% 0.14 355)',
  '--theme-code-comment': 'oklch(78% 0.02 265)',
};

const THEME_TOKEN_NAMES = [
  ...Object.keys(LIGHT_PALETTE),
  '--theme-nav-shadow',
  ...CODE_ROLES.map((role) => `--theme-code-${role}`),
].sort();

const UTILITY_COLOURS = [
  'primary-bg',
  'on-primary',
  'muted',
  'background',
  'foreground',
  'surface',
  'surface-elevated',
  'nav-border',
  'status-success',
  'status-warn',
  'status-error',
  'on-status-success',
  'on-status-error',
  'field',
  'line',
  'line-strong',
  'sticker-sage',
  'on-sticker-sage',
  'sticker-lavender',
  'on-sticker-lavender',
  ...CODE_ROLES.map((role) => `code-${role}`),
];

describe('theme tokens', () => {
  it.each([
    ['light', LIGHT_PALETTE],
    ['dark', DARK_PALETTE],
  ] as const)(
    'Given the %s theme When its tokens are read Then the palette is the one whose contrasts were computed',
    (theme, palette) => {
      expect(pick(THEMES[theme], Object.keys(palette))).toEqual(palette);
    },
  );

  it.each(['light', 'dark'] as const)(
    'Given the %s theme When its tokens are listed Then it declares exactly the shared set, one accent and two sticker colours',
    (theme) => {
      expect(Object.keys(THEMES[theme]).sort()).toEqual(THEME_TOKEN_NAMES);
    },
  );

  it('Given the Tailwind theme When its colours are read Then each utility colour resolves to its theme token', () => {
    expect(declarationsOf(STYLES, '--color-')).toEqual({
      '--color-primary': 'var(--theme-primary-text)',
      ...Object.fromEntries(
        UTILITY_COLOURS.map((name) => [`--color-${name}`, `var(--theme-${name})`]),
      ),
    });
  });
});

describe('syntax highlighting tokens', () => {
  it.each([
    ['light', LIGHT_CODE],
    ['dark', DARK_CODE],
  ] as const)(
    'Given the %s theme When the code roles are read Then each one is the tint measured against both code backgrounds',
    (theme, code) => {
      expect(pick(THEMES[theme], Object.keys(code))).toEqual(code);
    },
  );
});

const utilityBody = (name: string): string =>
  STYLES.split('@utility ').find((chunk) => chunk.startsWith(`${name} {`)) ?? '';

describe('radius tokens', () => {
  it('Given the Tailwind theme When its radii are read Then there is one per kind of shape, from the technical part to the large block', () => {
    expect(declarationsOf(STYLES, '--radius-')).toEqual({
      '--radius-part': '0.5rem',
      '--radius-field': '0.75rem',
      '--radius-card': '1rem',
      '--radius-block': '1.375rem',
    });
  });

  it.each(['form-input', 'app-select'])(
    'Given the %s utility When its corners are read Then it takes the field radius only',
    (utility) => {
      expect(utilityBody(utility).match(/\brounded(-[\w-]+)?/g)).toEqual(['rounded-field']);
    },
  );
});
