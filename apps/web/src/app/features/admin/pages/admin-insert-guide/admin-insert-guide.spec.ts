import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { NEVER, of, throwError, type Observable } from 'rxjs';
import type { Mock } from 'vitest';
import { MACHINING_OPERATIONS } from '@features/workshop/domain/machining-operations.static-data';
import type {
  InsertGuide,
  InsertGuideDocument,
} from '@features/workshop/domain/models/insert-guide.model';
import { HttpInsertGuideGateway } from '@features/workshop/infra/gateways/http-insert-guide.gateway';
import { anEntry } from '@features/workshop/testing/insert-guide-builders';
import { ToastStore } from '@core/notifications/toast-store';
import { apiRejection } from '@shared/testing/api-rejection';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { captureCrash } from '@shared/testing/capture-crash';
import { pressTestId } from '@shared/testing/press-test-id';
import { settle, settleBounded } from '@shared/testing/settle';
import type { ToastMessage } from '@shared/ui/toast.types';
import { unsavedChangesGuard } from '../../application/unsaved-changes-guard';
import { AdminInsertGuide } from './admin-insert-guide';

@Component({ template: '' })
class BlankPage {}

const LOADED: InsertGuideDocument = {
  enabled: false,
  decoderEnabled: false,
  entries: [
    anEntry({ note: 'Remarque fictive.' }),
    anEntry({ operation: 'threading', insert: 'CODE-FICTIF-02', noseRadius: 0.2 }),
  ],
  version: 7,
};

const CONFLICT =
  'Le guide des plaquettes a été modifié depuis une autre fenêtre. Rechargez la page pour repartir de la dernière version (vos modifications non enregistrées seront perdues).';
const SAVE_FAILURE = "Le guide des plaquettes n'a pas pu être enregistré.";

type Spies = {
  readonly getDocument: Mock<HttpInsertGuideGateway['getDocument']>;
  readonly saveGuide: Mock<HttpInsertGuideGateway['saveGuide']>;
  readonly toast: Mock<ToastStore['add']>;
};

type Editor = Spies & {
  readonly fixture: ComponentFixture<unknown>;
  readonly host: HTMLElement;
  readonly crash: unknown;
};

async function openEditor(overrides: Partial<Omit<Spies, 'toast'>> = {}): Promise<Editor> {
  const spies: Spies = {
    getDocument: vi.fn((): Observable<InsertGuideDocument> => of(LOADED)),
    saveGuide: vi.fn((guide: InsertGuide): Observable<InsertGuideDocument> =>
      of({ ...guide, version: 8 }),
    ),
    toast: vi.fn(),
    ...overrides,
  };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        {
          path: 'admin/guide-plaquettes',
          component: AdminInsertGuide,
          canDeactivate: [unsavedChangesGuard],
        },
        { path: 'admin', component: BlankPage },
      ]),
      {
        provide: HttpInsertGuideGateway,
        useValue: { getDocument: spies.getDocument, saveGuide: spies.saveGuide },
      },
      { provide: ToastStore, useValue: { add: spies.toast } },
    ],
  });
  const harness = await RouterTestingHarness.create();
  const crash = await captureCrash(async () => {
    await harness.navigateByUrl('/admin/guide-plaquettes');
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

type Control = HTMLInputElement | HTMLSelectElement;

const control = (editor: Editor, testId: string, index = 0): Control | null =>
  byTestId(editor.host, testId, index) as Control | null;

const values = (editor: Editor, testId: string): readonly string[] =>
  [...editor.host.querySelectorAll<Control>(`[data-testid="${testId}"]`)].map(({ value }) => value);

async function fill(editor: Editor, testId: string, text: string, index = 0): Promise<void> {
  const element = control(editor, testId, index);
  if (!element) return;
  element.value = text;
  element.dispatchEvent(new Event('input'));
  element.dispatchEvent(new Event('change'));
  await settle(editor.fixture);
}

async function fillRow(
  editor: Editor,
  index: number,
  row: { material: string; operation: string; insert: string; radius: string; note?: string },
): Promise<void> {
  await fill(editor, 'admin-insert-guide-material', row.material, index);
  await fill(editor, 'admin-insert-guide-operation', row.operation, index);
  await fill(editor, 'admin-insert-guide-insert', row.insert, index);
  await fill(editor, 'admin-insert-guide-radius', row.radius, index);
  await fill(editor, 'admin-insert-guide-note', row.note ?? '', index);
}

async function toggleSwitch(editor: Editor, testId = 'admin-insert-guide-enabled'): Promise<void> {
  control(editor, testId)?.click();
  await settle(editor.fixture);
}

const checked = (editor: Editor, testId: string): boolean | undefined =>
  (control(editor, testId) as HTMLInputElement | null)?.checked;

const addRow = (editor: Editor): Promise<void> =>
  pressTestId(editor.fixture, 'admin-insert-guide-add');

const removeRow = (editor: Editor, index: number): Promise<void> =>
  pressTestId(editor.fixture, 'admin-insert-guide-remove', index);

async function save(editor: Editor): Promise<void> {
  await pressTestId(editor.fixture, 'savebar-submit');
  await settleBounded(editor.fixture);
}

const toasts = (toast: Spies['toast']): readonly ToastMessage[] =>
  toast.mock.calls.map(([message]) => message);

const saveBarState = (editor: Editor): string => normalized(byTestId(editor.host, 'savebar-state'));

const rowCount = (editor: Editor): number =>
  editor.host.querySelectorAll('[data-testid="admin-insert-guide-row"]').length;

describe('AdminInsertGuide: ouverture', () => {
  it('Given the guide of the API When /admin/guide-plaquettes is opened Then it is read once, the page is titled and the form shows the switch and the lines', async () => {
    const editor = await openEditor();

    expect({
      crash: editor.crash,
      requested: editor.getDocument.mock.calls.length,
      title: testIdText(editor.host, 'admin-page-title'),
      headings: editor.host.querySelectorAll('h1').length,
      enabled: (control(editor, 'admin-insert-guide-enabled') as HTMLInputElement | null)?.checked,
      materials: values(editor, 'admin-insert-guide-material'),
      operations: values(editor, 'admin-insert-guide-operation'),
      inserts: values(editor, 'admin-insert-guide-insert'),
      radii: values(editor, 'admin-insert-guide-radius'),
      notes: values(editor, 'admin-insert-guide-note'),
      state: saveBarState(editor),
    }).toEqual({
      crash: null,
      requested: 1,
      title: 'Guide des plaquettes',
      headings: 1,
      enabled: false,
      materials: ['Matière fictive', 'Matière fictive'],
      operations: ['external-roughing', 'threading'],
      inserts: ['CODE-FICTIF-01', 'CODE-FICTIF-02'],
      radii: ['0.8', '0.2'],
      notes: ['Remarque fictive.', ''],
      state: 'Aucune modification',
    });
  });

  it('Given the switch When it renders Then it is a checkbox labelled « Guide des plaquettes visible sur le site »', async () => {
    const editor = await openEditor();
    const checkbox = control(editor, 'admin-insert-guide-enabled');

    expect({
      type: checkbox?.getAttribute('type'),
      label: normalized(editor.host.querySelector(`label[for="${checkbox?.id}"]`)),
    }).toEqual({ type: 'checkbox', label: 'Guide des plaquettes visible sur le site' });
  });

  it('Given the decoder switch When it renders Then it is a checkbox labelled « Décodeur de plaquette visible sur le site », after the guide one, checked as read', async () => {
    const editor = await openEditor({
      getDocument: vi.fn((): Observable<InsertGuideDocument> =>
        of({ ...LOADED, decoderEnabled: true }),
      ),
    });
    const checkbox = control(editor, 'admin-insert-guide-decoder-enabled');
    const guide = control(editor, 'admin-insert-guide-enabled');

    expect({
      type: checkbox?.getAttribute('type'),
      label: normalized(editor.host.querySelector(`label[for="${checkbox?.id}"]`)),
      afterGuide:
        guide !== null &&
        checkbox !== null &&
        (guide.compareDocumentPosition(checkbox) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
      checked: checked(editor, 'admin-insert-guide-decoder-enabled'),
      guideChecked: checked(editor, 'admin-insert-guide-enabled'),
    }).toEqual({
      type: 'checkbox',
      label: 'Décodeur de plaquette visible sur le site',
      afterGuide: true,
      checked: true,
      guideChecked: false,
    });
  });

  it.each([
    [
      'admin-insert-guide-enabled',
      "Cochée : la page du guide et sa carte sur l'accueil de l'atelier sont en ligne.",
    ],
    [
      'admin-insert-guide-decoder-enabled',
      "Cochée : la page du décodeur et sa carte sur l'accueil de l'atelier sont en ligne, et les codes du guide mènent à leur décodage.",
    ],
  ])(
    'Given the switch %s When it renders Then it is described by a help sentence saying what it shows on the site',
    async (testId, help) => {
      const editor = await openEditor();
      const describedBy = control(editor, testId)?.getAttribute('aria-describedby') ?? '';

      expect(
        describedBy === '' ? null : normalized(editor.host.querySelector(`[id="${describedBy}"]`)),
      ).toBe(help);
    },
  );

  it('Given the document is loading When the page renders Then a status placeholder stands instead of the form', async () => {
    const editor = await openEditor({
      getDocument: vi.fn((): Observable<InsertGuideDocument> => NEVER),
    });

    expect({
      crash: editor.crash,
      role: byTestId(editor.host, 'admin-insert-guide-editor-loading')?.getAttribute('role'),
      form: byTestId(editor.host, 'admin-insert-guide-form'),
    }).toEqual({ crash: null, role: 'status', form: null });
  });

  it('Given the document failed to load When Réessayer is pressed Then it is read again and the form shows', async () => {
    const getDocument = vi
      .fn<HttpInsertGuideGateway['getDocument']>()
      .mockReturnValueOnce(throwError(() => new Error('down')))
      .mockReturnValue(of(LOADED));
    const editor = await openEditor({ getDocument });
    const failed = byTestId(editor.host, 'load-error') !== null;

    await pressTestId(editor.fixture, 'load-error-retry');

    expect({
      failed,
      calls: getDocument.mock.calls.length,
      rows: rowCount(editor),
    }).toEqual({ failed: true, calls: 2, rows: 2 });
  });
});

describe('AdminInsertGuide: accessibilité des lignes', () => {
  it('Given the lines When they render Then each one is a fieldset whose legend gives its rank', async () => {
    const editor = await openEditor();
    const rows = [...editor.host.querySelectorAll('[data-testid="admin-insert-guide-row"]')];

    expect(
      rows.map((row) => ({ tag: row.tagName, legend: normalized(row.querySelector('legend')) })),
    ).toEqual([
      { tag: 'FIELDSET', legend: 'Ligne 1' },
      { tag: 'FIELDSET', legend: 'Ligne 2' },
    ]);
  });

  it('Given a line When it renders Then every field has its own label, the required ones say so and the radius steps by 0.01, its two allowed decimals', async () => {
    const editor = await openEditor();
    const row = byTestId(editor.host, 'admin-insert-guide-row');
    const fields = [...(row?.querySelectorAll<Control>('input, select') ?? [])];

    expect({
      fields: fields.map((field) => ({
        label: normalized(editor.host.querySelector(`label[for="${field.id}"]`)),
        required: field.getAttribute('aria-required'),
      })),
      radius: {
        type: control(editor, 'admin-insert-guide-radius')?.getAttribute('type'),
        step: control(editor, 'admin-insert-guide-radius')?.getAttribute('step'),
      },
    }).toEqual({
      fields: [
        { label: 'Matière', required: 'true' },
        { label: 'Opération', required: 'true' },
        { label: 'Plaquette', required: 'true' },
        { label: 'Rayon de bec (mm)', required: 'true' },
        { label: 'Remarque (facultative)', required: null },
      ],
      radius: { type: 'number', step: '0.01' },
    });
  });

  it('Given the operation list When it renders Then it offers the closed list in French, after an empty choice', async () => {
    const editor = await openEditor();
    const select = control(editor, 'admin-insert-guide-operation') as HTMLSelectElement | null;

    expect(
      [...(select?.options ?? [])].map(({ value, text }) => ({ value, text: text.trim() })),
    ).toEqual([
      { value: '', text: 'Choisir une opération' },
      ...MACHINING_OPERATIONS.map(({ id, label }) => ({ value: id, text: label })),
    ]);
  });

  it('Given two lines When « Ajouter une ligne » is pressed Then a blank third line appears and its first field takes the focus', async () => {
    const editor = await openEditor();

    await addRow(editor);

    const third = control(editor, 'admin-insert-guide-material', 2);
    expect({
      rows: rowCount(editor),
      legend: normalized(
        byTestId(editor.host, 'admin-insert-guide-row', 2)?.querySelector('legend'),
      ),
      value: third?.value,
      focused: document.activeElement === third,
      state: saveBarState(editor),
    }).toEqual({
      rows: 3,
      legend: 'Ligne 3',
      value: '',
      focused: true,
      state: '1 modification non enregistrée',
    });
  });

  it('Given two lines When the first is removed Then the second stays and the focus goes to « Ajouter une ligne »', async () => {
    const editor = await openEditor();
    const remove = nativeButton(byTestId(editor.host, 'admin-insert-guide-remove'));
    const label = { name: remove?.getAttribute('aria-label'), text: normalized(remove) };

    await removeRow(editor, 0);

    expect({
      label,
      inserts: values(editor, 'admin-insert-guide-insert'),
      focused:
        document.activeElement === nativeButton(byTestId(editor.host, 'admin-insert-guide-add')),
    }).toEqual({
      label: { name: 'Retirer la ligne 1', text: 'Retirer' },
      inserts: ['CODE-FICTIF-02'],
      focused: true,
    });
  });
});

describe('AdminInsertGuide: enregistrer', () => {
  it('Given the form When it renders Then « Enregistrer » submits the guide form and « Annuler » leads to the overview', async () => {
    const editor = await openEditor();
    const button = nativeButton(byTestId(editor.host, 'savebar-submit'));

    expect({
      type: button?.type,
      form: button?.getAttribute('form'),
      formExists: editor.host.querySelector('form#insert-guide-form') !== null,
      cancel: byTestId(editor.host, 'savebar-cancel')?.getAttribute('href'),
    }).toEqual({ type: 'submit', form: 'insert-guide-form', formExists: true, cancel: '/admin' });
  });

  it('Given the guide switched on and a line added When it is saved Then the guide is sent with the version read, success is told and nothing is left to save', async () => {
    const editor = await openEditor();

    await toggleSwitch(editor);
    await addRow(editor);
    await fillRow(editor, 2, {
      material: ' Autre matière ',
      operation: 'parting-off',
      insert: 'CODE-FICTIF-03',
      radius: '0.4',
      note: 'Arrosage abondant.',
    });
    await save(editor);

    expect({
      calls: editor.saveGuide.mock.calls,
      toasts: toasts(editor.toast),
      state: saveBarState(editor),
    }).toEqual({
      calls: [
        [
          {
            enabled: true,
            decoderEnabled: false,
            entries: [
              ...LOADED.entries,
              {
                material: 'Autre matière',
                operation: 'parting-off',
                insert: 'CODE-FICTIF-03',
                noseRadius: 0.4,
                note: 'Arrosage abondant.',
              },
            ],
          },
          7,
        ],
      ],
      toasts: [{ severity: 'success', detail: 'Guide des plaquettes enregistré' }],
      state: 'Aucune modification',
    });
  });

  it('Given the decoder switch checked When the guide is saved Then the decoder is sent switched on, the guide switch untouched, and nothing is left to save', async () => {
    const editor = await openEditor();

    await toggleSwitch(editor, 'admin-insert-guide-decoder-enabled');
    await save(editor);

    expect({
      sent: editor.saveGuide.mock.calls.map(([guide, version]) => [
        guide.enabled,
        guide.decoderEnabled,
        guide.entries.length,
        version,
      ]),
      state: saveBarState(editor),
      checked: checked(editor, 'admin-insert-guide-decoder-enabled'),
    }).toEqual({ sent: [[false, true, 2, 7]], state: 'Aucune modification', checked: true });
  });

  it('Given a first save answered with version 8 When the admin edits again and saves Then the second write carries version 8', async () => {
    const editor = await openEditor();

    await toggleSwitch(editor);
    await save(editor);
    await toggleSwitch(editor);
    await save(editor);

    expect(editor.saveGuide.mock.calls.map(([, version]) => version)).toEqual([7, 8]);
  });

  it('Given a version changed elsewhere When the save is refused with a 409 Then the admin is told to reload and the draft is kept', async () => {
    const editor = await openEditor({
      saveGuide: vi.fn((): Observable<InsertGuideDocument> =>
        throwError(() => apiRejection(409, 'version périmée')),
      ),
    });

    await toggleSwitch(editor);
    await save(editor);

    expect({
      toasts: toasts(editor.toast),
      enabled: (control(editor, 'admin-insert-guide-enabled') as HTMLInputElement | null)?.checked,
      state: saveBarState(editor),
      disabled: nativeButton(byTestId(editor.host, 'savebar-submit'))?.disabled,
    }).toEqual({
      toasts: [{ severity: 'error', detail: CONFLICT }],
      enabled: true,
      state: '1 modification non enregistrée',
      disabled: false,
    });
  });

  it('Given a 400 with validation messages When the guide is saved Then the toast reads the label and the detail', async () => {
    const editor = await openEditor({
      saveGuide: vi.fn((): Observable<InsertGuideDocument> =>
        throwError(() => apiRejection(400, ['entries.0.insert too long'])),
      ),
    });

    await toggleSwitch(editor);
    await save(editor);

    expect(toasts(editor.toast)).toEqual([
      { severity: 'error', detail: `${SAVE_FAILURE} Détail\u00a0: entries.0.insert too long` },
    ]);
  });

  it('Given a save in progress When the bar renders Then « Enregistrer » is disabled until the answer', async () => {
    const editor = await openEditor({
      saveGuide: vi.fn((): Observable<InsertGuideDocument> => NEVER),
    });

    await toggleSwitch(editor);
    await save(editor);

    expect({
      calls: editor.saveGuide.mock.calls.length,
      disabled: nativeButton(byTestId(editor.host, 'savebar-submit'))?.disabled,
    }).toEqual({ calls: 1, disabled: true });
  });
});

describe('AdminInsertGuide: validation', () => {
  it('Given a blank line When « Enregistrer » is pressed Then nothing is sent and each required field shows its alert', async () => {
    const editor = await openEditor();

    await addRow(editor);
    await save(editor);

    const error = (field: string): { text: string; role: string | null } => {
      const element = byTestId(editor.host, `admin-insert-guide-${field}-error`);
      return { text: normalized(element), role: element?.getAttribute('role') ?? null };
    };
    expect({
      calls: editor.saveGuide.mock.calls.length,
      material: error('material'),
      operation: error('operation'),
      insert: error('insert'),
      radius: error('radius'),
      note: byTestId(editor.host, 'admin-insert-guide-note-error'),
    }).toEqual({
      calls: 0,
      material: { text: 'Ce champ est obligatoire', role: 'alert' },
      operation: { text: 'Choisissez une opération', role: 'alert' },
      insert: { text: 'Ce champ est obligatoire', role: 'alert' },
      radius: { text: 'Ce champ est obligatoire', role: 'alert' },
      note: null,
    });
  });

  it.each([
    {
      field: 'material',
      text: 'M'.repeat(81),
      message: 'La matière ne doit pas dépasser 80\u00a0caractères',
    },
    {
      field: 'insert',
      text: 'C'.repeat(41),
      message: 'La plaquette ne doit pas dépasser 40\u00a0caractères',
    },
    {
      field: 'note',
      text: 'R'.repeat(201),
      message: 'La remarque ne doit pas dépasser 200\u00a0caractères',
    },
    { field: 'material', text: '   ', message: 'Ce champ est obligatoire' },
    { field: 'radius', text: '0', message: 'Le rayon doit être supérieur à 0' },
    { field: 'radius', text: '-0.4', message: 'Le rayon doit être supérieur à 0' },
    { field: 'radius', text: '10.5', message: 'Le rayon ne doit pas dépasser 10\u00a0mm' },
    { field: 'radius', text: '0.125', message: 'Le rayon a au plus deux décimales' },
  ])(
    'Given « $text » in the $field When the guide is saved Then nothing is sent and the field says « $message »',
    async ({ field, text, message }) => {
      const editor = await openEditor();

      await fill(editor, `admin-insert-guide-${field}`, text);
      await save(editor);

      expect({
        calls: editor.saveGuide.mock.calls.length,
        error: testIdText(editor.host, `admin-insert-guide-${field}-error`),
      }).toEqual({ calls: 0, error: message });
    },
  );

  it.each(['10', '1.15', '0.05'])(
    'Given the radius %s When the guide is saved Then it is accepted',
    async (radius) => {
      const editor = await openEditor();

      await fill(editor, 'admin-insert-guide-radius', radius);
      await save(editor);

      expect(editor.saveGuide.mock.calls[0]?.[0].entries[0]?.noseRadius).toBe(Number(radius));
    },
  );

  it('Given 301 lines read When the guide is saved Then nothing is sent and the list says 300 lines at most', async () => {
    const editor = await openEditor({
      getDocument: vi.fn((): Observable<InsertGuideDocument> =>
        of({ ...LOADED, entries: Array.from({ length: 301 }, () => anEntry()) }),
      ),
    });

    await save(editor);

    expect({
      calls: editor.saveGuide.mock.calls.length,
      error: testIdText(editor.host, 'admin-insert-guide-entries-error'),
    }).toEqual({ calls: 0, error: '300\u00a0lignes au plus' });
  }, 15_000);
});

describe('AdminInsertGuide: confidentialité', () => {
  it('Given a line holding a plan reference When it renders Then that line warns, the others do not', async () => {
    const editor = await openEditor();

    await fill(editor, 'admin-insert-guide-note', 'Voir plan n° 12', 1);

    const warnings = [
      ...editor.host.querySelectorAll('[data-testid="admin-insert-guide-row"]'),
    ].map((row) => normalized(byTestId(row, 'admin-insert-guide-confidential')));
    expect(warnings).toEqual([
      '',
      "Référence repérée\u00a0: «\u00a0plan n° 12\u00a0». Vérifiez qu'elle ne désigne ni une pièce, ni un plan, ni un ordre de fabrication.",
    ]);
  });

  it.each<[string, string]>([
    ['a decodable ISO insert code', 'CNMG 120408'],
    ['a decodable ISO insert code with a maker suffix', 'CCGT 09T304-PM'],
  ])(
    'Given %s in the insert field When it renders Then no reference is reported',
    async (_, code) => {
      const editor = await openEditor();

      await fill(editor, 'admin-insert-guide-insert', code);

      expect(
        normalized(
          byTestId(
            editor.host.querySelector('[data-testid="admin-insert-guide-row"]')!,
            'admin-insert-guide-confidential',
          ),
        ),
      ).toBe('');
    },
  );

  it.each<[string, string, string]>([
    ['a long number', 'CNMG 120408 12345', '12345'],
    ['a work order', 'CNMG 120408 OF n° 4521', 'OF n° 4521'],
  ])(
    'Given a decodable ISO insert code followed by %s When it renders Then what follows the code is still reported',
    async (_, insert, reference) => {
      const editor = await openEditor();

      await fill(editor, 'admin-insert-guide-insert', insert);

      expect(
        normalized(
          byTestId(
            editor.host.querySelector('[data-testid="admin-insert-guide-row"]')!,
            'admin-insert-guide-confidential',
          ),
        ),
      ).toContain(reference);
    },
  );

  it('Given a non-decodable insert code with a long number When it renders Then it is still reported', async () => {
    const editor = await openEditor();

    await fill(editor, 'admin-insert-guide-insert', 'CODE 123456');

    expect(
      normalized(
        byTestId(
          editor.host.querySelector('[data-testid="admin-insert-guide-row"]')!,
          'admin-insert-guide-confidential',
        ),
      ),
    ).toContain('123456');
  });

  it('Given a line holding a reference When the guide is saved Then the warning does not block it', async () => {
    const editor = await openEditor();

    await fill(editor, 'admin-insert-guide-insert', 'CODE 123456');
    await save(editor);

    expect(editor.saveGuide.mock.calls.map(([guide]) => guide.entries[0]?.insert)).toEqual([
      'CODE 123456',
    ]);
  });
});
