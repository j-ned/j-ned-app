import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { NEVER, of, throwError, type Observable } from 'rxjs';
import { AdminCv } from './admin-cv';
import { CvGateway } from '@features/cv/domain/gateways/cv.gateway';
import { makeCvInfo } from '@features/cv/testing/cv-builders';
import { ToastStore } from '@shared/ui/toast-store';
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

async function render(gateway: CvGateway): Promise<{
  fixture: ComponentFixture<AdminCv>;
  host: HTMLElement;
  toast: { add: ReturnType<typeof vi.fn> };
  crash: unknown;
}> {
  const toast = { add: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      { provide: CvGateway, useValue: gateway },
      { provide: ToastStore, useValue: toast },
    ],
  });
  const fixture = TestBed.createComponent(AdminCv);
  const crash = await captureCrash(() => settleBounded(fixture));
  return { fixture, host: fixture.nativeElement as HTMLElement, toast, crash };
}

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
    'admin-cv-empty',
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
    { state: 'empty', stream: of(null), shown: 'admin-cv-empty' },
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
});

describe('AdminCv: textes en français et lien annoncé', () => {
  const normalized = (element: Element | null | undefined): string =>
    (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, '');

  const pdf = (): File => new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' });

  async function chooseFile(fixture: ComponentFixture<AdminCv>): Promise<void> {
    (fixture.componentInstance as unknown as { selectCvFile: (file: File) => void }).selectCvFile(
      pdf(),
    );
    await settleBounded(fixture);
  }

  it('Given no CV online When the page renders Then it says so in French', async () => {
    const { host } = await render(makeCvGateway({ getCurrent: () => of(null) }));

    expect(normalized(byTestId(host, 'admin-cv-empty'))).toBe('Aucun CV en ligne');
  });

  it('Given a CV online When the page renders Then its date is introduced as the upload day', async () => {
    const { host } = await render(makeCvGateway());

    expect(normalized(byTestId(host, 'admin-cv-uploaded-at-label'))).toBe('Mis en ligne le');
  });

  it('Given a chosen PDF When the upload button is shown, then pressed while the server answers Then it reads « Mettre en ligne », then « Mise en ligne… »', async () => {
    const upload = vi.fn(() => NEVER);
    const { fixture, host } = await render(makeCvGateway({ upload }));
    await chooseFile(fixture);
    const idle = normalized(byTestId(host, 'admin-cv-upload'));

    await pressTestId(fixture, 'admin-cv-upload');

    expect({
      idle,
      pending: normalized(byTestId(host, 'admin-cv-upload')),
      uploads: upload.mock.calls.length,
    }).toEqual({ idle: 'Mettre en ligne', pending: 'Mise en ligne…', uploads: 1 });
  });

  it('Given a CV online When the page renders Then its link opens a new tab safely and says so', async () => {
    const { host } = await render(makeCvGateway());
    const link = byTestId(host, 'admin-cv-view');

    expect({
      tag: link?.tagName,
      target: link?.getAttribute('target'),
      rel: link?.getAttribute('rel'),
      name: normalized(link),
      hidden: normalized(link?.querySelector('.sr-only')),
    }).toEqual({
      tag: 'A',
      target: '_blank',
      rel: 'noopener noreferrer',
      name: 'Voir le CV (nouvel onglet)',
      hidden: '(nouvel onglet)',
    });
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
