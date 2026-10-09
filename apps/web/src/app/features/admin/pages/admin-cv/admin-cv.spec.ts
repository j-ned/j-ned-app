import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { NEVER, of, throwError, type Observable } from 'rxjs';
import { AdminCv } from './admin-cv';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { stubAnalyticsGateway } from '@features/analytics/testing/stub-analytics-gateway';
import { CvGateway } from '@features/cv/domain/gateways/cv.gateway';
import { makeCvInfo } from '@features/cv/testing/cv-builders';
import { ToastStore } from '@core/notifications/toast-store';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { captureCrash } from '@shared/testing/capture-crash';
import { pressTestId } from '@shared/testing/press-test-id';
import { settleBounded } from '@shared/testing/settle';
import { answerConfirmDialog, readConfirmDialog } from '@shared/ui/testing/confirm-dialog-page';

function makeCvGateway(overrides: Partial<CvGateway> = {}): CvGateway {
  return {
    upload: () => of(makeCvInfo()),
    delete: () => of(undefined),
    getCurrent: () => of(makeCvInfo()),
    getDownloadUrl: () => '/api/cv/download',
    ...overrides,
  } as CvGateway;
}

async function render(
  gateway: CvGateway,
  analytics: AnalyticsGateway = stubAnalyticsGateway(),
): Promise<{
  fixture: ComponentFixture<AdminCv>;
  host: HTMLElement;
  toast: { add: ReturnType<typeof vi.fn> };
  crash: unknown;
}> {
  const toast = { add: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      { provide: CvGateway, useValue: gateway },
      { provide: AnalyticsGateway, useValue: analytics },
      { provide: ToastStore, useValue: toast },
    ],
  });
  const fixture = TestBed.createComponent(AdminCv);
  const crash = await captureCrash(() => settleBounded(fixture));
  return { fixture, host: fixture.nativeElement as HTMLElement, toast, crash };
}

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, '');

const pdf = (): File => new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' });

async function chooseFile(fixture: ComponentFixture<AdminCv>, file: File): Promise<void> {
  const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
    'app-file-dropzone input[type="file"]',
  );
  if (input) {
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new Event('change'));
  }
  await settleBounded(fixture);
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 7, 10, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AdminCv: suppression confirmée', () => {
  async function renderCurrent(): Promise<{
    fixture: ComponentFixture<AdminCv>;
    host: HTMLElement;
    deleteCv: ReturnType<typeof vi.fn>;
  }> {
    const deleteCv = vi.fn((): Observable<void> => of(undefined));
    const { fixture, host } = await render(makeCvGateway({ delete: deleteCv }));
    return { fixture, host, deleteCv };
  }

  it('Given a CV online When its trash is pressed Then the dialog asks to confirm and nothing is deleted yet', async () => {
    const { fixture, host, deleteCv } = await renderCurrent();

    await pressTestId(fixture, 'admin-cv-delete');

    expect({ dialog: readConfirmDialog(host), deleteCalls: deleteCv.mock.calls.length }).toEqual({
      dialog: expect.objectContaining({
        open: true,
        heading: 'Retirer le CV du site\u202f?',
        confirm: 'Retirer le CV',
        cancel: 'Annuler',
      }),
      deleteCalls: 0,
    });
  });

  it.each([
    { answer: 'confirm' as const, deleteCalls: 1 },
    { answer: 'cancel' as const, deleteCalls: 0 },
    { answer: 'escape' as const, deleteCalls: 0 },
  ])(
    'Given the dialog asks about the CV When the user answers $answer Then the gateway deletes $deleteCalls time(s) and the dialog closes',
    async ({ answer, deleteCalls }) => {
      const { fixture, host, deleteCv } = await renderCurrent();
      await pressTestId(fixture, 'admin-cv-delete');

      await answerConfirmDialog(fixture, answer);

      expect({
        open: readConfirmDialog(host).open,
        deleteCalls: deleteCv.mock.calls.length,
      }).toEqual({ open: false, deleteCalls });
    },
  );

  it('Given a confirmed deletion When the CV block disappears Then the focus lands on the page title', async () => {
    const { fixture, host } = await renderCurrent();
    await pressTestId(fixture, 'admin-cv-delete');

    await answerConfirmDialog(fixture, 'confirm');
    const title = byTestId(host, 'admin-page-title');

    expect({
      tag: title?.tagName,
      tabindex: title?.getAttribute('tabindex'),
      focused: title !== null && host.ownerDocument.activeElement === title,
    }).toEqual({ tag: 'H1', tabindex: '-1', focused: true });
  });
});

describe('AdminCv: chargement, erreur et vide', () => {
  const STATE_TEST_IDS = [
    'admin-cv-loading',
    'load-error',
    'empty-state',
    'admin-cv-current',
  ] as const;

  const present = (host: HTMLElement): readonly string[] =>
    STATE_TEST_IDS.filter((testId) => byTestId(host, testId) !== null);

  it.each([
    { state: 'loading', stream: NEVER, shown: 'admin-cv-loading' },
    {
      state: 'failed',
      stream: throwError(() => new Error('down')),
      shown: 'load-error',
    },
    { state: 'empty', stream: of(null), shown: 'empty-state' },
    { state: 'loaded', stream: of(makeCvInfo()), shown: 'admin-cv-current' },
  ])(
    'Given the current CV is $state When the page renders Then only $shown is shown',
    async ({ stream, shown }) => {
      const { host, crash } = await render(makeCvGateway({ getCurrent: () => stream }));

      expect({ crash, present: present(host) }).toEqual({ crash: null, present: [shown] });
    },
  );

  it('Given the current CV is loading Then the placeholder is announced as a status', async () => {
    const { host } = await render(makeCvGateway({ getCurrent: () => NEVER }));

    expect(byTestId(host, 'admin-cv-loading')?.getAttribute('role')).toBe('status');
  });

  it('Given the current CV failed to load Then the error state replaces the toast', async () => {
    const { toast } = await render(
      makeCvGateway({ getCurrent: () => throwError(() => new Error('down')) }),
    );

    expect(toast.add).not.toHaveBeenCalled();
  });

  it('Given the current CV failed to load When Réessayer is pressed Then it is requested again and shown', async () => {
    const getCurrent = vi
      .fn<CvGateway['getCurrent']>()
      .mockReturnValueOnce(throwError(() => new Error('down')))
      .mockReturnValue(of(makeCvInfo()));
    const { fixture, host } = await render(makeCvGateway({ getCurrent }));

    const crash = await captureCrash(() => pressTestId(fixture, 'load-error-retry'));

    expect({ crash, calls: getCurrent.mock.calls.length, present: present(host) }).toEqual({
      crash: null,
      calls: 2,
      present: ['admin-cv-current'],
    });
  });

  it('Given no CV online When the page renders Then the drawn empty state is stamped « Aucun CV » and no cartouche is shown', async () => {
    const { host } = await render(makeCvGateway({ getCurrent: () => of(null) }));

    expect({
      stamp: testIdText(host, 'empty-state-stamp'),
      cartouche: byTestId(host, 'cartouche-title'),
    }).toEqual({ stamp: 'Aucun CV', cartouche: null });
  });
});

describe('AdminCv: cartouche « CV en ligne »', () => {
  const online = (): CvGateway =>
    makeCvGateway({
      getCurrent: () =>
        of(
          makeCvInfo({
            fileName: 'cvNedellecJulien.pdf',
            fileSize: 77_824,
            uploadedAt: '2026-09-19T10:00:00.000Z',
          }),
        ),
    });

  const rowsOf = (host: HTMLElement): readonly { label: string; value: string }[] =>
    [...host.querySelectorAll('[data-testid="cartouche-row"]')].map((row) => ({
      label: testIdText(row, 'cartouche-label'),
      value: testIdText(row, 'cartouche-value'),
    }));

  it('Given a CV online downloaded 3 times When the page renders Then the page header holds the cartouche of the file', async () => {
    const { host } = await render(
      online(),
      stubAnalyticsGateway({ getCvDownloadCount: () => of(3) }),
    );
    const title = byTestId(host, 'cartouche-title');

    expect({
      title: testIdText(host, 'cartouche-title'),
      reference: testIdText(host, 'cartouche-reference'),
      rows: rowsOf(host),
      inPageHeader:
        title !== null &&
        byTestId(host, 'admin-page-title')?.closest('header') === title.closest('header'),
    }).toEqual({
      title: 'CV en ligne',
      reference: 'cvNedellecJulien.pdf',
      rows: [
        { label: 'Mis en ligne', value: '19 sept. 2026' },
        { label: 'Taille', value: '76 Ko' },
        { label: 'Téléchargé', value: '3 fois en 30\u00a0j' },
      ],
      inPageHeader: true,
    });
  });

  it('Given today is 7 October 2026 When the page renders Then the downloads are counted over the last 30 days', async () => {
    const getCvDownloadCount = vi.fn<AnalyticsGateway['getCvDownloadCount']>(() => of(0));

    await render(online(), stubAnalyticsGateway({ getCvDownloadCount }));

    expect(getCvDownloadCount.mock.calls).toEqual([['2026-09-07', '2026-10-07']]);
  });

  it('Given the download count fails When the page renders Then the CV stays shown with its count marked unavailable, without alert nor toast', async () => {
    const { host, toast, crash } = await render(
      online(),
      stubAnalyticsGateway({ getCvDownloadCount: () => throwError(() => new Error('down')) }),
    );

    expect({
      crash,
      downloads: rowsOf(host).find((row) => row.label === 'Téléchargé')?.value,
      current: byTestId(host, 'admin-cv-current') !== null,
      alert: byTestId(host, 'load-error'),
      toasts: toast.add.mock.calls.length,
    }).toEqual({ crash: null, downloads: 'indisponible', current: true, alert: null, toasts: 0 });
  });
});

describe('AdminCv: actions sur le CV en ligne', () => {
  it('Given a CV online When the page renders Then « Ouvrir le PDF » opens a new tab safely and says so', async () => {
    const { host } = await render(makeCvGateway());
    const link = byTestId(host, 'admin-cv-view');

    expect({
      tag: link?.tagName,
      href: link?.getAttribute('href'),
      target: link?.getAttribute('target'),
      rel: link?.getAttribute('rel'),
      name: normalized(link),
      hidden: normalized(link?.querySelector('.sr-only')),
    }).toEqual({
      tag: 'A',
      href: '/api/cv/download',
      target: '_blank',
      rel: 'noopener noreferrer',
      name: 'Ouvrir le PDF (nouvel onglet)',
      hidden: '(nouvel onglet)',
    });
  });

  it('Given a CV online When the page renders Then its removal reads « Retirer le CV du site… »', async () => {
    const { host } = await render(makeCvGateway());

    expect(normalized(byTestId(host, 'admin-cv-delete'))).toBe('Retirer le CV du site…');
  });
});

describe('AdminCv: téléversement', () => {
  it.each([
    { state: 'a CV online', current: makeCvInfo(), heading: 'Remplacer le fichier' },
    { state: 'no CV', current: null, heading: 'Mettre un CV en ligne' },
  ])(
    'Given $state When the page renders Then the upload section is titled « $heading »',
    async ({ current, heading }) => {
      const { host } = await render(makeCvGateway({ getCurrent: () => of(current) }));
      const title = byTestId(host, 'admin-cv-upload-heading');

      expect({ tag: title?.tagName, text: normalized(title) }).toEqual({
        tag: 'H2',
        text: heading,
      });
    },
  );

  it('Given a chosen PDF When the upload button is shown, then pressed while the server answers Then it reads « Mettre en ligne », then « Mise en ligne… »', async () => {
    const upload = vi.fn(() => NEVER);
    const { fixture, host } = await render(makeCvGateway({ upload }));
    await chooseFile(fixture, pdf());
    const idle = normalized(byTestId(host, 'admin-cv-upload'));

    await pressTestId(fixture, 'admin-cv-upload');

    expect({
      idle,
      pending: normalized(byTestId(host, 'admin-cv-upload')),
      uploads: upload.mock.calls.length,
    }).toEqual({ idle: 'Mettre en ligne', pending: 'Mise en ligne…', uploads: 1 });
  });

  it('Given a chosen PDF When the upload succeeds Then the file is sent, the page says so and shows the new CV', async () => {
    const file = pdf();
    const upload = vi.fn<CvGateway['upload']>(() => of(makeCvInfo()));
    const getCurrent = vi
      .fn<CvGateway['getCurrent']>()
      .mockReturnValueOnce(of(null))
      .mockReturnValue(of(makeCvInfo({ fileName: 'nouveau.pdf' })));
    const { fixture, host, toast } = await render(makeCvGateway({ upload, getCurrent }));
    await chooseFile(fixture, file);

    await pressTestId(fixture, 'admin-cv-upload');

    expect({
      sent: upload.mock.calls.map(([sentFile]) => sentFile),
      toasts: toast.add.mock.calls.map(([message]) => message),
      reference: testIdText(host, 'cartouche-reference'),
      uploadButton: byTestId(host, 'admin-cv-upload'),
    }).toEqual({
      sent: [file],
      toasts: [{ severity: 'success', detail: 'CV mis en ligne' }],
      reference: 'nouveau.pdf',
      uploadButton: null,
    });
  });

  it('Given a chosen PDF When the upload succeeds Then the dropzone no longer shows the sent file', async () => {
    const { fixture, host } = await render(makeCvGateway());
    await chooseFile(fixture, pdf());
    const chosen = byTestId(host, 'file-dropzone-replace') !== null;

    await pressTestId(fixture, 'admin-cv-upload');

    expect({
      chosen,
      replace: byTestId(host, 'file-dropzone-replace'),
      trigger: byTestId(host, 'file-dropzone-trigger') !== null,
    }).toEqual({ chosen: true, replace: null, trigger: true });
  });

  it('Given a file that is not a PDF When it is chosen Then the page refuses it and offers no upload', async () => {
    const { fixture, host, toast } = await render(makeCvGateway());

    await chooseFile(fixture, new File(['x'], 'photo.png', { type: 'image/png' }));

    expect({
      toasts: toast.add.mock.calls.map(([message]) => message),
      uploadButton: byTestId(host, 'admin-cv-upload'),
    }).toEqual({
      toasts: [{ severity: 'error', detail: 'Seuls les fichiers PDF sont acceptés.' }],
      uploadButton: null,
    });
  });
});

describe('AdminCv: fichier refusé', () => {
  it('Given a file that is not a PDF When it is chosen Then the dropzone empties and offers the picker again', async () => {
    const { fixture, host } = await render(makeCvGateway());

    await chooseFile(fixture, new File(['PK'], 'lettre.docx', { type: 'application/msword' }));

    expect({
      replace: byTestId(host, 'file-dropzone-replace'),
      trigger: byTestId(host, 'file-dropzone-trigger') !== null,
      name: normalized(host).includes('lettre.docx'),
    }).toEqual({ replace: null, trigger: true, name: false });
  });

  it('Given a PDF chosen then a refused file When the page renders Then no upload is offered for the earlier PDF', async () => {
    const { fixture, host } = await render(makeCvGateway());
    await chooseFile(fixture, pdf());

    await chooseFile(fixture, new File(['PK'], 'lettre.docx', { type: 'application/msword' }));

    expect(byTestId(host, 'admin-cv-upload')).toBeNull();
  });
});

describe('AdminCv: en-tête de page', () => {
  it('Given a 76 Ko PDF uploaded on 19 September 2026 When the page renders Then its single h1 is « CV » under the overline « PDF · 76 Ko · mis en ligne le 19 sept. 2026 »', async () => {
    const { host } = await render(
      makeCvGateway({
        getCurrent: () =>
          of(
            makeCvInfo({
              fileSize: 77_824,
              mimeType: 'application/pdf',
              uploadedAt: '2026-09-19T10:00:00.000Z',
            }),
          ),
      }),
    );

    expect({
      overline: testIdText(host, 'admin-page-overline'),
      title: testIdText(host, 'admin-page-title'),
      headings: host.querySelectorAll('h1').length,
    }).toEqual({
      overline: 'PDF · 76 Ko · mis en ligne le 19 sept. 2026',
      title: 'CV',
      headings: 1,
    });
  });
});
