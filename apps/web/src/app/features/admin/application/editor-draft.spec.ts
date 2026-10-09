import { signal, type WritableSignal } from '@angular/core';
import { EditorDraft, type EditedDraft } from './editor-draft';
import type { FormTocSection } from './form-toc-entries';

type Note = { readonly id: string; readonly title: string; readonly tags: readonly string[] };
type NoteDraft = { readonly title: string; readonly tags: readonly string[] };

const aNote = (overrides: Partial<Note> = {}): Note => ({
  id: 'n-1',
  title: 'Carnet',
  tags: ['Angular'],
  ...overrides,
});

const toNoteDraft = (note: Note | null): NoteDraft => ({
  title: note?.title ?? '',
  tags: [...(note?.tags ?? [])],
});

const SECTIONS: readonly FormTocSection<EditedDraft<NoteDraft>>[] = [
  { id: 'note-text', label: 'Texte', fields: ['title', 'tags'] },
  { id: 'note-cover', label: 'Couverture', fields: ['cover'] },
];

const COVER = new File(['x'], 'cover.png', { type: 'image/png' });

function makeDraft(entity: Note | null): {
  readonly loaded: WritableSignal<Note | null>;
  readonly draft: EditorDraft<Note, NoteDraft>;
} {
  const loaded = signal<Note | null>(entity);
  const draft = new EditorDraft<Note, NoteDraft>({
    loaded,
    toDraft: toNoteDraft,
    sections: SECTIONS,
  });
  return { loaded, draft };
}

const tocStates = (draft: EditorDraft<Note, NoteDraft>): readonly string[] =>
  draft.toc().map((entry) => entry.state);

describe('EditorDraft: brouillon chargé', () => {
  it('Given a loaded entity When the draft is created Then it reads the entity, with nothing changed', () => {
    const note = aNote();
    const { draft } = makeDraft(note);

    expect({
      value: draft.value(),
      saved: draft.saved(),
      changes: draft.changes(),
      toc: draft.toc(),
    }).toEqual({
      value: { title: 'Carnet', tags: ['Angular'] },
      saved: aNote(),
      changes: 0,
      toc: [
        { id: 'note-text', label: 'Texte', state: '' },
        { id: 'note-cover', label: 'Couverture', state: '' },
      ],
    });
  });

  it.each([
    {
      edit: 'the title changed',
      act: (draft: EditorDraft<Note, NoteDraft>): void =>
        draft.value.update((value) => ({ ...value, title: 'Autre' })),
      changes: 1,
      toc: ['modifié', ''],
    },
    {
      edit: 'a tag added',
      act: (draft: EditorDraft<Note, NoteDraft>): void =>
        draft.value.update((value) => ({ ...value, tags: [...value.tags, 'RxJS'] })),
      changes: 1,
      toc: ['modifié', ''],
    },
    {
      edit: 'a cover chosen',
      act: (draft: EditorDraft<Note, NoteDraft>): void => draft.selectCover(COVER),
      changes: 1,
      toc: ['', 'modifié'],
    },
    {
      edit: 'the title changed then restored',
      act: (draft: EditorDraft<Note, NoteDraft>): void => {
        draft.value.update((value) => ({ ...value, title: 'Autre' }));
        draft.value.update((value) => ({ ...value, title: 'Carnet' }));
      },
      changes: 0,
      toc: ['', ''],
    },
    {
      edit: 'a cover chosen then cleared',
      act: (draft: EditorDraft<Note, NoteDraft>): void => {
        draft.selectCover(COVER);
        draft.clearCover();
      },
      changes: 0,
      toc: ['', ''],
    },
  ])(
    'Given a loaded entity When $edit Then $changes change is counted and the sections are marked accordingly',
    ({ act, changes, toc }) => {
      const { draft } = makeDraft(aNote());

      act(draft);

      expect({ changes: draft.changes(), toc: tocStates(draft) }).toEqual({ changes, toc });
    },
  );

  it.each([
    { tags: ['RxJS', 'Angular'], changes: 0, toc: ['', ''] },
    { tags: ['Angular', 'Zod'], changes: 1, toc: ['modifié', ''] },
  ])(
    'Given an entity tagged Angular and RxJS When the tags become $tags Then $changes change is counted',
    ({ tags, changes, toc }) => {
      const { draft } = makeDraft(aNote({ tags: ['Angular', 'RxJS'] }));

      draft.value.update((value) => ({ ...value, tags: [...tags] }));

      expect({ changes: draft.changes(), toc: tocStates(draft) }).toEqual({ changes, toc });
    },
  );

  it('Given a chosen cover When it is rejected Then no cover is pending and the dropzone is told to reset', () => {
    const { draft } = makeDraft(aNote());
    draft.selectCover(COVER);
    const chosen = draft.pendingCover();

    draft.rejectCover();

    expect({
      chosen,
      pending: draft.pendingCover(),
      token: draft.coverResetToken(),
      changes: draft.changes(),
    }).toEqual({ chosen: COVER, pending: null, token: 1, changes: 0 });
  });

  it('Given an edited draft When the loaded entity changes Then the value, tags included, and the saved entity follow it', () => {
    const { loaded, draft } = makeDraft(aNote());
    draft.value.update((value) => ({ ...value, title: 'Brouillon' }));

    loaded.set(aNote({ id: 'n-2', title: 'Journal', tags: ['RxJS'] }));

    expect({
      value: draft.value(),
      saved: draft.saved()?.id,
      changes: draft.changes(),
    }).toEqual({ value: { title: 'Journal', tags: ['RxJS'] }, saved: 'n-2', changes: 0 });
  });
});

describe('EditorDraft: quitter', () => {
  it('Given no change When leaving is asked Then it is allowed at once', () => {
    const { draft } = makeDraft(aNote());

    expect({ leave: draft.canLeave(), asked: draft.leave.asked() }).toEqual({
      leave: true,
      asked: false,
    });
  });

  it('Given a change When leaving is asked Then a confirmation is asked and its answer decides', async () => {
    const { draft } = makeDraft(aNote());
    draft.value.update((value) => ({ ...value, title: 'Autre' }));

    const leave = draft.canLeave();
    const asked = draft.leave.asked();
    draft.leave.answer(true);

    expect({ pending: leave instanceof Promise, asked, answer: await leave }).toEqual({
      pending: true,
      asked: true,
      answer: true,
    });
  });

  it.each([
    { edited: true, prevented: 1 },
    { edited: false, prevented: 0 },
  ])(
    'Given unsaved changes $edited When the tab is about to close Then the browser warning is requested $prevented time(s)',
    ({ edited, prevented }) => {
      const { draft } = makeDraft(aNote());
      if (edited) draft.value.update((value) => ({ ...value, title: 'Autre' }));
      const event = { preventDefault: vi.fn() };

      draft.warnBeforeUnload(event as unknown as BeforeUnloadEvent);

      expect(event.preventDefault).toHaveBeenCalledTimes(prevented);
    },
  );
});

describe('EditorDraft: enregistrer', () => {
  it('Given an edited title without cover When it is saved Then the written entity becomes the saved one, nothing is uploaded and nothing is left to save', async () => {
    const { draft } = makeDraft(aNote());
    draft.value.update((value) => ({ ...value, title: 'Après' }));
    const written = aNote({ title: 'Après' });
    const uploadCover = vi.fn(async (): Promise<unknown> => 'key');

    const result = await draft.save(async () => written, uploadCover);

    expect({
      result,
      uploads: uploadCover.mock.calls.length,
      saved: draft.saved(),
      changes: draft.changes(),
    }).toEqual({
      result: {
        success: true,
        data: { saved: aNote({ title: 'Après' }), cover: { status: 'none' } },
      },
      uploads: 0,
      saved: aNote({ title: 'Après' }),
      changes: 0,
    });
  });

  it('Given a cover chosen for a new entity When it is saved Then the cover is uploaded for the written id, after the write, and the dropzone resets', async () => {
    const { draft } = makeDraft(null);
    draft.value.update((value) => ({ ...value, title: 'Nouveau' }));
    draft.selectCover(COVER);
    const write = vi.fn(
      async (): Promise<Note> => aNote({ id: 'n-9', title: 'Nouveau', tags: [] }),
    );
    const uploadCover = vi.fn(async (): Promise<unknown> => 'key');

    const result = await draft.save(write, uploadCover);

    expect({
      cover: result.success ? result.data.cover : result,
      uploads: uploadCover.mock.calls,
      afterWrite:
        (uploadCover.mock.invocationCallOrder[0] ?? 0) >
        (write.mock.invocationCallOrder[0] ?? Infinity),
      pending: draft.pendingCover(),
      token: draft.coverResetToken(),
      changes: draft.changes(),
    }).toEqual({
      cover: { status: 'sent' },
      uploads: [[COVER, 'n-9']],
      afterWrite: true,
      pending: null,
      token: 1,
      changes: 0,
    });
  });

  it('Given the cover upload rejected When it is saved Then the failure is reported and the entity is still marked saved', async () => {
    const { draft } = makeDraft(aNote());
    draft.value.update((value) => ({ ...value, title: 'Après' }));
    draft.selectCover(COVER);
    const error = new Error('upload');

    const result = await draft.save(
      async () => aNote({ title: 'Après' }),
      async () => Promise.reject(error),
    );

    expect({
      result,
      saved: draft.saved()?.title,
      pending: draft.pendingCover(),
      changes: draft.changes(),
    }).toEqual({
      result: {
        success: true,
        data: { saved: aNote({ title: 'Après' }), cover: { status: 'failed', error } },
      },
      saved: 'Après',
      pending: null,
      changes: 0,
    });
  });

  it('Given the write rejected When it is saved Then the failure is returned, no cover is sent and the draft is kept', async () => {
    const { draft } = makeDraft(aNote());
    draft.value.update((value) => ({ ...value, title: 'Après' }));
    draft.selectCover(COVER);
    const error = new Error('boom');
    const uploadCover = vi.fn(async (): Promise<unknown> => 'key');

    const result = await draft.save(async () => Promise.reject(error), uploadCover);

    expect({
      result,
      uploads: uploadCover.mock.calls.length,
      saved: draft.saved()?.title,
      pending: draft.pendingCover(),
      changes: draft.changes(),
    }).toEqual({
      result: { success: false, error },
      uploads: 0,
      saved: 'Carnet',
      pending: COVER,
      changes: 2,
    });
  });

  it.each([{ outcome: 'resolves' }, { outcome: 'rejects' }] as const)(
    'Given a write in progress When it $outcome Then saving is on meanwhile and off after',
    async ({ outcome }) => {
      const { draft } = makeDraft(aNote());
      draft.value.update((value) => ({ ...value, title: 'Après' }));
      let settleWrite: () => void = () => undefined;
      const write = (): Promise<Note> =>
        new Promise<Note>((resolve, reject) => {
          settleWrite = (): void =>
            outcome === 'resolves' ? resolve(aNote({ title: 'Après' })) : reject(new Error('boom'));
        });

      const saving = draft.save(write, async () => 'key');
      const during = draft.saving();
      settleWrite();
      await saving;

      expect({ during, after: draft.saving() }).toEqual({ during: true, after: false });
    },
  );
});
