import { signal, type WritableSignal } from '@angular/core';
import { DocumentDraft } from './document-draft';
import type { FormTocSection } from './form-toc-entries';

type Sheet = {
  readonly version: number;
  readonly title: string;
  readonly lines: readonly string[];
};
type SheetDraft = { readonly title: string; readonly lines: readonly { text: string }[] };

const aSheet = (overrides: Partial<Sheet> = {}): Sheet => ({
  version: 3,
  title: 'Carnet',
  lines: ['Première ligne'],
  ...overrides,
});

const toSheetDraft = (sheet: Sheet | null): SheetDraft => ({
  title: sheet?.title ?? '',
  lines: (sheet?.lines ?? []).map((text) => ({ text })),
});

const SECTIONS: readonly FormTocSection<SheetDraft>[] = [
  { id: 'sheet-title', label: 'Titre', fields: ['title'] },
  { id: 'sheet-lines', label: 'Lignes', fields: ['lines'] },
];

function makeDraft(sheet: Sheet | null): {
  readonly loaded: WritableSignal<Sheet | null>;
  readonly draft: DocumentDraft<Sheet, SheetDraft>;
} {
  const loaded = signal<Sheet | null>(sheet);
  const draft = new DocumentDraft<Sheet, SheetDraft>({
    loaded,
    toDraft: toSheetDraft,
    sections: SECTIONS,
  });
  return { loaded, draft };
}

const retitle = (draft: DocumentDraft<Sheet, SheetDraft>, title: string): void =>
  draft.value.update((value) => ({ ...value, title }));

const tocStates = (draft: DocumentDraft<Sheet, SheetDraft>): readonly string[] =>
  draft.toc().map((entry) => entry.state);

describe('DocumentDraft: brouillon chargé', () => {
  it('Given a loaded document When the draft is created Then it reads the document, with nothing changed', () => {
    const { draft } = makeDraft(aSheet());

    expect({
      value: draft.value(),
      saved: draft.saved(),
      changes: draft.changes(),
      toc: draft.toc(),
      saving: draft.saving(),
    }).toEqual({
      value: { title: 'Carnet', lines: [{ text: 'Première ligne' }] },
      saved: aSheet(),
      changes: 0,
      toc: [
        { id: 'sheet-title', label: 'Titre', state: '' },
        { id: 'sheet-lines', label: 'Lignes', state: '' },
      ],
      saving: false,
    });
  });

  it('Given no document yet When it arrives Then the draft and the saved document follow it, with nothing changed', () => {
    const { loaded, draft } = makeDraft(null);
    const before = { value: draft.value(), saved: draft.saved() };

    loaded.set(aSheet({ title: 'Journal' }));

    expect({
      before,
      value: draft.value(),
      saved: draft.saved()?.title,
      changes: draft.changes(),
    }).toEqual({
      before: { value: { title: '', lines: [] }, saved: null },
      value: { title: 'Journal', lines: [{ text: 'Première ligne' }] },
      saved: 'Journal',
      changes: 0,
    });
  });

  it.each([
    {
      edit: 'the title changed',
      act: (draft: DocumentDraft<Sheet, SheetDraft>): void => retitle(draft, 'Autre'),
      changes: 1,
      toc: ['modifié', ''],
    },
    {
      edit: 'a line added',
      act: (draft: DocumentDraft<Sheet, SheetDraft>): void =>
        draft.value.update((value) => ({ ...value, lines: [...value.lines, { text: 'Ajout' }] })),
      changes: 1,
      toc: ['', 'modifié'],
    },
    {
      edit: 'the title and a line changed',
      act: (draft: DocumentDraft<Sheet, SheetDraft>): void => {
        retitle(draft, 'Autre');
        draft.value.update((value) => ({ ...value, lines: [{ text: 'Réécrite' }] }));
      },
      changes: 2,
      toc: ['modifié', 'modifié'],
    },
    {
      edit: 'the title changed then restored',
      act: (draft: DocumentDraft<Sheet, SheetDraft>): void => {
        retitle(draft, 'Autre');
        retitle(draft, 'Carnet');
      },
      changes: 0,
      toc: ['', ''],
    },
  ])(
    'Given a loaded document When $edit Then $changes change(s) are counted and the sections are marked accordingly',
    ({ act, changes, toc }) => {
      const { draft } = makeDraft(aSheet());

      act(draft);

      expect({ changes: draft.changes(), toc: tocStates(draft) }).toEqual({ changes, toc });
    },
  );
});

describe('DocumentDraft: quitter', () => {
  it.each([{ answer: true }, { answer: false }])(
    'Given no change then a change When leaving is asked Then it is allowed at once, then confirmed by the answer $answer',
    async ({ answer }) => {
      const { draft } = makeDraft(aSheet());
      const untouched = draft.canLeave();
      retitle(draft, 'Autre');

      const leave = draft.canLeave();
      const asked = draft.leave.asked();
      draft.leave.answer(answer);

      expect({ untouched, pending: leave instanceof Promise, asked, answer: await leave }).toEqual({
        untouched: true,
        pending: true,
        asked: true,
        answer,
      });
    },
  );

  it('Given the tab about to close When the draft is untouched then edited Then the browser warning is requested only once edited', () => {
    const { draft } = makeDraft(aSheet());
    const untouched = { preventDefault: vi.fn() };
    const edited = { preventDefault: vi.fn() };

    draft.warnBeforeUnload(untouched as unknown as BeforeUnloadEvent);
    retitle(draft, 'Autre');
    draft.warnBeforeUnload(edited as unknown as BeforeUnloadEvent);

    expect({
      untouched: untouched.preventDefault.mock.calls.length,
      edited: edited.preventDefault.mock.calls.length,
    }).toEqual({ untouched: 0, edited: 1 });
  });
});

describe('DocumentDraft: enregistrer', () => {
  it('Given an edited title When the write succeeds Then the returned document becomes the saved one, the draft and the baseline restart from it', async () => {
    const { draft } = makeDraft(aSheet());
    retitle(draft, '  Après ');
    const returned = aSheet({ version: 4, title: 'Après' });

    const result = await draft.save(async () => returned);

    expect({
      result,
      saved: draft.saved(),
      value: draft.value(),
      changes: draft.changes(),
      toc: tocStates(draft),
      leave: draft.canLeave(),
    }).toEqual({
      result: { success: true, data: aSheet({ version: 4, title: 'Après' }) },
      saved: aSheet({ version: 4, title: 'Après' }),
      value: { title: 'Après', lines: [{ text: 'Première ligne' }] },
      changes: 0,
      toc: ['', ''],
      leave: true,
    });
  });

  it('Given a saved document When the admin edits again Then the change is counted against the returned document', async () => {
    const { draft } = makeDraft(aSheet());
    retitle(draft, 'Après');
    await draft.save(async () => aSheet({ version: 4, title: 'Après' }));

    retitle(draft, 'Carnet');

    expect({ changes: draft.changes(), toc: tocStates(draft) }).toEqual({
      changes: 1,
      toc: ['modifié', ''],
    });
  });

  it('Given an edited title When the write is rejected Then the failure is returned and the draft, its changes and the saved document are kept', async () => {
    const { draft } = makeDraft(aSheet());
    retitle(draft, 'Après');
    const error = new Error('conflict');

    const result = await draft.save(async () => Promise.reject(error));

    expect({
      result,
      saved: draft.saved(),
      value: draft.value().title,
      changes: draft.changes(),
    }).toEqual({
      result: { success: false, error },
      saved: aSheet(),
      value: 'Après',
      changes: 1,
    });
  });

  it.each([{ outcome: 'resolves' }, { outcome: 'rejects' }] as const)(
    'Given a write in progress When it $outcome Then saving is on meanwhile and off after',
    async ({ outcome }) => {
      const { draft } = makeDraft(aSheet());
      retitle(draft, 'Après');
      let settleWrite: () => void = () => undefined;
      const write = (): Promise<Sheet> =>
        new Promise<Sheet>((resolve, reject) => {
          settleWrite = (): void =>
            outcome === 'resolves' ? resolve(aSheet({ title: 'Après' })) : reject(new Error('x'));
        });

      const saving = draft.save(write);
      const during = draft.saving();
      settleWrite();
      await saving;

      expect({ during, after: draft.saving() }).toEqual({ during: true, after: false });
    },
  );
});
