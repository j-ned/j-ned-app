import { RESPONSE_INIT } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  type TestRequest,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_BASE_URL } from '@shared/api/api-config';
import { WORKSHOP_SPACE } from '../../domain/workshop-space.static-data';
import type { InsertGuideDto } from '../../infra/insert-guide.types';
import { Workshop } from './workshop';

const API = '/api';

const GUIDE = (enabled: boolean): InsertGuideDto => ({
  enabled,
  entries: [],
  version: 1,
  updatedAt: '2026-10-26T10:00:00.000Z',
});

type GuideAnswer = (request: TestRequest) => void;

const SWITCHED_ON: GuideAnswer = (request) => request.flush(GUIDE(true));

const collapsed = (element: Element | null): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').trim();

let responseInit: ResponseInit;

const renderWorkshop = async (answer: GuideAnswer = SWITCHED_ON): Promise<HTMLElement> => {
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
  const fixture = TestBed.createComponent(Workshop);
  fixture.detectChanges();
  const http = TestBed.inject(HttpTestingController);
  answer(http.expectOne(`${API}/workshop-guide`));
  await fixture.whenStable();
  fixture.detectChanges();
  http.verify();
  return fixture.nativeElement as HTMLElement;
};

describe('Workshop', () => {
  it('Given the workshop space When the page is rendered Then its single h1 is the space heading', async () => {
    const host = await renderWorkshop();

    expect(host.querySelectorAll('h1')).toHaveLength(1);
    expect(collapsed(host.querySelector('[data-testid="workshop-title"]'))).toBe(
      WORKSHOP_SPACE.heading,
    );
    expect(host.querySelector('h1')?.getAttribute('data-testid')).toBe('workshop-title');
  });

  it('Given the workshop space When the page is rendered Then the intro shows each paragraph of the space, in order', async () => {
    const host = await renderWorkshop();

    expect(
      [...host.querySelectorAll('[data-testid="workshop-intro"]')].map((paragraph) => [
        paragraph.tagName,
        collapsed(paragraph),
      ]),
    ).toEqual(WORKSHOP_SPACE.intro.map((paragraph) => ['P', paragraph]));
  });

  it('Given the shell owns the landmarks When the page is rendered Then it emits no main, header nor footer and lays itself out on the host', async () => {
    const host = await renderWorkshop();

    expect(host.querySelectorAll('main, header, footer')).toHaveLength(0);
    expect([...host.classList].sort()).toEqual(['block', 'min-h-svh', 'pt-20']);
  });

  it('Given the workshop tools When the page is rendered Then a section is named by its h2, the tools heading', async () => {
    const host = await renderWorkshop();
    const section = host.querySelector('[data-testid="workshop-tools"]');
    const labelId = section?.getAttribute('aria-labelledby') ?? '';
    const label = labelId === '' ? null : host.querySelector(`[id="${labelId}"]`);

    expect([section?.tagName, label?.tagName, collapsed(label)]).toEqual([
      'SECTION',
      'H2',
      WORKSHOP_SPACE.toolsHeading,
    ]);
  });

  it('Given the workshop tools When the page is rendered Then each tool is a card link to its path, with its overline, title and summary', async () => {
    const host = await renderWorkshop();

    expect(
      [...host.querySelectorAll('[data-testid="workshop-tool-card"]')].map((card) => [
        card.tagName,
        card.getAttribute('href'),
        [...card.children].map(collapsed),
      ]),
    ).toEqual(
      WORKSHOP_SPACE.tools.map((tool) => [
        'A',
        tool.path,
        [tool.overline, tool.title, tool.summary],
      ]),
    );
  });

  it('Given the insert guide switched off When the page is rendered Then no tool card nor tools section is shown, and the page still answers', async () => {
    const host = await renderWorkshop((request) => request.flush(GUIDE(false)));

    expect({
      cards: host.querySelectorAll('[data-testid="workshop-tool-card"]').length,
      section: host.querySelector('[data-testid="workshop-tools"]'),
      title: collapsed(host.querySelector('[data-testid="workshop-title"]')),
      status: responseInit.status,
    }).toEqual({ cards: 0, section: null, title: WORKSHOP_SPACE.heading, status: 200 });
  });

  it.each([404, 503])(
    'Given the guide read answering %i When the page is rendered on the server Then it answers 503 and shows no card',
    async (status) => {
      const host = await renderWorkshop((request) =>
        request.flush(null, { status, statusText: 'Failed' }),
      );

      expect([
        responseInit.status,
        host.querySelectorAll('[data-testid="workshop-tool-card"]').length,
      ]).toEqual([503, 0]);
    },
  );
});
