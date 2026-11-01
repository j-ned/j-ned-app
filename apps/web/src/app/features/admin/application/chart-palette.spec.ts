import { readChartPalette } from './chart-palette';

const TOKENS = ['--theme-primary-text', '--theme-foreground'] as const;

describe('readChartPalette', () => {
  afterEach(() => {
    TOKENS.forEach((token) => document.documentElement.style.removeProperty(token));
  });

  it.each([
    {
      label: 'both tokens resolved',
      tokens: {
        '--theme-primary-text': 'oklch(53.2% 0.178 37)',
        '--theme-foreground': 'oklch(24% 0.03 265)',
      },
      expected: { primary: 'oklch(53.2% 0.178 37)', foreground: 'oklch(24% 0.03 265)' },
    },
    {
      label: 'no token resolved',
      tokens: {},
      expected: { primary: 'CanvasText', foreground: 'CanvasText' },
    },
    {
      label: 'only the primary token resolved',
      tokens: { '--theme-primary-text': 'oklch(76% 0.15 55)' },
      expected: { primary: 'oklch(76% 0.15 55)', foreground: 'CanvasText' },
    },
  ] satisfies readonly {
    label: string;
    tokens: Partial<Record<(typeof TOKENS)[number], string>>;
    expected: { primary: string; foreground: string };
  }[])(
    'Given $label on the root element When the palette is read Then it is $expected',
    ({ tokens, expected }) => {
      Object.entries(tokens).forEach(([token, value]) =>
        document.documentElement.style.setProperty(token, value),
      );

      expect(readChartPalette(document)).toEqual(expected);
    },
  );
});
