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
        '--theme-primary-text': 'oklch(54% 0.225 277)',
        '--theme-foreground': 'oklch(20% 0.01 286)',
      },
      expected: { primary: 'oklch(54% 0.225 277)', foreground: 'oklch(20% 0.01 286)' },
    },
    {
      label: 'no token resolved',
      tokens: {},
      expected: { primary: 'CanvasText', foreground: 'CanvasText' },
    },
    {
      label: 'only the primary token resolved',
      tokens: { '--theme-primary-text': 'oklch(74.5% 0.16 277)' },
      expected: { primary: 'oklch(74.5% 0.16 277)', foreground: 'CanvasText' },
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
