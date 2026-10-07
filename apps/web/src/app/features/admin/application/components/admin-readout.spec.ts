import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { settle } from '@shared/testing/settle';
import { AdminReadout, type ReadoutItem } from './admin-readout';

const ITEMS: readonly ReadoutItem[] = [
  { label: 'Pages vues', value: '56', unit: '', detail: '1,3 page par session' },
  { label: 'Rebond', value: '88,1', unit: '\u00a0%', detail: '37 sessions sur 42' },
  { label: 'Durée moyenne', value: '22', unit: '\u00a0s', detail: 'par page' },
];

const text = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, '');

async function renderReadout(
  items: readonly ReadoutItem[],
): Promise<{ fixture: ComponentFixture<AdminReadout>; host: HTMLElement }> {
  const fixture = TestBed.createComponent(AdminReadout);
  fixture.componentRef.setInput('items', items);
  await settle(fixture);
  return { fixture, host: fixture.nativeElement as HTMLElement };
}

const readItems = (host: HTMLElement): { label: string; value: string; detail: string }[] =>
  [...host.querySelectorAll('[data-testid="readout-item"]')].map((item) => ({
    label: text(item.querySelector('dt')),
    value: text(item.querySelector('[data-testid="readout-value"]')),
    detail: text(item.querySelector('[data-testid="readout-detail"]')),
  }));

describe('AdminReadout', () => {
  it('Given three figures When the readout renders Then each is a term of one description list with its value, unit and detail', async () => {
    const { host } = await renderReadout(ITEMS);

    expect({
      lists: host.querySelectorAll('dl').length,
      terms: host.querySelectorAll('dl dt').length,
      definitions: host.querySelectorAll('dl dd').length > 0,
      items: readItems(host),
    }).toEqual({
      lists: 1,
      terms: 3,
      definitions: true,
      items: [
        { label: 'Pages vues', value: '56', detail: '1,3 page par session' },
        { label: 'Rebond', value: '88,1\u00a0%', detail: '37 sessions sur 42' },
        { label: 'Durée moyenne', value: '22\u00a0s', detail: 'par page' },
      ],
    });
  });

  it('Given new figures When the input changes Then the readout follows', async () => {
    const { fixture, host } = await renderReadout(ITEMS);

    fixture.componentRef.setInput('items', [
      { label: 'Pages vues', value: '60', unit: '', detail: '1,4 page par session' },
    ]);
    await settle(fixture);

    expect(readItems(host)).toEqual([
      { label: 'Pages vues', value: '60', detail: '1,4 page par session' },
    ]);
  });
});
