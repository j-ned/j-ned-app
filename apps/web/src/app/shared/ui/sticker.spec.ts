import { Component, input } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { Sticker, type StickerTilt, type StickerTone } from './sticker';

const BASE = [
  'inline-flex',
  'w-fit',
  'items-center',
  'rounded-full',
  'border-2',
  'border-transparent',
  'px-3',
  'py-1',
  'font-display',
  'text-sm',
  'font-bold',
  'leading-tight',
  'forced-colors:border-[CanvasText]',
];

const SAGE = ['bg-sticker-sage', 'text-on-sticker-sage'];

const INTERACTIVE_OR_ROLE =
  'a[href], button, input, select, textarea, summary, h1, h2, h3, h4, h5, h6, [tabindex], [role]';

@Component({
  imports: [Sticker],
  template: `<app-sticker data-testid="sticker">Fait main</app-sticker>`,
})
class UnboundHost {}

@Component({
  imports: [Sticker],
  template: `<app-sticker data-testid="sticker" [tone]="tone()" [tilt]="tilt()"
    >Fait main</app-sticker
  >`,
})
class BoundHost {
  readonly tone = input<StickerTone>('sage');
  readonly tilt = input<StickerTilt>('none');
}

const render = async <T>(
  host: new () => T,
  inputs: Readonly<Record<string, unknown>> = {},
): Promise<{ fixture: ComponentFixture<T>; sticker: HTMLElement }> => {
  const fixture = TestBed.createComponent(host);
  for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
  fixture.detectChanges();
  await fixture.whenStable();
  const sticker = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
    '[data-testid="sticker"]',
  )!;
  return { fixture, sticker };
};

const sorted = (element: HTMLElement): string[] => [...element.classList].sort();

describe('Sticker', () => {
  it('Given no binding When the sticker renders Then it is an upright sage pill showing its projected text', async () => {
    const { sticker } = await render(UnboundHost);

    expect({ text: sticker.textContent?.trim(), classes: sorted(sticker) }).toEqual({
      text: 'Fait main',
      classes: [...BASE, ...SAGE].sort(),
    });
  });

  it.each<[StickerTone, readonly string[]]>([
    ['sage', SAGE],
    ['lavender', ['bg-sticker-lavender', 'text-on-sticker-lavender']],
  ])(
    'Given the %s tone When the sticker renders Then it carries the pill and that colour pair only',
    async (tone, colours) => {
      const { sticker } = await render(BoundHost, { tone });

      expect(sorted(sticker)).toEqual([...BASE, ...colours].sort());
    },
  );

  it.each<[StickerTilt, readonly string[]]>([
    ['none', []],
    ['left', ['-rotate-2']],
    ['right', ['rotate-2']],
  ])(
    'Given the %s tilt When the sticker renders Then it is turned by that static angle only',
    async (tilt, rotation) => {
      const { sticker } = await render(BoundHost, { tilt });

      expect(sorted(sticker)).toEqual([...BASE, ...SAGE, ...rotation].sort());
    },
  );

  it('Given a rendered sticker When its tone and tilt change Then its classes follow', async () => {
    const { fixture, sticker } = await render(BoundHost);

    fixture.componentRef.setInput('tone', 'lavender');
    fixture.componentRef.setInput('tilt', 'left');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(sorted(sticker)).toEqual(
      [...BASE, 'bg-sticker-lavender', 'text-on-sticker-lavender', '-rotate-2'].sort(),
    );
  });

  it('Given a sticker When assistive technologies read it Then it is plain text, never focusable nor given a role', async () => {
    const { sticker } = await render(BoundHost, { tone: 'lavender', tilt: 'right' });

    expect({
      text: sticker.textContent?.trim(),
      attributes: sticker
        .getAttributeNames()
        .filter((name) => name === 'role' || name === 'tabindex' || name.startsWith('aria-')),
      inner: sticker.querySelectorAll(INTERACTIVE_OR_ROLE).length,
    }).toEqual({ text: 'Fait main', attributes: [], inner: 0 });
  });
});
