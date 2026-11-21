import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ThemeStore } from '@core/theme/theme-store';
import { injectChartTheme, readChartPalette } from './chart-palette';

const TOKENS = ['--theme-primary-text', '--theme-foreground', '--theme-background'] as const;

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

describe('injectChartTheme', () => {
  afterEach(() => {
    TOKENS.forEach((token) => document.documentElement.style.removeProperty(token));
  });

  it('Given the light tokens When the theme switches to dark Then the chart colors are read again', () => {
    const isDark = signal(false);
    TestBed.configureTestingModule({ providers: [{ provide: ThemeStore, useValue: { isDark } }] });
    const root = document.documentElement.style;
    root.setProperty('--theme-foreground', 'oklch(24% 0.03 265)');
    root.setProperty('--theme-background', 'oklch(98% 0.01 90)');
    const theme = TestBed.runInInjectionContext(injectChartTheme);
    const light = theme();

    root.setProperty('--theme-foreground', 'oklch(92% 0.01 90)');
    root.setProperty('--theme-background', 'oklch(18% 0.02 265)');
    isDark.set(true);

    expect({ light, dark: theme() }).toEqual({
      light: {
        line: { primary: 'CanvasText', foreground: 'oklch(24% 0.03 265)' },
        background: 'oklch(98% 0.01 90)',
      },
      dark: {
        line: { primary: 'CanvasText', foreground: 'oklch(92% 0.01 90)' },
        background: 'oklch(18% 0.02 265)',
      },
    });
  });

  it('Given no background token When the theme is read Then the background falls back to the system canvas color', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: ThemeStore, useValue: { isDark: signal(false) } }],
    });

    const theme = TestBed.runInInjectionContext(injectChartTheme);

    expect(theme().background).toBe('Canvas');
  });
});
