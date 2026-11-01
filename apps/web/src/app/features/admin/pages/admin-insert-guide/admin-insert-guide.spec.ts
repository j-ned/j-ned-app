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
  InsertGuideEntry,
} from '@features/workshop/domain/models/insert-guide.model';
import { HttpInsertGuideGateway } from '@features/workshop/infra/gateways/http-insert-guide.gateway';
import { aGenericEntry, anEntry } from '@features/workshop/testing/insert-guide-builders';
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

const aDocument = (entries: readonly InsertGuideEntry[]): InsertGuideDocument => ({
  ...LOADED,
  entries,
});

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

const openWith = (entries: readonly InsertGuideEntry[]): Promise<Editor> =>
  openEditor({ getDocument: vi.fn((): Observable<InsertGuideDocument> => of(aDocument(entries))) });

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

async function fillTool(
  editor: Editor,
  index: number,
  tool: { operation: string; insert: string; radius: string; note?: string },
): Promise<void> {
  await fill(editor, 'admin-insert-guide-operation', tool.operation, index);
  await fill(editor, 'admin-insert-guide-insert', tool.insert, index);
  await fill(editor, 'admin-insert-guide-radius', tool.radius, index);
  await fill(editor, 'admin-insert-guide-note', tool.note ?? '', index);
}

async function toggleSwitch(editor: Editor, testId = 'admin-insert-guide-enabled'): Promise<void> {
  control(editor, testId)?.click();
  await settle(editor.fixture);
}

const checked = (editor: Editor, testId: string): boolean | undefined =>
  (control(editor, testId) as HTMLInputElement | null)?.checked;

const addTool = (editor: Editor, group = 0): Promise<void> =>
  pressTestId(editor.fixture, 'admin-insert-guide-add-tool', group);

const addGroup = (editor: Editor): Promise<void> =>
  pressTestId(editor.fixture, 'admin-insert-guide-add-group');

const addGeneric = (editor: Editor): Promise<void> =>
  pressTestId(editor.fixture, 'admin-insert-guide-add-generic');

const removeTool = (editor: Editor, index: number): Promise<void> =>
  pressTestId(editor.fixture, 'admin-insert-guide-remove', index);

const removeGroup = (editor: Editor, group: number): Promise<void> =>
  pressTestId(editor.fixture, 'admin-insert-guide-remove-group', group);

async function save(editor: Editor): Promise<void> {
  await pressTestId(editor.fixture, 'savebar-submit');
  await settleBounded(editor.fixture);
}

const toasts = (toast: Spies['toast']): readonly ToastMessage[] =>
  toast.mock.calls.map(([message]) => message);

const saveBarState = (editor: Editor): string => normalized(byTestId(editor.host, 'savebar-state'));

const groups = (editor: Editor): HTMLDetailsElement[] => [
  ...editor.host.querySelectorAll<HTMLDetailsElement>('[data-testid="admin-insert-guide-group"]'),
];

const group = (editor: Editor, index: number): HTMLDetailsElement | null =>
  groups(editor)[index] ?? null;

const toolCount = (editor: Editor): number =>
  editor.host.querySelectorAll('[data-testid="admin-insert-guide-tool"]').length;

type Summary = { title: string; count: string; open: boolean };

const summaries = (editor: Editor): Summary[] =>
  groups(editor).map((details) => ({
    title: normalized(byTestId(details, 'admin-insert-guide-group-title')),
    count: normalized(byTestId(details, 'admin-insert-guide-group-count')),
    open: details.open,
  }));

async function clickSummary(editor: Editor, index: number): Promise<void> {
  group(editor, index)?.querySelector('summary')?.click();
  await settle(editor.fixture);
}

// Nom accessible d'un champ : `aria-label`, sinon le texte de son `label[for]`, masqué ou non.
const accessibleName = (editor: Editor, field: Element | null): string | null =>
  field?.getAttribute('aria-label') ??
  (field?.id ? normalized(editor.host.querySelector(`label[for="${field.id}"]`)) || null : null);

const focused = (element: Element | null): boolean =>
  element !== null && document.activeElement === element;

describe('AdminInsertGuide: ouverture', () => {
  it('Given the guide of the API When /admin/guide-plaquettes is opened Then it is read once, the page is titled and the form shows the switch, the material block and its tools', async () => {
    const editor = await openEditor();

    expect({
      crash: editor.crash,
      requested: editor.getDocument.mock.calls.length,
      title: testIdText(editor.host, 'admin-page-title'),
      headings: editor.host.querySelectorAll('h1').length,
      enabled: checked(editor, 'admin-insert-guide-enabled'),
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
      materials: ['Matière fictive'],
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
      tools: toolCount(editor),
    }).toEqual({ failed: true, calls: 2, tools: 2 });
  });
});

describe('AdminInsertGuide: blocs par matière', () => {
  const MIXED = [
    aGenericEntry({ insert: 'BARRE-FICTIVE-01' }),
    anEntry({ material: '1.8522 (33CrMoV12)', insert: 'CODE-A' }),
    anEntry({ material: 'Inox fictif', insert: 'CODE-B' }),
    anEntry({ material: '1.8522 (33CrMoV12)', insert: 'CODE-C', operation: 'threading' }),
  ];

  it('Given lines of two materials and a generic line When the page renders Then one folded block per material, in order of appearance, the generic block last, each with its count', async () => {
    const editor = await openWith(MIXED);

    expect({
      summaries: summaries(editor),
      tag: group(editor, 0)?.tagName,
      summary: group(editor, 0)?.firstElementChild?.tagName,
    }).toEqual({
      summaries: [
        { title: '1.8522 (33CrMoV12)', count: '2 outils', open: false },
        { title: 'Inox fictif', count: '1 outil', open: false },
        { title: 'Toutes matières', count: '1 outil', open: false },
      ],
      tag: 'DETAILS',
      summary: 'SUMMARY',
    });
  });

  it('Given a folded block When its summary is clicked Then it opens, and folds back on a second click', async () => {
    const editor = await openEditor();

    await clickSummary(editor, 0);
    const opened = group(editor, 0)?.open;
    await clickSummary(editor, 0);

    expect([opened, group(editor, 0)?.open]).toEqual([true, false]);
  });

  it('Given a material block When « Ajouter un outil » is pressed Then a blank tool closes its list, the block opens, its count follows and the new operation takes the focus', async () => {
    const editor = await openEditor();

    await addTool(editor);

    expect({
      tools: toolCount(editor),
      summary: summaries(editor)[0],
      operation: control(editor, 'admin-insert-guide-operation', 2)?.value,
      focused: focused(control(editor, 'admin-insert-guide-operation', 2)),
      state: saveBarState(editor),
    }).toEqual({
      tools: 3,
      summary: { title: 'Matière fictive', count: '3 outils', open: true },
      operation: '',
      focused: true,
      state: '1 modification non enregistrée',
    });
  });

  it('Given a block opened by an added tool then folded by hand When another tool is added Then it opens again', async () => {
    const editor = await openEditor();

    await addTool(editor);
    await clickSummary(editor, 0);
    const folded = group(editor, 0)?.open;
    await addTool(editor);

    expect([folded, group(editor, 0)?.open, toolCount(editor)]).toEqual([false, true, 4]);
  });

  it('Given blocks and the generic block When « Ajouter une matière » is pressed Then an open block with one blank tool comes before the generic block and its material takes the focus', async () => {
    const editor = await openWith(MIXED);

    await addGroup(editor);

    expect({
      summaries: summaries(editor),
      material: control(editor, 'admin-insert-guide-material', 2)?.value,
      focused: focused(control(editor, 'admin-insert-guide-material', 2)),
      tools: group(editor, 2)?.querySelectorAll('[data-testid="admin-insert-guide-tool"]').length,
    }).toEqual({
      summaries: [
        { title: '1.8522 (33CrMoV12)', count: '2 outils', open: false },
        { title: 'Inox fictif', count: '1 outil', open: false },
        { title: 'Nouvelle matière', count: '1 outil', open: true },
        { title: 'Toutes matières', count: '1 outil', open: false },
      ],
      material: '',
      focused: true,
      tools: 1,
    });
  });

  it('Given a new block When its material is typed Then its summary takes the name', async () => {
    const editor = await openEditor();

    await addGroup(editor);
    await fill(editor, 'admin-insert-guide-material', 'Titane fictif', 1);

    expect(summaries(editor)[1]?.title).toBe('Titane fictif');
  });

  it('Given no generic block When « Ajouter le bloc Toutes matières » is pressed Then an open generic block with one blank tool comes last, without material field, its operation focused, and the button is gone', async () => {
    const editor = await openEditor();
    const offered = byTestId(editor.host, 'admin-insert-guide-add-generic') !== null;

    await addGeneric(editor);

    expect({
      offered,
      summaries: summaries(editor),
      materials: group(editor, 1)?.querySelectorAll('[data-testid="admin-insert-guide-material"]')
        .length,
      focused: focused(control(editor, 'admin-insert-guide-operation', 2)),
      still: byTestId(editor.host, 'admin-insert-guide-add-generic'),
    }).toEqual({
      offered: true,
      summaries: [
        { title: 'Matière fictive', count: '2 outils', open: false },
        { title: 'Toutes matières', count: '1 outil', open: true },
      ],
      materials: 0,
      focused: true,
      still: null,
    });
  });

  it('Given a block of two tools When the first is removed Then the second stays and the focus goes to « Ajouter un outil » of the block', async () => {
    const editor = await openEditor();
    const remove = nativeButton(byTestId(editor.host, 'admin-insert-guide-remove'));
    const label = {
      ariaLabel: remove?.getAttribute('aria-label') ?? null,
      text: normalized(remove),
    };

    await removeTool(editor, 0);

    expect({
      label,
      inserts: values(editor, 'admin-insert-guide-insert'),
      count: summaries(editor)[0]?.count,
      focused: focused(nativeButton(byTestId(editor.host, 'admin-insert-guide-add-tool'))),
    }).toEqual({
      label: { ariaLabel: null, text: "Retirer l'outil 1 (Matière fictive)" },
      inserts: ['CODE-FICTIF-02'],
      count: '1 outil',
      focused: true,
    });
  });

  it('Given a block of one tool When it is removed Then the block goes too and the focus goes to « Ajouter une matière »', async () => {
    const editor = await openWith(MIXED);

    await removeTool(editor, 2);

    expect({
      titles: summaries(editor).map(({ title }) => title),
      focused: focused(nativeButton(byTestId(editor.host, 'admin-insert-guide-add-group'))),
    }).toEqual({ titles: ['1.8522 (33CrMoV12)', 'Toutes matières'], focused: true });
  });

  it('Given a block When « Retirer la matière » is pressed Then the block goes with all its tools and the focus goes to « Ajouter une matière »', async () => {
    const editor = await openWith(MIXED);
    const remove = nativeButton(byTestId(editor.host, 'admin-insert-guide-remove-group'));
    const name = remove?.getAttribute('aria-label') ?? normalized(remove);

    await removeGroup(editor, 0);

    expect({
      name,
      titles: summaries(editor).map(({ title }) => title),
      inserts: values(editor, 'admin-insert-guide-insert'),
      focused: focused(nativeButton(byTestId(editor.host, 'admin-insert-guide-add-group'))),
    }).toEqual({
      name: 'Retirer la matière 1.8522 (33CrMoV12)',
      titles: ['Inox fictif', 'Toutes matières'],
      inserts: ['CODE-B', 'BARRE-FICTIVE-01'],
      focused: true,
    });
  });

  it('Given a block of two tools When its material is corrected and the guide saved Then both tools are sent with the corrected material', async () => {
    const editor = await openEditor();

    await fill(editor, 'admin-insert-guide-material', ' Matière corrigée ');
    await save(editor);

    expect(
      editor.saveGuide.mock.calls.map(([guide]) => guide.entries.map(({ material }) => material)),
    ).toEqual([['Matière corrigée', 'Matière corrigée']]);
  });

  it('Given a block opened by hand When the guide is saved successfully Then the block stays open', async () => {
    const editor = await openWith(MIXED);

    await clickSummary(editor, 1);
    await toggleSwitch(editor);
    await save(editor);

    expect({
      calls: editor.saveGuide.mock.calls.length,
      open: summaries(editor).map(({ open }) => open),
    }).toEqual({ calls: 1, open: [false, true, false] });
  });
});

describe('AdminInsertGuide: accessibilité des blocs', () => {
  it('Given a block When it renders Then its material field is labelled, required, and its tools are named by column, rank and material', async () => {
    const editor = await openEditor();
    const material = control(editor, 'admin-insert-guide-material');
    const tool = byTestId(editor.host, 'admin-insert-guide-tool', 1);
    const fields = [...(tool?.querySelectorAll<Control>('input, select') ?? [])];

    expect({
      material: {
        label: normalized(editor.host.querySelector(`label[for="${material?.id}"]`)),
        required: material?.getAttribute('aria-required'),
      },
      tool: tool?.getAttribute('aria-label'),
      fields: fields.map((field) => ({
        name: accessibleName(editor, field),
        required: field.getAttribute('aria-required'),
      })),
      radius: {
        type: control(editor, 'admin-insert-guide-radius')?.getAttribute('type'),
        step: control(editor, 'admin-insert-guide-radius')?.getAttribute('step'),
      },
    }).toEqual({
      material: { label: 'Nom de la matière', required: 'true' },
      tool: 'Outil 2, Matière fictive',
      fields: [
        { name: 'Opération (outil 2, Matière fictive)', required: 'true' },
        { name: 'Plaquette (outil 2, Matière fictive)', required: 'true' },
        { name: 'Rayon de bec en mm (outil 2, Matière fictive)', required: null },
        { name: 'Remarque (outil 2, Matière fictive)', required: null },
      ],
      radius: { type: 'number', step: '0.01' },
    });
  });

  it('Given the generic block and a new block When they render Then their tools are named after « Toutes matières » and after the block rank', async () => {
    const editor = await openWith([aGenericEntry()]);

    await addGroup(editor);

    expect([
      accessibleName(editor, control(editor, 'admin-insert-guide-insert', 0)),
      accessibleName(editor, control(editor, 'admin-insert-guide-insert', 1)),
    ]).toEqual(['Plaquette (outil 1, bloc 1)', 'Plaquette (outil 1, Toutes matières)']);
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

  it('Given an invalid tool field When the guide is saved Then its alert is described on the field', async () => {
    const editor = await openEditor();

    await fill(editor, 'admin-insert-guide-insert', '');
    await save(editor);

    const field = control(editor, 'admin-insert-guide-insert');
    const error = byTestId(editor.host, 'admin-insert-guide-insert-error');
    expect({
      invalid: field?.getAttribute('aria-invalid'),
      describedBy: (field?.getAttribute('aria-describedby') ?? '')
        .split(' ')
        .includes(error?.id ?? '-'),
      role: error?.getAttribute('role'),
    }).toEqual({ invalid: 'true', describedBy: true, role: 'alert' });
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

  it('Given the guide switched on, a tool added to the block and a new material When it is saved Then the guide is sent flat with the version read, success is told and nothing is left to save', async () => {
    const editor = await openEditor();

    await toggleSwitch(editor);
    await addTool(editor);
    await fillTool(editor, 2, {
      operation: 'grooving',
      insert: 'CODE-FICTIF-04',
      radius: '0.2',
    });
    await addGroup(editor);
    await fill(editor, 'admin-insert-guide-material', ' Autre matière ', 1);
    await fillTool(editor, 3, {
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
                material: 'Matière fictive',
                operation: 'grooving',
                insert: 'CODE-FICTIF-04',
                noseRadius: 0.2,
              },
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
      enabled: checked(editor, 'admin-insert-guide-enabled'),
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
  const error = (editor: Editor, field: string): { text: string; role: string | null } => {
    const element = byTestId(editor.host, `admin-insert-guide-${field}-error`);
    return { text: normalized(element), role: element?.getAttribute('role') ?? null };
  };

  it('Given a new blank block When « Enregistrer » is pressed Then nothing is sent and each required field shows its alert, the radius and the note none', async () => {
    const editor = await openEditor();

    await addGroup(editor);
    await save(editor);

    expect({
      calls: editor.saveGuide.mock.calls.length,
      material: error(editor, 'material'),
      operation: error(editor, 'operation'),
      insert: error(editor, 'insert'),
      radius: byTestId(editor.host, 'admin-insert-guide-radius-error'),
      note: byTestId(editor.host, 'admin-insert-guide-note-error'),
    }).toEqual({
      calls: 0,
      material: { text: 'Ce champ est obligatoire', role: 'alert' },
      operation: { text: 'Choisissez une opération', role: 'alert' },
      insert: { text: 'Ce champ est obligatoire', role: 'alert' },
      radius: null,
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

  it.each([' Matière fictive ', 'Matière fictive'])(
    'Given a second block named « %s » like the first When the guide is saved Then nothing is sent and the second block offers to merge into the first',
    async (name) => {
      const editor = await openEditor();

      await addGroup(editor);
      await fill(editor, 'admin-insert-guide-material', name, 1);
      await fillTool(editor, 2, { operation: 'boring', insert: 'CODE-FICTIF-05', radius: '' });
      await save(editor);

      expect({
        calls: editor.saveGuide.mock.calls.length,
        errors: [
          ...editor.host.querySelectorAll('[data-testid="admin-insert-guide-material-error"]'),
        ].map(normalized),
        second: (
          group(editor, 1)?.querySelector('[data-testid="admin-insert-guide-material-error"]') ??
          null
        )?.getAttribute('role'),
      }).toEqual({
        calls: 0,
        errors: [
          'Le bloc «\u00a0Matière fictive\u00a0» existe déjà\u00a0: ajoutez-y ces outils, puis retirez ce bloc',
        ],
        second: 'alert',
      });
    },
  );

  it('Given an invalid field in a folded block When the guide is saved Then that block opens, the valid one stays folded, and the field takes the focus', async () => {
    const editor = await openWith([
      anEntry({ material: 'Acier fictif' }),
      anEntry({ material: 'Inox fictif', insert: 'CODE-FICTIF-02' }),
    ]);

    await fill(editor, 'admin-insert-guide-radius', '0', 1);
    const folded = summaries(editor).map(({ open }) => open);
    await save(editor);

    expect({
      folded,
      calls: editor.saveGuide.mock.calls.length,
      open: summaries(editor).map(({ open }) => open),
      focused: focused(control(editor, 'admin-insert-guide-radius', 1)),
    }).toEqual({ folded: [false, false], calls: 0, open: [false, true], focused: true });
  });

  it('Given 301 tools read When the guide is saved Then nothing is sent and the list says 300 tools at most', async () => {
    const editor = await openWith(Array.from({ length: 301 }, () => anEntry()));

    await save(editor);

    expect({
      calls: editor.saveGuide.mock.calls.length,
      error: testIdText(editor.host, 'admin-insert-guide-groups-error'),
    }).toEqual({ calls: 0, error: '300\u00a0outils au plus, toutes matières confondues' });
  }, 15_000);

  it('Given 300 tools spread over two blocks When the guide is saved Then it is sent', async () => {
    const editor = await openWith(
      Array.from({ length: 300 }, (_, index) =>
        anEntry({ material: index % 2 === 0 ? 'Acier fictif' : 'Inox fictif' }),
      ),
    );

    await save(editor);

    expect(editor.saveGuide.mock.calls[0]?.[0].entries.length).toBe(300);
  }, 15_000);
});

describe('AdminInsertGuide: rayon facultatif', () => {
  it('Given a tool When its radius renders Then it is described as optional', async () => {
    const editor = await openEditor();
    const describedBy =
      control(editor, 'admin-insert-guide-radius')?.getAttribute('aria-describedby') ?? '';

    expect(
      describedBy === '' ? null : normalized(editor.host.querySelector(`[id="${describedBy}"]`)),
    ).toBe("Rayon de bec facultatif : laissez-le vide quand l'outil n'a pas de rayon unique.");
  });

  it('Given the radius of a tool erased When the guide is saved Then the tool is sent without radius', async () => {
    const editor = await openEditor();

    await fill(editor, 'admin-insert-guide-radius', '');
    await save(editor);

    expect(editor.saveGuide.mock.calls.map(([guide]) => guide.entries[0])).toEqual([
      {
        material: 'Matière fictive',
        operation: 'external-roughing',
        insert: 'CODE-FICTIF-01',
        note: 'Remarque fictive.',
      },
    ]);
  });
});

describe('AdminInsertGuide: toutes matières', () => {
  it('Given a line for all materials read When it renders Then it sits in the generic block, without material field, its radius blank', async () => {
    const editor = await openWith([aGenericEntry(), ...LOADED.entries]);

    expect({
      titles: summaries(editor).map(({ title }) => title),
      materials: groups(editor).map(
        (details) => details.querySelectorAll('[data-testid="admin-insert-guide-material"]').length,
      ),
      radius: control(editor, 'admin-insert-guide-radius', 2)?.value,
      generic: byTestId(editor.host, 'admin-insert-guide-add-generic'),
    }).toEqual({
      titles: ['Matière fictive', 'Toutes matières'],
      materials: [1, 0],
      radius: '',
      generic: null,
    });
  });

  it('Given the generic block added with a boring tool without radius When the guide is saved Then it is accepted and sent flagged, without material nor radius', async () => {
    const editor = await openEditor();

    await addGeneric(editor);
    await fillTool(editor, 2, {
      operation: 'boring',
      insert: 'BARRE-FICTIVE-01',
      radius: '',
      note: 'Diamètre au besoin.',
    });
    await save(editor);

    expect(editor.saveGuide.mock.calls.map(([guide]) => guide.entries[2])).toEqual([
      {
        allMaterials: true,
        operation: 'boring',
        insert: 'BARRE-FICTIVE-01',
        note: 'Diamètre au besoin.',
      },
    ]);
  });

  it('Given a tool of the generic block holding a plan reference When it renders Then it warns too', async () => {
    const editor = await openWith([aGenericEntry()]);

    await fill(editor, 'admin-insert-guide-note', 'Voir plan n° 12');

    expect(normalized(byTestId(editor.host, 'admin-insert-guide-confidential'))).toContain(
      'plan n° 12',
    );
  });
});

describe('AdminInsertGuide: confidentialité', () => {
  const warningOf = (editor: Editor, index: number): string =>
    normalized(
      byTestId(
        byTestId(editor.host, 'admin-insert-guide-tool', index) ?? editor.host,
        'admin-insert-guide-confidential',
      ),
    );

  it('Given a tool holding a plan reference When it renders Then that tool warns, the others do not', async () => {
    const editor = await openEditor();

    await fill(editor, 'admin-insert-guide-note', 'Voir plan n° 12', 1);

    expect([warningOf(editor, 0), warningOf(editor, 1)]).toEqual([
      '',
      "Référence repérée\u00a0: «\u00a0plan n° 12\u00a0». Vérifiez qu'elle ne désigne ni une pièce, ni un plan, ni un ordre de fabrication.",
    ]);
  });

  it('Given a material name holding a work order When it renders Then its block warns, under the name', async () => {
    const editor = await openEditor();

    await fill(editor, 'admin-insert-guide-material', 'Acier OF n° 4521');

    expect({
      block: normalized(
        byTestId(group(editor, 0) ?? editor.host, 'admin-insert-guide-material-confidential'),
      ),
      tools: [warningOf(editor, 0), warningOf(editor, 1)],
    }).toEqual({
      block:
        "Référence repérée\u00a0: «\u00a0OF n° 4521\u00a0». Vérifiez qu'elle ne désigne ni une pièce, ni un plan, ni un ordre de fabrication.",
      tools: ['', ''],
    });
  });

  it.each<[string, string]>([
    ['a decodable ISO insert code', 'CNMG 120408'],
    ['a decodable ISO insert code with a maker suffix', 'CCGT 09T304-PM'],
  ])(
    'Given %s in the insert field When it renders Then no reference is reported',
    async (_, code) => {
      const editor = await openEditor();

      await fill(editor, 'admin-insert-guide-insert', code);

      expect(warningOf(editor, 0)).toBe('');
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

      expect(warningOf(editor, 0)).toContain(reference);
    },
  );

  it('Given a non-decodable insert code with a long number When it renders Then it is still reported', async () => {
    const editor = await openEditor();

    await fill(editor, 'admin-insert-guide-insert', 'CODE 123456');

    expect(warningOf(editor, 0)).toContain('123456');
  });

  it('Given a tool holding a reference When the guide is saved Then the warning does not block it', async () => {
    const editor = await openEditor();

    await fill(editor, 'admin-insert-guide-insert', 'CODE 123456');
    await save(editor);

    expect(editor.saveGuide.mock.calls.map(([guide]) => guide.entries[0]?.insert)).toEqual([
      'CODE 123456',
    ]);
  });
});

describe('AdminInsertGuide: suggestions', () => {
  const WITH_VALUES: InsertGuideDocument = {
    enabled: true,
    decoderEnabled: true,
    entries: [
      anEntry({ material: 'Inox fictif', insert: 'CNMG 120408' }),
      anEntry({ material: 'Acier fictif', insert: 'DNMG 150604', operation: 'threading' }),
      anEntry({ material: 'inox  fictif', insert: 'cnmg120408', operation: 'drilling' }),
    ],
    version: 3,
  };

  const openWithValues = (): Promise<Editor> =>
    openEditor({ getDocument: vi.fn(() => of(WITH_VALUES)) });

  const options = (editor: Editor): readonly string[] =>
    [...editor.host.querySelectorAll('[data-testid="suggest-option"]')].map(normalized);

  async function press(editor: Editor, testId: string, key: string, index: number): Promise<void> {
    control(editor, testId, index)?.dispatchEvent(
      new KeyboardEvent('keydown', { key, cancelable: true }),
    );
    await settle(editor.fixture);
  }

  it('Given the blocks read When the material of a new block is typed Then the field is a combobox proposing the materials read, once each', async () => {
    const editor = await openWithValues();
    await addGroup(editor);
    const field = control(editor, 'admin-insert-guide-material', 3);
    const listbox = editor.host.querySelector(`[id="${field?.getAttribute('aria-controls')}"]`);

    await fill(editor, 'admin-insert-guide-material', 'fic', 3);

    expect({
      role: field?.getAttribute('role'),
      listLabel: listbox?.getAttribute('aria-label'),
      options: options(editor),
    }).toEqual({
      role: 'combobox',
      listLabel: 'Matières déjà saisies',
      options: ['Acier fictif', 'Inox fictif'],
    });
  });

  it('Given the tools read When the insert of a new tool is typed Then the field proposes the inserts read, once each', async () => {
    const editor = await openWithValues();
    await addTool(editor, 0);
    const field = control(editor, 'admin-insert-guide-insert', 1);
    const listbox = editor.host.querySelector(`[id="${field?.getAttribute('aria-controls')}"]`);

    await fill(editor, 'admin-insert-guide-insert', 'nmg', 1);

    expect([listbox?.getAttribute('aria-label'), options(editor)]).toEqual([
      'Plaquettes déjà saisies',
      ['CNMG 120408', 'DNMG 150604'],
    ]);
  });

  it('Given a material typed in a new block When another block is typed Then the draft value is proposed too, and the read one stays proposed after its block is renamed', async () => {
    const editor = await openWithValues();
    await fill(editor, 'admin-insert-guide-material', 'Titane fictif', 0);
    await addGroup(editor);
    await fill(editor, 'admin-insert-guide-material', 'Laiton fictif', 3);
    await addGroup(editor);

    await fill(editor, 'admin-insert-guide-material', 'i', 4);

    expect(options(editor)).toEqual([
      'Inox fictif',
      'Acier fictif',
      'Laiton fictif',
      'Titane fictif',
    ]);
  });

  it('Given a generic block read When a new block is typed Then it proposes no material, and its insert is proposed', async () => {
    const editor = await openEditor({
      getDocument: vi.fn((): Observable<InsertGuideDocument> =>
        of({
          ...WITH_VALUES,
          entries: [aGenericEntry({ insert: 'BARRE-FICTIVE-01' }), ...WITH_VALUES.entries],
        }),
      ),
    });
    await addGroup(editor);
    const listed = (testId: string, index: number): readonly string[] => {
      const listbox = editor.host.querySelector(
        `[id="${control(editor, testId, index)?.getAttribute('aria-controls')}"]`,
      );
      return [...(listbox?.querySelectorAll('[data-testid="suggest-option"]') ?? [])].map(
        normalized,
      );
    };

    await fill(editor, 'admin-insert-guide-material', 'i', 3);
    await fill(editor, 'admin-insert-guide-insert', 'barre', 3);

    expect([
      listed('admin-insert-guide-material', 3),
      listed('admin-insert-guide-insert', 3),
    ]).toEqual([['Inox fictif', 'Acier fictif'], ['BARRE-FICTIVE-01']]);
  });

  it('Given a new block When its text matches a value exactly Then that value is not proposed to itself', async () => {
    const editor = await openWithValues();
    await addGroup(editor);

    await fill(editor, 'admin-insert-guide-material', 'Acier fictif', 3);

    expect(options(editor)).toEqual([]);
  });

  it('Given a block removed then a new one filled from the suggestions at the keyboard When the guide is saved Then the chosen texts are sent', async () => {
    const editor = await openWithValues();
    await removeGroup(editor, 1);
    await addGroup(editor);

    await fill(editor, 'admin-insert-guide-material', 'aci', 2);
    await press(editor, 'admin-insert-guide-material', 'ArrowDown', 2);
    await press(editor, 'admin-insert-guide-material', 'Enter', 2);
    await fill(editor, 'admin-insert-guide-operation', 'parting-off', 2);
    await fill(editor, 'admin-insert-guide-insert', 'dn', 2);
    await press(editor, 'admin-insert-guide-insert', 'ArrowDown', 2);
    await press(editor, 'admin-insert-guide-insert', 'Enter', 2);
    await fill(editor, 'admin-insert-guide-radius', '0.4', 2);
    await save(editor);

    expect(editor.saveGuide.mock.calls).toEqual([
      [
        {
          enabled: true,
          decoderEnabled: true,
          entries: [
            WITH_VALUES.entries[0],
            WITH_VALUES.entries[2],
            {
              material: 'Acier fictif',
              operation: 'parting-off',
              insert: 'DNMG 150604',
              noseRadius: 0.4,
            },
          ],
        },
        3,
      ],
    ]);
  });
});
