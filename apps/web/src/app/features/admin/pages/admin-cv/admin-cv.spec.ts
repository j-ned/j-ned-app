import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { of, throwError, type Observable } from 'rxjs';
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
import { MAX_UPLOAD_BYTES } from '@shared/upload/upload-limit';
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
  const STATE_TEST_IDS = ['load-error', 'empty-state', 'admin-cv-current'] as const;

  const present = (host: HTMLElement): readonly string[] =>
    STATE_TEST_IDS.filter((testId) => byTestId(host, testId) !== null);

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
