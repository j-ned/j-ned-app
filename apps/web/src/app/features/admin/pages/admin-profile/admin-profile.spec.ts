import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { NEVER, of, throwError, type Observable } from 'rxjs';
import type { Mock } from 'vitest';
import { ProfileGateway } from '@features/profile/domain/gateways/profile.gateway';
import type {
  ProfileContent,
  ProfileDocument,
} from '@features/profile/domain/models/profile-content.model';
import {
  aHighlight,
  aProfileContent,
  aProfileDocument,
} from '@features/profile/testing/profile-builders';
import { stubProfileGateway } from '@features/profile/testing/stub-profile-gateway';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { apiRejection } from '@shared/testing/api-rejection';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { captureCrash } from '@shared/testing/capture-crash';
import { pressTestId } from '@shared/testing/press-test-id';
import { settle, settleBounded } from '@shared/testing/settle';
import { FileDropzone } from '@shared/ui/file-dropzone';
import { ToastStore } from '@core/notifications/toast-store';
import type { ToastMessage } from '@shared/ui/toast.types';
import { answerConfirmDialog, readConfirmDialog } from '@shared/ui/testing/confirm-dialog-page';
import { unsavedChangesGuard } from '../../application/unsaved-changes-guard';
import { AdminProfile } from './admin-profile';

@Component({ template: '' })
class BlankPage {}

const LOADED = aProfileDocument({ version: 7 });
const WITNESS = aProfileContent();

const CONFLICT =
  'Le parcours a été modifié depuis une autre fenêtre. Rechargez la page pour repartir de la dernière version (vos modifications non enregistrées seront perdues).';
const SAVE_FAILURE = "Le parcours n'a pas pu être enregistré.";
const STORED = '/api/storage/portfolio-storage/profile/portrait-1a2b3c4d.avif';
const SENT = '/api/storage/portfolio-storage/profile/portrait-9f8e7d6c.avif';

type Spies = {
  readonly getProfile: Mock<ProfileGateway['getProfile']>;
  readonly saveProfile: Mock<ProfileGateway['saveProfile']>;
  readonly uploadPortrait: Mock<ProfileGateway['uploadPortrait']>;
  readonly removePortrait: Mock<ProfileGateway['removePortrait']>;
  readonly toast: Mock<ToastStore['add']>;
};

type Editor = Spies & {
  readonly fixture: ComponentFixture<unknown>;
  readonly host: HTMLElement;
  readonly crash: unknown;
};

async function openEditor(overrides: Partial<Omit<Spies, 'toast'>> = {}): Promise<Editor> {
  const spies: Spies = {
    getProfile: vi.fn((): Observable<ProfileDocument> => of(LOADED)),
    saveProfile: vi.fn(
      (content: ProfileContent): Observable<ProfileDocument> =>
        of(aProfileDocument({ version: 8, content })),
    ),
    uploadPortrait: vi.fn(
      (): Observable<ProfileDocument> => of(aProfileDocument({ version: 7, portraitUrl: SENT })),
    ),
    removePortrait: vi.fn((): Observable<void> => of(undefined)),
    toast: vi.fn(),
    ...overrides,
  };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        { path: 'admin/profile', component: AdminProfile, canDeactivate: [unsavedChangesGuard] },
        { path: 'admin', component: BlankPage },
      ]),
      {
        provide: ProfileGateway,
        useValue: stubProfileGateway({
          getProfile: spies.getProfile,
          saveProfile: spies.saveProfile,
          uploadPortrait: spies.uploadPortrait,
          removePortrait: spies.removePortrait,
        }),
      },
      { provide: ToastStore, useValue: { add: spies.toast } },
    ],
  });
  const harness = await RouterTestingHarness.create();
  const crash = await captureCrash(async () => {
    await harness.navigateByUrl('/admin/profile');
    await settleBounded(harness.fixture);
  });
  return {
    ...spies,
    fixture: harness.fixture,
    host: harness.fixture.nativeElement as HTMLElement,
    crash,
  };
}

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, '');

const nativeButton = (element: Element | null): HTMLButtonElement | null =>
  element instanceof HTMLButtonElement ? element : (element?.querySelector('button') ?? null);

const fieldValue = (host: HTMLElement, testId: string): string | undefined =>
  (byTestId(host, testId) as HTMLInputElement | HTMLTextAreaElement | null)?.value;

async function typeIn(editor: Editor, testId: string, text: string): Promise<void> {
  const control = byTestId(editor.host, testId) as HTMLInputElement | HTMLTextAreaElement | null;
  if (!control) return;
  control.value = text;
  control.dispatchEvent(new Event('input'));
  control.dispatchEvent(new Event('change'));
  await settle(editor.fixture);
}

async function save(editor: Editor): Promise<void> {
  await pressTestId(editor.fixture, 'savebar-submit');
  await settleBounded(editor.fixture);
}

async function cancel(editor: Editor): Promise<void> {
  byTestId(editor.host, 'savebar-cancel')?.click();
  await settleBounded(editor.fixture);
}

const toasts = (toast: Spies['toast']): readonly ToastMessage[] =>
  toast.mock.calls.map(([message]) => message);

const saveBarState = (editor: Editor): string => normalized(byTestId(editor.host, 'savebar-state'));

const tocStates = (editor: Editor): readonly string[] =>
  [...editor.host.querySelectorAll('[data-testid="form-toc-link"]')].map((link) =>
    normalized(byTestId(link, 'form-toc-state')),
  );

const retitled = (title: string): ProfileContent =>
  aProfileContent({ biography: { ...WITNESS.biography, title } });

describe('AdminProfile: ouverture', () => {
  it('Given the document of the API When /admin/profile is opened Then it is read once, the page is titled « Parcours » and the form is filled', async () => {
    const editor = await openEditor();

    expect({
      crash: editor.crash,
      requested: editor.getProfile.mock.calls.length,
      title: testIdText(editor.host, 'admin-page-title'),
      headings: editor.host.querySelectorAll('h1').length,
      field: fieldValue(editor.host, 'admin-profile-biography-title'),
      state: saveBarState(editor),
    }).toEqual({
      crash: null,
      requested: 1,
      title: 'Parcours',
      headings: 1,
      field: 'Parcours témoin',
      state: 'Aucune modification',
    });
  });

  it('Given the page When the header renders Then the introduction says a change shows on the site within a second, on reload', async () => {
    const editor = await openEditor();

    expect(normalized(byTestId(editor.host, 'admin-page-title')?.nextElementSibling)).toBe(
      "Les changements sont visibles sur le site au plus une seconde après l'enregistrement, au rechargement de la page.",
    );
  });

  it('Given the biography section When it renders Then the identity sentence is shown as text with where it is edited, and no field holds it', async () => {
    const editor = await openEditor();
    const journey = byTestId(editor.host, 'admin-profile-journey');
    const controls = [
      ...editor.host.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea'),
    ];

    expect({
      text: normalized(journey),
      tag: journey?.tagName === 'INPUT' || journey?.tagName === 'TEXTAREA',
      section: journey?.closest('fieldset')?.id ?? null,
      note: testIdText(editor.host, 'admin-profile-journey-note'),
      inAField: controls.some((control) => control.value === SITE_IDENTITY.journey),
    }).toEqual({
      text: SITE_IDENTITY.journey,
      tag: false,
      section: 'profile-biography',
      note: "Commune à l'accueil et aux offres\u00a0: se modifie dans le code.",
      inAField: false,
    });
  });
});

describe('AdminProfile: chargement et erreur', () => {
  it('Given the document is loading When the page renders Then a status placeholder stands instead of the form', async () => {
    const editor = await openEditor({
      getProfile: vi.fn((): Observable<ProfileDocument> => NEVER),
    });
    const loading = byTestId(editor.host, 'admin-profile-editor-loading');

    expect({
      crash: editor.crash,
      role: loading?.getAttribute('role'),
      form: byTestId(editor.host, 'admin-profile-form'),
    }).toEqual({ crash: null, role: 'status', form: null });
  });

  it('Given the document failed to load When the page renders Then the error offers a retry, without form', async () => {
    const editor = await openEditor({
      getProfile: vi.fn((): Observable<ProfileDocument> => throwError(() => new Error('down'))),
    });

    expect({
      crash: editor.crash,
      error: byTestId(editor.host, 'load-error') !== null,
      retry: nativeButton(byTestId(editor.host, 'load-error-retry')) !== null,
      form: byTestId(editor.host, 'admin-profile-form'),
    }).toEqual({ crash: null, error: true, retry: true, form: null });
  });

  it('Given the document failed to load When Réessayer is pressed Then it is read again and the form shows', async () => {
    const getProfile = vi
      .fn<ProfileGateway['getProfile']>()
      .mockReturnValueOnce(throwError(() => new Error('down')))
      .mockReturnValue(of(LOADED));
    const editor = await openEditor({ getProfile });

    const crash = await captureCrash(() => pressTestId(editor.fixture, 'load-error-retry'));

    expect({
      crash,
      calls: getProfile.mock.calls.length,
      field: fieldValue(editor.host, 'admin-profile-biography-title'),
    }).toEqual({ crash: null, calls: 2, field: 'Parcours témoin' });
  });
});

describe('AdminProfile: enregistrer', () => {
  it('Given the form When it renders Then « Enregistrer » submits the profile form and « Annuler » leads to the overview', async () => {
    const editor = await openEditor();
    const button = nativeButton(byTestId(editor.host, 'savebar-submit'));

    expect({
      type: button?.type,
      form: button?.getAttribute('form'),
      formExists: editor.host.querySelector('form#profile-form') !== null,
      cancel: byTestId(editor.host, 'savebar-cancel')?.getAttribute('href'),
    }).toEqual({ type: 'submit', form: 'profile-form', formExists: true, cancel: '/admin' });
  });

  it('Given an edited title When it is saved Then the content is sent with the version read, success is told and nothing is left to save', async () => {
    const editor = await openEditor();

    await typeIn(editor, 'admin-profile-biography-title', 'Nouveau parcours');
    await save(editor);

    expect({
      calls: editor.saveProfile.mock.calls,
      toasts: toasts(editor.toast),
      state: saveBarState(editor),
    }).toEqual({
      calls: [[retitled('Nouveau parcours'), 7]],
      toasts: [{ severity: 'success', detail: 'Parcours enregistré' }],
      state: 'Aucune modification',
    });
  });

  it('Given the API returning a normalized document When the save ends Then the form shows the returned text, with nothing left to save', async () => {
    const editor = await openEditor({
      saveProfile: vi.fn(
        (): Observable<ProfileDocument> =>
          of(aProfileDocument({ version: 8, content: retitled('Parcours normalisé') })),
      ),
    });

    await typeIn(editor, 'admin-profile-biography-title', '  Parcours normalisé ');
    await save(editor);

    expect({
      field: fieldValue(editor.host, 'admin-profile-biography-title'),
      state: saveBarState(editor),
    }).toEqual({ field: 'Parcours normalisé', state: 'Aucune modification' });
  });

  it('Given a first save answered with version 8 When the admin edits again and saves Then the second write carries version 8', async () => {
    const editor = await openEditor();

    await typeIn(editor, 'admin-profile-biography-title', 'Premier');
    await save(editor);
    await typeIn(editor, 'admin-profile-biography-title', 'Second');
    await save(editor);

    expect(editor.saveProfile.mock.calls.map(([, version]) => version)).toEqual([7, 8]);
  });

  it('Given a version changed elsewhere When the save is refused with a 409 Then the conflict is told and the draft is kept', async () => {
    const editor = await openEditor({
      saveProfile: vi.fn(
        (): Observable<ProfileDocument> =>
          throwError(() => apiRejection(409, 'Le parcours a changé : version périmée')),
      ),
    });

    await typeIn(editor, 'admin-profile-biography-title', 'Nouveau parcours');
    await save(editor);

    expect({
      toasts: toasts(editor.toast),
      field: fieldValue(editor.host, 'admin-profile-biography-title'),
      state: saveBarState(editor),
      disabled: nativeButton(byTestId(editor.host, 'savebar-submit'))?.disabled,
    }).toEqual({
      toasts: [{ severity: 'error', detail: CONFLICT }],
      field: 'Nouveau parcours',
      state: '1 modification non enregistrée',
      disabled: false,
    });
  });

  it.each([
    {
      given: 'a 400 with validation messages',
      rejection: apiRejection(400, [
        'biography.title must not be blank',
        'biography.title must not be blank',
        'workSummary must not contain HTML markup',
      ]),
      expected: `${SAVE_FAILURE} Détail\u00a0: biography.title must not be blank; workSummary must not contain HTML markup`,
    },
    {
      given: 'a 422 with a message',
      rejection: apiRejection(422, 'content is not acceptable'),
      expected: `${SAVE_FAILURE} Détail\u00a0: content is not acceptable`,
    },
    {
      given: 'a 401 of an expired session',
      rejection: apiRejection(401, 'Unauthorized'),
      expected: SAVE_FAILURE,
    },
    {
      given: 'a 500',
      rejection: apiRejection(500, 'Internal server error'),
      expected: SAVE_FAILURE,
    },
  ])(
    'Given $given When the profile is saved Then the toast reads the label and only a validation detail, and the draft is kept',
    async ({ rejection, expected }) => {
      const editor = await openEditor({
        saveProfile: vi.fn((): Observable<ProfileDocument> => throwError(() => rejection)),
      });

      await typeIn(editor, 'admin-profile-biography-title', 'Nouveau parcours');
      await save(editor);

      expect({ toasts: toasts(editor.toast), state: saveBarState(editor) }).toEqual({
        toasts: [{ severity: 'error', detail: expected }],
        state: '1 modification non enregistrée',
      });
    },
  );

  it('Given an emptied title When « Enregistrer » is pressed Then nothing is sent and the field shows its error', async () => {
    const editor = await openEditor();

    await typeIn(editor, 'admin-profile-biography-title', '');
    await save(editor);

    expect({
      calls: editor.saveProfile.mock.calls.length,
      toasts: toasts(editor.toast),
      error: testIdText(editor.host, 'admin-profile-biography-title-error'),
    }).toEqual({ calls: 0, toasts: [], error: 'Ce champ est obligatoire' });
  });

  it('Given a save in progress When the bar renders Then « Enregistrer » is disabled until the answer', async () => {
    const editor = await openEditor({
      saveProfile: vi.fn((): Observable<ProfileDocument> => NEVER),
    });

    await typeIn(editor, 'admin-profile-biography-title', 'Nouveau parcours');
    await save(editor);

    expect({
      calls: editor.saveProfile.mock.calls.length,
      disabled: nativeButton(byTestId(editor.host, 'savebar-submit'))?.disabled,
    }).toEqual({ calls: 1, disabled: true });
  });
});

describe('AdminProfile: modifications non enregistrées', () => {
  it('Given the page When the section summary renders Then it lists the six sections and links each one in the page', async () => {
    const editor = await openEditor();
    const toc = byTestId(editor.host, 'form-toc');
    const links = [...editor.host.querySelectorAll('[data-testid="form-toc-link"]')];

    expect({
      label: toc?.getAttribute('aria-label'),
      links: links.map((link) => ({
        label: testIdText(link, 'form-toc-label'),
        href: link.getAttribute('href'),
      })),
      states: tocStates(editor),
    }).toEqual({
      label: 'Sections du formulaire',
      links: [
        { label: '01 · Parcours', href: '/admin/profile#profile-biography' },
        { label: '02 · Traits', href: '/admin/profile#profile-traits' },
        { label: '03 · Ce que je fais', href: '/admin/profile#profile-work' },
        { label: '04 · Formations', href: '/admin/profile#profile-diplomas' },
        { label: '05 · Motivation', href: '/admin/profile#profile-motivation' },
        { label: '06 · Portrait', href: '/admin/profile#profile-portrait' },
      ],
      states: ['', '', '', '', '', ''],
    });
  });

  it.each([
    { testId: 'admin-profile-biography-title', toc: ['modifié', '', '', '', '', ''] },
    { testId: 'admin-profile-lead-emphasis', toc: ['modifié', '', '', '', '', ''] },
    { testId: 'admin-profile-work-summary', toc: ['', '', 'modifié', '', '', ''] },
    { testId: 'admin-profile-diplomas-summary', toc: ['', '', '', 'modifié', '', ''] },
    { testId: 'admin-profile-motivation-description', toc: ['', '', '', '', 'modifié', ''] },
  ])(
    'Given the opened profile When $testId is changed Then one change is reported and its section is marked',
    async ({ testId, toc }) => {
      const editor = await openEditor();

      await typeIn(editor, testId, 'Texte modifié');

      expect({ state: saveBarState(editor), toc: tocStates(editor) }).toEqual({
        state: '1 modification non enregistrée',
        toc,
      });
    },
  );

  it('Given two fields edited When the bar renders Then it reports two changes', async () => {
    const editor = await openEditor();

    await typeIn(editor, 'admin-profile-biography-title', 'Autre');
    await typeIn(editor, 'admin-profile-motivation-title', 'Autre');

    expect(saveBarState(editor)).toBe('2 modifications non enregistrées');
  });
});

describe('AdminProfile: quitter la page', () => {
  it('Given no change When « Annuler » is followed Then the overview opens without question', async () => {
    const editor = await openEditor();

    await cancel(editor);

    expect({
      dialog: readConfirmDialog(editor.host).open,
      url: TestBed.inject(Router).url,
    }).toEqual({ dialog: false, url: '/admin' });
  });

  it('Given an unsaved change When the admin leaves Then a dialog asks to confirm, names the profile, and the page stays meanwhile', async () => {
    const editor = await openEditor();

    await typeIn(editor, 'admin-profile-biography-title', 'Autre');
    await cancel(editor);
    const dialog = readConfirmDialog(editor.host);

    expect({
      open: dialog.open,
      heading: dialog.heading,
      description: dialog.description,
      url: TestBed.inject(Router).url,
    }).toEqual({
      open: true,
      heading: 'Quitter sans enregistrer\u202f?',
      description: 'Les modifications non enregistrées du parcours seront perdues.',
      url: '/admin/profile',
    });
  });

  it.each([
    { answer: 'confirm', url: '/admin', field: undefined },
    { answer: 'cancel', url: '/admin/profile', field: 'Autre' },
  ] as const)(
    'Given the leave dialog When the admin answers $answer Then the address is $url',
    async ({ answer, url, field }) => {
      const editor = await openEditor();

      await typeIn(editor, 'admin-profile-biography-title', 'Autre');
      await cancel(editor);
      await answerConfirmDialog(editor.fixture, answer);
      await settleBounded(editor.fixture);

      expect({
        url: TestBed.inject(Router).url,
        open: readConfirmDialog(editor.host).open,
        field: fieldValue(editor.host, 'admin-profile-biography-title'),
      }).toEqual({ url, open: false, field });
    },
  );

  it('Given an edited profile saved When the admin leaves Then no dialog is asked', async () => {
    const editor = await openEditor();

    await typeIn(editor, 'admin-profile-biography-title', 'Nouveau parcours');
    await save(editor);
    await cancel(editor);

    expect({
      saved: editor.saveProfile.mock.calls.length,
      dialog: readConfirmDialog(editor.host).open,
      url: TestBed.inject(Router).url,
    }).toEqual({ saved: 1, dialog: false, url: '/admin' });
  });

  it('Given the tab about to close When the profile is untouched then edited Then the browser warning is requested only once edited', async () => {
    const editor = await openEditor();
    const untouched = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(untouched);

    await typeIn(editor, 'admin-profile-biography-title', 'Autre');
    const edited = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(edited);

    expect({ untouched: untouched.defaultPrevented, edited: edited.defaultPrevented }).toEqual({
      untouched: false,
      edited: true,
    });
  });
});

describe('AdminProfile: réordonner', () => {
  const FIRST = aHighlight({ id: 'highlight-1', title: 'Premier trait' });
  const SECOND = aHighlight({ id: 'highlight-2', title: 'Second trait' });
  const TWO_TRAITS = aProfileDocument({
    version: 7,
    content: aProfileContent({ highlights: [FIRST, SECOND] }),
  });

  async function moveSecondTraitUp(editor: Editor): Promise<void> {
    const row = editor.host.querySelectorAll('[data-testid="admin-profile-highlight-row"]')[1];
    const up = row ? byTestId(row, 'admin-profile-highlight-up') : null;
    nativeButton(up)?.click();
    await settleBounded(editor.fixture);
  }

  it('Given two traits When the second is moved up Then one change is reported in the traits section', async () => {
    const editor = await openEditor({
      getProfile: vi.fn((): Observable<ProfileDocument> => of(TWO_TRAITS)),
    });

    await moveSecondTraitUp(editor);

    expect({ state: saveBarState(editor), toc: tocStates(editor) }).toEqual({
      state: '1 modification non enregistrée',
      toc: ['', 'modifié', '', '', '', ''],
    });
  });

  it('Given two traits reordered When the profile is saved Then the content is sent in the new order and nothing is left to save', async () => {
    const editor = await openEditor({
      getProfile: vi.fn((): Observable<ProfileDocument> => of(TWO_TRAITS)),
    });

    await moveSecondTraitUp(editor);
    await save(editor);

    expect({
      sent: editor.saveProfile.mock.calls.map(([content, version]) => ({
        ids: content.highlights.map((item) => item.id),
        version,
      })),
      state: saveBarState(editor),
    }).toEqual({
      sent: [{ ids: ['highlight-2', 'highlight-1'], version: 7 }],
      state: 'Aucune modification',
    });
  });
});

describe('AdminProfile: formulations à relire', () => {
  async function typeInSecondParagraph(editor: Editor, text: string): Promise<void> {
    const control = byTestId(editor.host, 'admin-profile-paragraph-text', 1) as
      | HTMLTextAreaElement
      | HTMLInputElement
      | null;
    if (!control) return;
    control.value = text;
    control.dispatchEvent(new Event('input'));
    control.dispatchEvent(new Event('change'));
    await settle(editor.fixture);
  }

  it('Given « métallurgie » typed then corrected When the page renders Then the notice shows, then goes away', async () => {
    const editor = await openEditor();
    await typeInSecondParagraph(editor, 'Issu de la métallurgie.');
    const flagged = byTestId(editor.host, 'admin-wording-notice') !== null;
    await typeInSecondParagraph(editor, 'Second paragraphe témoin.');

    expect({ flagged, after: byTestId(editor.host, 'admin-wording-notice') }).toEqual({
      flagged: true,
      after: null,
    });
  });

  it('Given « métallurgie » typed in the second paragraph When the page renders Then a notice above the save bar names it and links to that field', async () => {
    const editor = await openEditor();

    await typeInSecondParagraph(editor, 'Issu de la métallurgie.');
    const notice = byTestId(editor.host, 'admin-wording-notice');
    const link = notice?.querySelector('[data-testid="admin-wording-notice-item"] a');
    const href = link?.getAttribute('href') ?? '';
    const target = editor.host.querySelector(`[id="${href.split('#')[1] ?? ''}"]`);
    const saveBar = byTestId(editor.host, 'savebar-state');

    expect({
      item: normalized(notice?.querySelector('[data-testid="admin-wording-notice-item"]')),
      href,
      target: target === byTestId(editor.host, 'admin-profile-paragraph-text', 1),
      aboveSaveBar: Boolean(
        notice &&
        saveBar &&
        notice.compareDocumentPosition(saveBar) & Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    }).toEqual({
      item: '«\u00a0métallurgie\u00a0» dans Paragraphe 2',
      href: '/admin/profile#profile-paragraph-text-2',
      target: true,
      aboveSaveBar: true,
    });
  });

  it('Given a wording to reread When « Enregistrer » is pressed Then the profile is still saved with that text and success is told', async () => {
    const editor = await openEditor();

    await typeInSecondParagraph(editor, 'Issu de la métallurgie.');
    await save(editor);

    expect({
      sent: editor.saveProfile.mock.calls.map(([content]) => content.biography.paragraphs[1]),
      toasts: toasts(editor.toast),
    }).toEqual({
      sent: ['Issu de la métallurgie.'],
      toasts: [{ severity: 'success', detail: 'Parcours enregistré' }],
    });
  });
});

describe('AdminProfile: portrait', () => {
  const PNG = new File(['png'], 'portrait.png', { type: 'image/png' });
  const WITH_PORTRAIT = aProfileDocument({ version: 7, portraitUrl: STORED });

  const portraitSection = (editor: Editor): HTMLElement | null =>
    editor.host.querySelector<HTMLElement>('fieldset#profile-portrait');

  const thumbnailSrc = (editor: Editor): string | null =>
    byTestId(editor.host, 'admin-profile-portrait-current')
      ?.querySelector('img')
      ?.getAttribute('src') ?? null;

  async function dropPortrait(editor: Editor, file: File): Promise<void> {
    editor.fixture.debugElement
      .query(By.directive(FileDropzone))
      ?.triggerEventHandler('fileSelected', file);
    await settleBounded(editor.fixture);
  }

  async function confirmRemoval(editor: Editor, choice: 'confirm' | 'cancel'): Promise<void> {
    nativeButton(byTestId(editor.host, 'admin-profile-portrait-remove'))?.click();
    await settleBounded(editor.fixture);
    const section = portraitSection(editor);
    nativeButton(section ? byTestId(section, `confirm-dialog-${choice}`) : null)?.click();
    await settleBounded(editor.fixture);
  }

  it('Given the page When it renders Then « 06 · Portrait » follows the form, outside of it, before the save bar, and says when a change shows', async () => {
    const editor = await openEditor();
    const section = portraitSection(editor);
    const saveBar = byTestId(editor.host, 'savebar-state');
    const formElement = byTestId(editor.host, 'admin-profile-form');

    expect({
      title: section ? testIdText(section, 'form-section-title') : null,
      description: section ? normalized(byTestId(section, 'form-section-description')) : null,
      inForm: section?.closest('form') !== null,
      afterForm: Boolean(
        section &&
        formElement &&
        formElement.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING,
      ),
      beforeSaveBar: Boolean(
        section &&
        saveBar &&
        section.compareDocumentPosition(saveBar) & Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    }).toEqual({
      title: '06 · Portrait',
      description:
        "Envoyé dès le dépôt, sans passer par l'enregistrement. Visible sur le site au plus une seconde après l'envoi, au rechargement de la page.",
      inForm: false,
      afterForm: true,
      beforeSaveBar: true,
    });
  });

  it.each([
    { given: 'no stored portrait', document: LOADED, src: '/avatar.avif', fallback: true },
    { given: 'a stored portrait', document: WITH_PORTRAIT, src: STORED, fallback: false },
  ])(
    'Given $given When the page renders Then the thumbnail is $src',
    async ({ document, src, fallback }) => {
      const editor = await openEditor({
        getProfile: vi.fn((): Observable<ProfileDocument> => of(document)),
      });

      expect({
        src: thumbnailSrc(editor),
        fallback: byTestId(editor.host, 'admin-profile-portrait-default') !== null,
        remove: byTestId(editor.host, 'admin-profile-portrait-remove') !== null,
      }).toEqual({ src, fallback, remove: !fallback });
    },
  );

  it('Given an edited title When a portrait is dropped Then it is sent at once, the thumbnail shows the returned one, success is told, and the text draft is untouched', async () => {
    const editor = await openEditor();

    await typeIn(editor, 'admin-profile-biography-title', 'Nouveau parcours');
    await dropPortrait(editor, PNG);

    expect({
      sent: editor.uploadPortrait.mock.calls,
      saved: editor.saveProfile.mock.calls.length,
      src: thumbnailSrc(editor),
      toasts: toasts(editor.toast),
      field: fieldValue(editor.host, 'admin-profile-biography-title'),
      state: saveBarState(editor),
      toc: tocStates(editor),
    }).toEqual({
      sent: [[PNG]],
      saved: 0,
      src: SENT,
      toasts: [{ severity: 'success', detail: 'Portrait remplacé' }],
      field: 'Nouveau parcours',
      state: '1 modification non enregistrée',
      toc: ['modifié', '', '', '', '', ''],
    });
  });

  it('Given a portrait replaced When the text is then saved Then the write carries the version read and nothing is left to save', async () => {
    const editor = await openEditor();

    await dropPortrait(editor, PNG);
    await typeIn(editor, 'admin-profile-biography-title', 'Nouveau parcours');
    await save(editor);

    expect({
      versions: editor.saveProfile.mock.calls.map(([, version]) => version),
      src: thumbnailSrc(editor),
      state: saveBarState(editor),
    }).toEqual({ versions: [7], src: SENT, state: 'Aucune modification' });
  });

  it('Given a portrait being sent When the page renders Then a status says so', async () => {
    const editor = await openEditor({
      uploadPortrait: vi.fn((): Observable<ProfileDocument> => NEVER),
    });

    await dropPortrait(editor, PNG);

    expect(testIdText(editor.host, 'admin-profile-portrait-busy')).toBe('Envoi du portrait…');
  });

  it('Given a file that is not one of the accepted images When it is dropped Then nothing is sent and the page says which images are accepted', async () => {
    const editor = await openEditor();

    await dropPortrait(editor, new File(['gif'], 'p.gif', { type: 'image/gif' }));

    expect({ sent: editor.uploadPortrait.mock.calls.length, toasts: toasts(editor.toast) }).toEqual(
      {
        sent: 0,
        toasts: [
          {
            severity: 'error',
            detail: 'Seules les images AVIF, WebP, PNG ou JPEG sont acceptées.',
          },
        ],
      },
    );
  });

  it.each([
    {
      given: 'a 422 naming the refusal',
      rejection: apiRejection(422, 'Validation failed (expected size is less than 5242880)'),
      expected:
        "Le portrait n'a pas pu être remplacé. Détail\u00a0: Validation failed (expected size is less than 5242880)",
    },
    {
      given: 'a 503 of a busy profile',
      rejection: apiRejection(
        503,
        'Le parcours est en cours de modification : réessayez dans quelques secondes',
      ),
      expected: "Le portrait n'a pas pu être remplacé. Réessayez dans quelques secondes.",
    },
    {
      given: 'a 500',
      rejection: apiRejection(500, 'Internal server error'),
      expected: "Le portrait n'a pas pu être remplacé.",
    },
  ])(
    'Given $given When a portrait is dropped Then the toast says why and the thumbnail is unchanged',
    async ({ rejection, expected }) => {
      const editor = await openEditor({
        getProfile: vi.fn((): Observable<ProfileDocument> => of(WITH_PORTRAIT)),
        uploadPortrait: vi.fn((): Observable<ProfileDocument> => throwError(() => rejection)),
      });

      await dropPortrait(editor, PNG);

      expect({ toasts: toasts(editor.toast), src: thumbnailSrc(editor) }).toEqual({
        toasts: [{ severity: 'error', detail: expected }],
        src: STORED,
      });
    },
  );

  it('Given a stored portrait When the way back is confirmed Then the portrait is removed, the default one shows and it is told', async () => {
    const editor = await openEditor({
      getProfile: vi.fn((): Observable<ProfileDocument> => of(WITH_PORTRAIT)),
    });

    await confirmRemoval(editor, 'confirm');

    expect({
      removed: editor.removePortrait.mock.calls.length,
      src: thumbnailSrc(editor),
      fallback: byTestId(editor.host, 'admin-profile-portrait-default') !== null,
      toasts: toasts(editor.toast),
      state: saveBarState(editor),
    }).toEqual({
      removed: 1,
      src: '/avatar.avif',
      fallback: true,
      toasts: [{ severity: 'success', detail: 'Portrait par défaut rétabli' }],
      state: 'Aucune modification',
    });
  });

  it('Given a stored portrait When the way back is dismissed Then nothing is removed', async () => {
    const editor = await openEditor({
      getProfile: vi.fn((): Observable<ProfileDocument> => of(WITH_PORTRAIT)),
    });

    await confirmRemoval(editor, 'cancel');

    expect({
      asked: byTestId(editor.host, 'admin-profile-portrait-remove') !== null,
      removed: editor.removePortrait.mock.calls.length,
      src: thumbnailSrc(editor),
    }).toEqual({ asked: true, removed: 0, src: STORED });
  });

  it.each([
    {
      given: 'a 503 of a busy profile',
      rejection: apiRejection(
        503,
        'Le parcours est en cours de modification : réessayez dans quelques secondes',
      ),
      expected: "Le portrait par défaut n'a pas pu être rétabli. Réessayez dans quelques secondes.",
    },
    {
      given: 'a 500',
      rejection: apiRejection(500, 'Internal server error'),
      expected: "Le portrait par défaut n'a pas pu être rétabli.",
    },
  ])(
    'Given $given When the way back is confirmed Then the toast says why and the stored portrait stays',
    async ({ rejection, expected }) => {
      const editor = await openEditor({
        getProfile: vi.fn((): Observable<ProfileDocument> => of(WITH_PORTRAIT)),
        removePortrait: vi.fn((): Observable<void> => throwError(() => rejection)),
      });

      await confirmRemoval(editor, 'confirm');

      expect({ toasts: toasts(editor.toast), src: thumbnailSrc(editor) }).toEqual({
        toasts: [{ severity: 'error', detail: expected }],
        src: STORED,
      });
    },
  );
});

describe('AdminProfile: focus et annonces après un enregistrement (revue F2-F7)', () => {
  const TWO_TRAITS = aProfileDocument({
    version: 7,
    content: aProfileContent({
      highlights: [
        aHighlight({ id: 'highlight-1', title: 'Premier trait' }),
        aHighlight({ id: 'highlight-2', title: 'Second trait' }),
      ],
    }),
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const rebuiltWarnings = (warn: Mock): number =>
    warn.mock.calls.filter(([message]) => String(message).includes('NG0956')).length;

  async function submitFromField(editor: Editor, testId: string, index: number): Promise<void> {
    const field = byTestId(editor.host, testId, index) as HTMLInputElement | HTMLTextAreaElement;
    field.focus();
    field.value = `${field.value} modifié`;
    field.dispatchEvent(new Event('input'));
    await settle(editor.fixture);
    byTestId(editor.host, 'admin-profile-form')?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    await settleBounded(editor.fixture);
  }

  async function moveSecondParagraphUp(editor: Editor): Promise<void> {
    const row = editor.host.querySelectorAll('[data-testid="admin-profile-paragraph-row"]')[1];
    nativeButton(row ? byTestId(row, 'admin-profile-paragraph-up') : null)?.click();
    await settleBounded(editor.fixture);
  }

  async function addParagraph(editor: Editor): Promise<void> {
    nativeButton(byTestId(editor.host, 'admin-profile-paragraph-add'))?.click();
    await settleBounded(editor.fixture);
    const field = byTestId(editor.host, 'admin-profile-paragraph-text', 2) as HTMLTextAreaElement;
    field.value = 'Paragraphe ajouté';
    field.dispatchEvent(new Event('input'));
    await settle(editor.fixture);
  }

  const nothingBefore = async (): Promise<void> => undefined;

  it.each([
    {
      field: 'a technology name',
      testId: 'admin-profile-technology-name',
      index: 0,
      prepare: nothingBefore,
    },
    {
      field: 'the second paragraph',
      testId: 'admin-profile-paragraph-text',
      index: 1,
      prepare: nothingBefore,
    },
    {
      field: 'a trait description',
      testId: 'admin-profile-highlight-description',
      index: 0,
      prepare: nothingBefore,
    },
    {
      field: 'a paragraph moved up',
      testId: 'admin-profile-paragraph-text',
      index: 0,
      prepare: moveSecondParagraphUp,
    },
    {
      field: 'a paragraph just added',
      testId: 'admin-profile-paragraph-text',
      index: 2,
      prepare: addParagraph,
    },
  ])(
    'Given $field edited When the form is submitted with Enter and saved Then the focus stays on that very field and no list is rebuilt',
    async ({ testId, index, prepare }) => {
      const warn = vi.spyOn(console, 'warn');
      const editor = await openEditor();
      await prepare(editor);
      const before = byTestId(editor.host, testId, index);

      await submitFromField(editor, testId, index);

      expect({
        saved: editor.saveProfile.mock.calls.length,
        sameNode: byTestId(editor.host, testId, index) === before,
        focused: document.activeElement === before,
        rebuilt: rebuiltWarnings(warn),
      }).toEqual({ saved: 1, sameNode: true, focused: true, rebuilt: 0 });
    },
  );

  it('Given a load failure When Réessayer brings the document Then the focus lands on the page title, and a later save keeps the focus on the edited field', async () => {
    const warn = vi.spyOn(console, 'warn');
    const getProfile = vi
      .fn<ProfileGateway['getProfile']>()
      .mockReturnValueOnce(throwError(() => new Error('down')))
      .mockReturnValue(of(LOADED));
    const editor = await openEditor({ getProfile });

    await pressTestId(editor.fixture, 'load-error-retry');
    await settleBounded(editor.fixture);
    const afterRetry = document.activeElement === byTestId(editor.host, 'admin-page-title');
    const field = byTestId(editor.host, 'admin-profile-technology-name', 0);
    await submitFromField(editor, 'admin-profile-technology-name', 0);

    expect({
      afterRetry,
      focused: document.activeElement === field,
      rebuilt: rebuiltWarnings(warn),
    }).toEqual({ afterRetry: true, focused: true, rebuilt: 0 });
  });

  it('Given a trait moved and announced When the profile is saved Then the announcement is cleared', async () => {
    const editor = await openEditor({
      getProfile: vi.fn((): Observable<ProfileDocument> => of(TWO_TRAITS)),
    });
    const announcer = (): string =>
      normalized(byTestId(editor.host, 'admin-profile-highlight-announcer'));
    const row = editor.host.querySelectorAll('[data-testid="admin-profile-highlight-row"]')[1];
    nativeButton(row ? byTestId(row, 'admin-profile-highlight-up') : null)?.click();
    await settleBounded(editor.fixture);
    const announced = announcer();

    await save(editor);

    expect({ announced, after: announcer() }).toEqual({
      announced: 'Trait déplacé en position 1',
      after: '',
    });
  });

  it('Given the profile When it is saved Then the payload carries no internal row key', async () => {
    const editor = await openEditor();

    await submitFromField(editor, 'admin-profile-paragraph-text', 0);

    expect(
      editor.saveProfile.mock.calls.map(([content]) =>
        content.biography.paragraphs.every((paragraph) => typeof paragraph === 'string'),
      ),
    ).toEqual([true]);
  });
});
