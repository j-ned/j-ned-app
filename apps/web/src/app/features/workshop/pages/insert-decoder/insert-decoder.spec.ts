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
import { INSERT_DECODER_COPY } from '../../application/insert-decoder-copy';
import type { InsertGuideDto } from '../../infra/insert-guide.types';
import { InsertDecoder } from './insert-decoder';

const API = '/api';
const KYOCERA_B1 =
  'https://asia.kyocera.com/products/cuttingtools/wp-content/uploads/2015/02/B-Turning-Indexable.pdf';

const GUIDE = (enabled: boolean): InsertGuideDto => ({
  enabled,
  entries: [],
  version: 1,
  updatedAt: '2026-10-26T10:00:00.000Z',
});

type GuideAnswer = (request: TestRequest) => void;

const SWITCHED_ON: GuideAnswer = (request) => request.flush(GUIDE(true));

const collapsed = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').trim();

describe('InsertDecoder', () => {
  let http: HttpTestingController;
  let fixture: ComponentFixture<InsertDecoder>;
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

  const render = async (code?: string, answer: GuideAnswer = SWITCHED_ON): Promise<void> => {
    fixture = TestBed.createComponent(InsertDecoder);
    if (code !== undefined) fixture.componentRef.setInput('code', code);
    fixture.detectChanges();
    answer(http.expectOne(`${API}/workshop-guide`));
    await fixture.whenStable();
    fixture.detectChanges();
  };

  describe('Given the insert guide switched on', () => {
    it('When the page is rendered without code Then its single h1 names the decoder, the lead speaks familiarly, and no result nor error is shown', async () => {
      await render();

      expect({
        h1: [...host().querySelectorAll('h1')].map((h1) => h1.getAttribute('data-testid')),
        title: collapsed(one('insert-decoder-title')),
        lead: collapsed(one('insert-decoder-lead')),
        result: one('insert-decoder-result'),
        error: one('insert-decoder-error'),
        status: responseInit.status,
      }).toEqual({
        h1: ['insert-decoder-title'],
        title: INSERT_DECODER_COPY.heading,
        lead: INSERT_DECODER_COPY.lead,
        result: null,
        error: null,
        status: 200,
      });
      expect(INSERT_DECODER_COPY.lead).toMatch(/\b(tu|te|t'|ta|tes|Tape)\b/u);
    });

    it('When the page is rendered Then the code field is labelled, named « code » and the form falls back to a GET on the decoder page', async () => {
      await render();
      const input = one('insert-decoder-code') as HTMLInputElement;
      const form = input.closest('form');

      expect({
        label: collapsed(host().querySelector(`label[for="${input.id}"]`)),
        name: input.name,
        type: input.type,
        method: form?.getAttribute('method'),
        action: form?.getAttribute('action'),
        submit: one('insert-decoder-submit')?.getAttribute('type'),
      }).toEqual({
        label: INSERT_DECODER_COPY.codeLabel,
        name: 'code',
        type: 'text',
        method: 'get',
        action: '/atelier/decodeur',
        submit: 'submit',
      });
    });

    it('When a code is asked in the url Then the field shows it', async () => {
      await render('CNMG120408');

      expect((one('insert-decoder-code') as HTMLInputElement).value).toBe('CNMG120408');
    });

    it('When CNMG 120408 is asked Then a definition list gives, per position, its rank and label, its code, its meaning and its sources', async () => {
      await render('CNMG120408');
      const result = one('insert-decoder-result');

      expect(result?.tagName).toBe('DL');
      expect(
        all('insert-decoder-position').map((item) => ({
          term: collapsed(item.querySelector('dt')),
          details: [...item.querySelectorAll('dd')].map(collapsed),
        })),
      ).toEqual([
        {
          term: '1 Forme C',
          details: [
            'Losange 80°',
            'Sources\u00a0: Mitsubishi Materials, Turning Insert Identification, Insert Shape ; Kyocera, Turning Indexable Inserts, p. B1, Identification System',
          ],
        },
        expect.objectContaining({ term: '2 Dépouille N' }),
        expect.objectContaining({ term: '3 Tolérance M' }),
        expect.objectContaining({ term: '4 Fixation et brise-copeaux G' }),
        expect.objectContaining({ term: '5 Taille 12' }),
        expect.objectContaining({ term: '6 Épaisseur 04' }),
        {
          term: '7 Rayon de bec 08',
          details: [
            'Rayon de bec 0,8\u00a0mm',
            'Sources\u00a0: Mitsubishi Materials, Turning Insert Identification, Corner Radius ; Kyocera, Turning Indexable Inserts, p. B1, Identification System',
          ],
        },
      ]);
    });

    it('When a code is decoded Then each source is a link to the cited page', async () => {
      await render('CNMG120408');
      const links = [...(one('insert-decoder-result')?.querySelectorAll('a') ?? [])];

      expect(links.filter((link) => link.getAttribute('href') === KYOCERA_B1)).toHaveLength(7);
      expect(links.every((link) => (link.getAttribute('href') ?? '').startsWith('https://'))).toBe(
        true,
      );
    });

    it('When a code is decoded Then the result sits in a polite live region and is headed by the formatted code', async () => {
      await render('cnmg 120408-pm');
      const live = one('insert-decoder-live');

      expect({
        live: live?.getAttribute('aria-live'),
        holdsResult: live?.contains(one('insert-decoder-result')) ?? false,
        heading: collapsed(one('insert-decoder-heading')),
        headingTag: one('insert-decoder-heading')?.tagName,
      }).toEqual({
        live: 'polite',
        holdsResult: true,
        heading: `${INSERT_DECODER_COPY.resultHeading} CNMG 120408-PM`,
        headingTag: 'H2',
      });
    });

    it('When the code carries a maker suffix Then it is shown as is, as proper to the maker, without decoding', async () => {
      await render('CNMG 120408-PM');
      const suffix = one('insert-decoder-suffix');

      expect({
        term: collapsed(suffix?.querySelector('dt')),
        detail: collapsed(suffix?.querySelector('dd')),
        inList: one('insert-decoder-result')?.contains(suffix) ?? false,
      }).toEqual({
        term: `${INSERT_DECODER_COPY.suffixLabel} PM`,
        detail: INSERT_DECODER_COPY.suffixMeaning,
        inList: true,
      });
      expect(INSERT_DECODER_COPY.suffixLabel).toMatch(/propre au fabricant/u);
    });

    it('When the code has no suffix Then no suffix line is shown', async () => {
      await render('CNMG120408');

      expect(one('insert-decoder-suffix')).toBeNull();
    });

    it.each([
      ['COMG120408', '2ᵉ position, «\u00a0O\u00a0»\u00a0: dépouille inconnue.'],
      [
        'CNMG 432',
        '«\u00a0432\u00a0» est une taille en pouces (code ANSI)\u00a0: ce décodeur ne lit que le code ISO métrique.',
      ],
      ['CNMG12', 'Code incomplet\u00a0: il manque la 6ᵉ position (épaisseur).'],
    ])(
      'When %s is asked Then an alert says what is wrong, the field is marked invalid and described by it, and no result is shown',
      async (code, message) => {
        await render(code);
        const error = one('insert-decoder-error');
        const input = one('insert-decoder-code');

        expect({
          role: error?.getAttribute('role'),
          message: collapsed(error),
          invalid: input?.getAttribute('aria-invalid'),
          describedBy: (input?.getAttribute('aria-describedby') ?? '')
            .split(' ')
            .includes(error?.id ?? '-'),
          result: one('insert-decoder-result'),
          status: responseInit.status,
        }).toEqual({
          role: 'alert',
          message,
          invalid: 'true',
          describedBy: true,
          result: null,
          status: 200,
        });
      },
    );

    it.each([
      ['cnmg 120408', 'CNMG120408'],
      ['CNMG 120408-PM', 'CNMG120408PM'],
      ['   ', null],
    ])(
      'When %j is typed and the form submitted Then the url keeps the normalized code, replacing the history entry',
      async (typed, code) => {
        await render();
        const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
        const input = one('insert-decoder-code') as HTMLInputElement;
        input.value = typed;
        input.dispatchEvent(new Event('input'));
        input.closest('form')?.dispatchEvent(new Event('submit', { cancelable: true }));
        await fixture.whenStable();

        expect(navigate).toHaveBeenCalledWith([], { queryParams: { code }, replaceUrl: true });
      },
    );
  });

  it('Given the insert guide switched off When the page is rendered on the server Then it answers 404 with the not-found page, and nothing of the decoder', async () => {
    await render('CNMG120408', (request) => request.flush(GUIDE(false)));

    expect({
      status: responseInit.status,
      notFound: one('not-found-title') !== null,
      title: one('insert-decoder-title'),
      result: one('insert-decoder-result'),
    }).toEqual({ status: 404, notFound: true, title: null, result: null });
  });

  it.each([404, 503])(
    'Given the guide read answering %i When the page is rendered on the server Then it answers 503',
    async (status) => {
      await render('CNMG120408', (request) =>
        request.flush(null, { status, statusText: 'Failed' }),
      );

      expect(responseInit.status).toBe(503);
    },
  );
});
