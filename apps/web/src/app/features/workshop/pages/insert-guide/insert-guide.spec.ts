import { RESPONSE_INIT } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  type TestRequest,
} from '@angular/common/http/testing';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { API_BASE_URL } from '@shared/api/api-config';
import { INSERT_GUIDE_COPY } from '../../application/insert-guide-copy';
import type { InsertGuideDto } from '../../infra/insert-guide.types';
import { InsertGuide } from './insert-guide';

const API = '/api';

const ENABLED_GUIDE: InsertGuideDto = {
  enabled: true,
  decoderEnabled: true,
  entries: [
    {
      material: 'Laiton fictif',
      operation: 'external-finishing',
      insert: 'LAI-1',
      noseRadius: 0.4,
    },
    { material: 'Acier fictif', operation: 'threading', insert: 'FIL-1', noseRadius: 0.2 },
    {
      material: 'Acier fictif',
      operation: 'external-roughing',
      insert: 'EBA-1',
      noseRadius: 0.8,
      note: 'Remarque fictive.',
    },
  ],
  version: 2,
  updatedAt: '2026-10-26T10:00:00.000Z',
};

type GuideAnswer = (request: TestRequest) => void;

const collapsed = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').trim();

describe('InsertGuide', () => {
  let http: HttpTestingController;
  let fixture: ComponentFixture<InsertGuide>;
  let responseInit: ResponseInit;

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const one = (testId: string): HTMLElement | null =>
    host().querySelector<HTMLElement>(`[data-testid="${testId}"]`);
  const all = (testId: string): HTMLElement[] => [
    ...host().querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`),
  ];

  beforeEach(() => {
    responseInit = { status: 200 };
    TestBed.configureTestingModule({
      providers: [
        { provide: RESPONSE_INIT, useValue: responseInit },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: API },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  const render = async (answer: GuideAnswer, material?: string): Promise<void> => {
    fixture = TestBed.createComponent(InsertGuide);
    if (material !== undefined) fixture.componentRef.setInput('matiere', material);
    fixture.detectChanges();
    const request = http.expectOne(`${API}/workshop-guide`);
    expect(request.request.method).toBe('GET');
    answer(request);
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const serving =
    (guide: InsertGuideDto): GuideAnswer =>
    (request) =>
      request.flush(guide);

  describe('Given the guide switched on with entries', () => {
    it('When the page is rendered Then its single h1 names the guide, followed by the lead and the warning', async () => {
      await render(serving(ENABLED_GUIDE));

      expect({
        h1: [...host().querySelectorAll('h1')].map((h1) => h1.getAttribute('data-testid')),
        title: collapsed(one('insert-guide-title')),
        lead: collapsed(one('insert-guide-lead')),
        disclaimer: collapsed(one('insert-guide-disclaimer')),
        status: responseInit.status,
      }).toEqual({
        h1: ['insert-guide-title'],
        title: 'Guide des plaquettes',
        lead: INSERT_GUIDE_COPY.lead,
        disclaimer: INSERT_GUIDE_COPY.disclaimer,
        status: 200,
      });
    });

    it('When the page is rendered Then the warning says these are Julien’s choices, to adapt, in the familiar form', async () => {
      await render(serving(ENABLED_GUIDE));

      expect(collapsed(one('insert-guide-disclaimer'))).toMatch(
        /^Ce sont mes choix à l'atelier.*adapte-les/u,
      );
    });

    it('When the page is rendered Then a labelled list offers each material once, in alphabetical order, after an empty choice', async () => {
      await render(serving(ENABLED_GUIDE));
      const select = one('insert-guide-material') as HTMLSelectElement;
      const label = host().querySelector(`label[for="${select.id}"]`);

      expect({
        tag: select.tagName,
        label: collapsed(label),
        options: [...select.options].map((option) => [option.value, collapsed(option)]),
      }).toEqual({
        tag: 'SELECT',
        label: 'Matière',
        options: [
          ['', 'Choisis une matière'],
          ['Acier fictif', 'Acier fictif'],
          ['Laiton fictif', 'Laiton fictif'],
        ],
      });
    });

    it('When no material is asked in the url Then the empty choice is selected and no table is shown', async () => {
      await render(serving(ENABLED_GUIDE));
      const select = one('insert-guide-material') as HTMLSelectElement;

      expect([select.value, one('insert-guide-table')]).toEqual(['', null]);
    });

    it('When a known material is asked in the url Then it is selected and its table lists operation, insert, radius in mm and note, in the order of the operations', async () => {
      await render(serving(ENABLED_GUIDE), 'Acier fictif');
      const select = one('insert-guide-material') as HTMLSelectElement;
      const table = one('insert-guide-table');

      expect({
        selected: select.value,
        selectedOptions: [...select.options].filter((option) => option.selected).length,
        serverSelected: [...select.querySelectorAll('option[selected]')].map(collapsed),
        tag: table?.tagName,
        caption: collapsed(table?.querySelector('caption')),
        headers: [...(table?.querySelectorAll('thead th') ?? [])].map((th) => [
          th.getAttribute('scope'),
          collapsed(th),
        ]),
        rows: all('insert-guide-row').map((row) =>
          [...row.querySelectorAll('th, td')].map((cell) => [cell.tagName, collapsed(cell)]),
        ),
      }).toEqual({
        selected: 'Acier fictif',
        selectedOptions: 1,
        serverSelected: ['Acier fictif'],
        tag: 'TABLE',
        caption: 'Plaquettes pour Acier fictif',
        headers: [
          ['col', 'Opération'],
          ['col', 'Plaquette'],
          ['col', 'Rayon de bec'],
          ['col', 'Remarque'],
        ],
        rows: [
          [
            ['TH', 'Ébauche extérieure'],
            ['TD', 'EBA-1'],
            ['TD', '0,8\u00a0mm'],
            ['TD', 'Remarque fictive.'],
          ],
          [
            ['TH', 'Filetage'],
            ['TD', 'FIL-1'],
            ['TD', '0,2\u00a0mm'],
            ['TD', ''],
          ],
        ],
      });
    });

    it('When the table is wider than the screen Then it scrolls inside a focusable region named by its caption, not the page', async () => {
      await render(serving(ENABLED_GUIDE), 'Acier fictif');
      const region = one('insert-guide-table')?.parentElement;
      const labelId = region?.getAttribute('aria-labelledby') ?? '';

      expect({
        role: region?.getAttribute('role'),
        tabindex: region?.getAttribute('tabindex'),
        scrolls: region?.classList.contains('overflow-x-auto'),
        name: labelId === '' ? null : collapsed(host().querySelector(`[id="${labelId}"]`)),
      }).toEqual({
        role: 'region',
        tabindex: '0',
        scrolls: true,
        name: 'Plaquettes pour Acier fictif',
      });
    });

    it('When a row is read Then its operation cell heads the row', async () => {
      await render(serving(ENABLED_GUIDE), 'Acier fictif');

      expect(
        all('insert-guide-row').map((row) => row.querySelector('th')?.getAttribute('scope')),
      ).toEqual(['row', 'row']);
    });

    it('When an unknown material is asked in the url Then nothing selects it, no table is shown and its text is never displayed', async () => {
      await render(serving(ENABLED_GUIDE), 'Matière piégée <b>');
      const select = one('insert-guide-material') as HTMLSelectElement;

      expect({
        selected: select.value,
        table: one('insert-guide-table'),
        echoed: host().textContent?.includes('Matière piégée'),
      }).toEqual({ selected: '', table: null, echoed: false });
    });

    it('When an insert code decodes Then it links to its decoding, its visible code first in the link name, and an undecodable code stays plain text', async () => {
      await render(
        serving({
          ...ENABLED_GUIDE,
          entries: [
            {
              material: 'Inox fictif',
              operation: 'external-roughing',
              insert: 'cnmg 120408-pm',
              noseRadius: 0.8,
            },
            {
              material: 'Inox fictif',
              operation: 'external-finishing',
              insert: 'CNMG 432',
              noseRadius: 0.4,
            },
            { material: 'Inox fictif', operation: 'threading', insert: 'FIL-1', noseRadius: 0.2 },
          ],
        }),
        'Inox fictif',
      );

      expect(
        all('insert-guide-row').map((row) => {
          const cell = row.querySelectorAll('td')[0];
          const link = cell.querySelector('a');
          return {
            text: collapsed(cell),
            href: link?.getAttribute('href') ?? null,
            visible: collapsed(link?.querySelector(':not(.sr-only)')),
          };
        }),
      ).toEqual([
        {
          text: `cnmg 120408-pm${INSERT_GUIDE_COPY.decodeLinkSuffix}`,
          href: '/atelier/decodeur?code=CNMG120408PM',
          visible: 'cnmg 120408-pm',
        },
        { text: 'CNMG 432', href: null, visible: '' },
        { text: 'FIL-1', href: null, visible: '' },
      ]);
    });

    it('When the decoder is switched off Then no insert code is a link, a decodable one stays plain text without the decoding hint', async () => {
      await render(
        serving({
          ...ENABLED_GUIDE,
          decoderEnabled: false,
          entries: [
            {
              material: 'Inox fictif',
              operation: 'external-roughing',
              insert: 'cnmg 120408-pm',
              noseRadius: 0.8,
            },
            { material: 'Inox fictif', operation: 'threading', insert: 'FIL-1', noseRadius: 0.2 },
          ],
        }),
        'Inox fictif',
      );

      expect(
        all('insert-guide-row').map((row) => {
          const cell = row.querySelectorAll('td')[0];
          return { text: collapsed(cell), links: cell.querySelectorAll('a').length };
        }),
      ).toEqual([
        { text: 'cnmg 120408-pm', links: 0 },
        { text: 'FIL-1', links: 0 },
      ]);
    });

    it.each([
      ['a material', 'Laiton fictif', 'Laiton fictif'],
      ['the empty choice', '', null],
    ])(
      'When %s is chosen in the list Then the url keeps it in place of the current address',
      async (_label, value, matiere) => {
        await render(serving(ENABLED_GUIDE), 'Acier fictif');
        const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
        const select = one('insert-guide-material') as HTMLSelectElement;

        select.value = value;
        select.dispatchEvent(new Event('change'));

        expect(navigate.mock.calls).toEqual([[[], { queryParams: { matiere }, replaceUrl: true }]]);
      },
    );
  });

  it('Given the guide switched on without any entry When the page is rendered Then it says the guide is being filled, without list nor table', async () => {
    await render(serving({ ...ENABLED_GUIDE, entries: [] }));

    expect({
      empty: collapsed(one('insert-guide-empty')),
      select: one('insert-guide-material'),
      table: one('insert-guide-table'),
      status: responseInit.status,
    }).toEqual({ empty: 'Guide en cours de remplissage.', select: null, table: null, status: 200 });
  });

  it('Given the guide switched off When the page is rendered on the server Then it answers 404 with the not-found page, and nothing of the guide', async () => {
    await render(serving({ ...ENABLED_GUIDE, enabled: false }), 'Acier fictif');

    expect({
      status: responseInit.status,
      notFound: one('not-found-title') !== null,
      title: one('insert-guide-title'),
      table: one('insert-guide-table'),
      echoed: host().textContent?.includes('EBA-1'),
    }).toEqual({ status: 404, notFound: true, title: null, table: null, echoed: false });
  });

  it.each([404, 503])(
    'Given the API answering %i When the page is rendered on the server Then it answers 503, never an empty 200',
    async (status) => {
      await render((request) => request.flush(null, { status, statusText: 'Failed' }));

      expect([responseInit.status, one('insert-guide-material'), one('not-found-title')]).toEqual([
        503,
        null,
        null,
      ]);
    },
  );
});
