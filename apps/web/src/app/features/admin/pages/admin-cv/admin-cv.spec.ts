import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, Subject, throwError, type Observable } from 'rxjs';
import { AdminCv } from './admin-cv';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { stubAnalyticsGateway } from '@features/analytics/testing/stub-analytics-gateway';
import { CvGateway } from '@features/cv/domain/gateways/cv.gateway';
import type { CvInfo } from '@features/cv/domain/models/cv.model';
import { makeCvInfo } from '@features/cv/testing/cv-builders';
import { apiRejection } from '@shared/testing/api-rejection';
import { ToastStore } from '@core/notifications/toast-store';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { captureCrash } from '@shared/testing/capture-crash';
import { pressTestId } from '@shared/testing/press-test-id';
import { settleBounded } from '@shared/testing/settle';
import { forgetTabVisibility, returnToTab } from '@shared/testing/tab-visibility';
import { formatFileSize } from '@shared/format/format-file-size';
import { MAX_UPLOAD_BYTES } from '@shared/upload/upload-limit';
import { readConfirmDialog } from '@shared/ui/testing/confirm-dialog-page';
import {
  deleteThroughDialog,
  presentTestIds,
  readPageTitleFocus,
} from '../../application/testing/admin-list-page';

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

const sizedPdf = (bytes: number): File =>
  new File([new Uint8Array(bytes)], 'cv.pdf', { type: 'application/pdf' });

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

  it.each([
    { answer: 'confirm' as const, deleteCalls: 1 },
    { answer: 'cancel' as const, deleteCalls: 0 },
    { answer: 'escape' as const, deleteCalls: 0 },
  ])(
    'Given the dialog asks about the CV When the user answers $answer Then the gateway deletes $deleteCalls time(s) and the dialog closes',
    async ({ answer, deleteCalls }) => {
      const { fixture, host, deleteCv } = await renderCurrent();
      await deleteThroughDialog(fixture, 'admin-cv-delete', answer);

      expect({
        open: readConfirmDialog(host).open,
        deleteCalls: deleteCv.mock.calls.length,
      }).toEqual({ open: false, deleteCalls });
    },
  );

  it.each([
    {
      given: 'the network cut',
      error: new HttpErrorResponse({ status: 0, url: '/api/cv' }),
      detail:
        "Le CV n'a pas été retiré. La connexion a été coupée\u00a0: vérifie ton réseau, puis réessaie.",
    },
    {
      given: 'a server that does not explain itself',
      error: new HttpErrorResponse({ status: 503, url: '/api/cv' }),
      detail: "Le CV n'a pas été retiré. Réessaie dans un instant.",
    },
    {
      given: 'a refusal the API explains',
      error: new HttpErrorResponse({
        status: 404,
        url: '/api/cv',
        error: { message: 'No CV uploaded' },
      }),
      detail: "Le CV n'a pas été retiré. No CV uploaded.",
    },
  ])(
    'Given $given When a confirmed deletion fails Then the toast says what happened without talking about an upload',
    async ({ error, detail }) => {
      const { fixture, toast } = await render(
        makeCvGateway({ delete: () => throwError(() => error) }),
      );
      await deleteThroughDialog(fixture, 'admin-cv-delete', 'confirm');

      expect(toast.add.mock.calls.map(([message]) => message)).toEqual([
        { severity: 'error', detail },
      ]);
    },
  );

  it('Given a confirmed deletion When the CV block disappears Then the focus lands on the page title', async () => {
    const { fixture, host } = await renderCurrent();

    await deleteThroughDialog(fixture, 'admin-cv-delete', 'confirm');

    expect(readPageTitleFocus(host)).toEqual({ tag: 'H1', tabindex: '-1', focused: true });
  });
});

describe('AdminCv: chargement, erreur et vide', () => {
  const STATE_TEST_IDS = ['load-error', 'empty-state', 'admin-cv-current'] as const;

  const present = (host: HTMLElement): readonly string[] => presentTestIds(host, STATE_TEST_IDS);

  it.each([
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

describe('AdminCv: téléversement', () => {
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

  it('Given an upload in flight When the button is pressed twice before the page re-renders Then the file is sent once', async () => {
    const upload = vi.fn<CvGateway['upload']>(() => new Subject<CvInfo>());
    const { fixture, host } = await render(makeCvGateway({ upload }));
    await chooseFile(fixture, pdf());
    const button = byTestId(host, 'admin-cv-upload');

    button?.click();
    button?.click();
    await settleBounded(fixture);

    expect(upload).toHaveBeenCalledOnce();
  });

  it.each([
    {
      given: 'the network cut',
      error: new HttpErrorResponse({ status: 0, url: '/api/cv/upload' }),
      detail:
        "Le CV n'a pas été mis en ligne. La connexion a été coupée pendant l'envoi : vérifie ton réseau, puis réessaie.",
    },
    {
      given: 'a proxy refusing the PDF without explanation',
      error: new HttpErrorResponse({ status: 503, url: '/api/cv/upload' }),
      detail:
        "Le CV n'a pas été mis en ligne. L'hébergeur a refusé le fichier, sans doute trop lourd\u00a0: allège le PDF, puis réessaie.",
    },
    {
      given: 'an unreadable file the API does not explain',
      error: apiRejection(422),
      detail:
        "Le CV n'a pas été mis en ligne. Le fichier n'est pas un PDF lisible : exporte-le de nouveau, puis réessaie.",
    },
  ])(
    'Given $given When the upload fails Then the toast says what happened and what to do',
    async ({ error, detail }) => {
      const { fixture, toast } = await render(
        makeCvGateway({ upload: () => throwError(() => error) }),
      );
      await chooseFile(fixture, pdf());

      await pressTestId(fixture, 'admin-cv-upload');

      expect(toast.add.mock.calls.map(([message]) => message)).toEqual([
        { severity: 'error', detail },
      ]);
    },
  );

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
  it('Given a PDF chosen then a refused file When the page renders Then no upload is offered for the earlier PDF', async () => {
    const { fixture, host } = await render(makeCvGateway());
    await chooseFile(fixture, pdf());

    await chooseFile(fixture, new File(['PK'], 'lettre.docx', { type: 'application/msword' }));

    expect(byTestId(host, 'admin-cv-upload')).toBeNull();
  });

  it('Given a PDF over 4 MiB When it is chosen Then the page refuses it before any upload and says why', async () => {
    const upload = vi.fn(() => of(makeCvInfo()));
    const { fixture, host, toast } = await render(makeCvGateway({ upload }));

    await chooseFile(fixture, sizedPdf(MAX_UPLOAD_BYTES + 1));

    expect({
      toasts: toast.add.mock.calls.map(([message]) => message),
      uploadButton: byTestId(host, 'admin-cv-upload'),
      trigger: byTestId(host, 'file-dropzone-trigger') !== null,
      uploads: upload.mock.calls.length,
    }).toEqual({
      toasts: [{ severity: 'error', detail: 'Le CV dépasse 4\u00a0Mo.' }],
      uploadButton: null,
      trigger: true,
      uploads: 0,
    });
  });

  it('Given a PDF of exactly 4 MiB When it is chosen Then it can be uploaded', async () => {
    const { fixture, host, toast } = await render(makeCvGateway());

    await chooseFile(fixture, sizedPdf(MAX_UPLOAD_BYTES));

    expect({
      toasts: toast.add.mock.calls.length,
      uploadButton: byTestId(host, 'admin-cv-upload') !== null,
    }).toEqual({ toasts: 0, uploadButton: true });
  });
});

describe('AdminCv: relecture au retour sur l’onglet', () => {
  afterEach(forgetTabVisibility);

  const valueOf = (host: HTMLElement, label: string): string | undefined =>
    [...host.querySelectorAll('[data-testid="cartouche-row"]')]
      .find((row) => testIdText(row, 'cartouche-label') === label)
      ?.querySelector('[data-testid="cartouche-value"]')
      ?.textContent?.trim()
      .replace(/\s+/g, ' ');

  it('Given the CV on screen When it was replaced and downloaded elsewhere and the tab comes back Then the cartouche shows the new CV and count', async () => {
    const getCurrent = vi
      .fn<CvGateway['getCurrent']>()
      .mockReturnValueOnce(of(makeCvInfo({ fileSize: 10_240 })))
      .mockReturnValue(of(makeCvInfo({ fileSize: 204_800 })));
    const getCvDownloadCount = vi
      .fn<AnalyticsGateway['getCvDownloadCount']>()
      .mockReturnValueOnce(of(1))
      .mockReturnValue(of(4));
    const { fixture, host } = await render(
      makeCvGateway({ getCurrent }),
      stubAnalyticsGateway({ getCvDownloadCount }),
    );

    returnToTab();
    await settleBounded(fixture);

    expect({ size: valueOf(host, 'Taille'), downloads: valueOf(host, 'Téléchargé') }).toEqual({
      size: formatFileSize(204_800),
      downloads: '4 fois en 30 j',
    });
  });

  it('Given the CV on screen When the tab comes back Then the CV is reread in the background, the first read not', async () => {
    const getCurrent = vi.fn<CvGateway['getCurrent']>(() => of(makeCvInfo()));
    const { fixture } = await render(makeCvGateway({ getCurrent }));

    returnToTab();
    await settleBounded(fixture);

    expect(getCurrent.mock.calls).toEqual([[{ background: false }], [{ background: true }]]);
  });

  it('Given the CV on screen When the reread on return fails Then the CV stays shown, without an error', async () => {
    const getCurrent = vi
      .fn<CvGateway['getCurrent']>()
      .mockReturnValueOnce(of(makeCvInfo({ fileSize: 10_240 })))
      .mockReturnValue(throwError(() => new Error('down')));
    const { fixture, host } = await render(makeCvGateway({ getCurrent }));

    returnToTab();
    await settleBounded(fixture);

    expect({ size: valueOf(host, 'Taille'), error: byTestId(host, 'load-error') }).toEqual({
      size: formatFileSize(10_240),
      error: null,
    });
  });
});
