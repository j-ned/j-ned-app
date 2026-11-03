import { inputBinding, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { testIdText } from '@shared/testing/by-test-id';
import { settle } from '@shared/testing/settle';
import type { ShareRow } from '../audience-view';
import { AudienceShareTable } from './audience-share-table';

const ROWS: readonly ShareRow[] = [
  { label: '/', count: 1500, share: '43\u00a0%', width: 100 },
  { label: '/blog', count: 6, share: '11\u00a0%', width: 25 },
  { label: 'Autres', count: 11, share: '20\u00a0%', width: 46 },
];

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, '');

async function renderTable(rows: readonly ShareRow[]): Promise<HTMLElement> {
  const fixture = TestBed.createComponent(AudienceShareTable, {
    bindings: [
      inputBinding('heading', () => 'Pages les plus vues'),
      inputBinding('headingId', () => 'audience-pages-heading'),
      inputBinding('labelHeader', () => 'Page'),
      inputBinding('unitLabel', () => 'Vues'),
      inputBinding('rows', () => rows),
    ],
  });
  await settle(fixture);
  return fixture.nativeElement as HTMLElement;
}

describe('AudienceShareTable', () => {
  it('Given page rows When the table renders Then each row shows its label, count and share', async () => {
    const host = await renderTable(ROWS);

    expect(
      [...host.querySelectorAll<HTMLElement>('[data-testid="share-row"]')].map((row) => {
        return {
          label: testIdText(row, 'share-label'),
          count: testIdText(row, 'share-count'),
          share: testIdText(row, 'share-part'),
        };
      }),
    ).toEqual([
      { label: '/', count: '1\u202f500', share: '43\u00a0%' },
      { label: '/blog', count: '6', share: '11\u00a0%' },
      { label: 'Autres', count: '11', share: '20\u00a0%' },
    ]);
  });

  it('Given no row When the table renders Then the section keeps its heading and says there is nothing yet, without a table', async () => {
    const host = await renderTable([]);

    expect({
      heading: normalized(host.querySelector('h2')),
      empty: testIdText(host, 'share-empty'),
      tables: host.querySelectorAll('table').length,
    }).toEqual({
      heading: 'Pages les plus vues',
      empty: 'Aucune donnée sur la période.',
      tables: 0,
    });
  });
  it('Given rows sharing a label When the period changes Then every row shows and Angular reports no duplicated track key', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const sharingLabel = (count: number): readonly ShareRow[] => [
      { label: 'Autres', count, share: '50\u00a0%', width: 100 },
      { label: 'Autres', count: count - 1, share: '50\u00a0%', width: 90 },
    ];
    const rows = signal(sharingLabel(4));
    const fixture = TestBed.createComponent(AudienceShareTable, {
      bindings: [
        inputBinding('heading', () => 'Provenance'),
        inputBinding('headingId', () => 'audience-referrers-heading'),
        inputBinding('labelHeader', () => 'Source'),
        inputBinding('unitLabel', () => 'Visites'),
        inputBinding('rows', rows),
      ],
    });
    await settle(fixture);

    rows.set(sharingLabel(9));
    await settle(fixture);

    expect({
      rows: (fixture.nativeElement as HTMLElement).querySelectorAll('[data-testid="share-row"]')
        .length,
      duplicatedKeys: warn.mock.calls.some(([message]) => String(message).includes('NG0955')),
    }).toEqual({ rows: 2, duplicatedKeys: false });
    warn.mockRestore();
  });
});
