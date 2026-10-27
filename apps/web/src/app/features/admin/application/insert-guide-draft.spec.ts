import type { InsertGuide } from '@features/workshop/domain/models/insert-guide.model';
import { anEntry } from '@features/workshop/testing/insert-guide-builders';
import {
  newInsertGuideRow,
  toInsertGuideDraft,
  toInsertGuidePayload,
  type InsertGuideDraft,
} from './insert-guide-draft';

const GUIDE: InsertGuide = {
  enabled: true,
  entries: [
    anEntry({ operation: 'threading', noseRadius: 0.2, note: 'Remarque fictive.' }),
    anEntry({ material: 'Autre matière', insert: 'CODE-FICTIF-02' }),
  ],
};

describe('toInsertGuideDraft', () => {
  it('Given no guide yet When the draft is built Then the guide is off, without any line', () => {
    expect(toInsertGuideDraft(null)).toEqual({ enabled: false, entries: [] });
  });

  it('Given a guide When the draft is built Then each line is editable text, the note blank when absent, and keyed by its position', () => {
    expect(toInsertGuideDraft(GUIDE)).toEqual({
      enabled: true,
      entries: [
        {
          key: 'entry-1',
          material: 'Matière fictive',
          operation: 'threading',
          insert: 'CODE-FICTIF-01',
          noseRadius: 0.2,
          note: 'Remarque fictive.',
        },
        {
          key: 'entry-2',
          material: 'Autre matière',
          operation: 'external-roughing',
          insert: 'CODE-FICTIF-02',
          noseRadius: 0.8,
          note: '',
        },
      ],
    });
  });

  it('Given a previous draft When the saved guide is turned back into a draft Then each line keeps the key of its position', () => {
    const previous: InsertGuideDraft = {
      enabled: true,
      entries: [
        { ...newInsertGuideRow(), key: 'entry-a' },
        { ...newInsertGuideRow(), key: 'entry-b' },
      ],
    };

    expect(toInsertGuideDraft(GUIDE, previous).entries.map(({ key }) => key)).toEqual([
      'entry-a',
      'entry-b',
    ]);
  });
});

describe('newInsertGuideRow', () => {
  it('Given a new line When it is created Then every field is blank and its key is its own', () => {
    const [first, second] = [newInsertGuideRow(), newInsertGuideRow()];

    expect({
      fields: { ...first, key: undefined },
      keyed: first.key.startsWith('entry-'),
      distinct: first.key !== second.key,
    }).toEqual({
      fields: {
        key: undefined,
        material: '',
        operation: '',
        insert: '',
        noseRadius: null,
        note: '',
      },
      keyed: true,
      distinct: true,
    });
  });
});

describe('toInsertGuidePayload', () => {
  it('Given a filled draft When the payload is built Then each line is copied field by field, trimmed, without its key nor a blank note', () => {
    const draft: InsertGuideDraft = {
      enabled: true,
      entries: [
        {
          key: 'entry-1',
          material: '  Matière fictive ',
          operation: 'grooving',
          insert: ' CODE-FICTIF-01 ',
          noseRadius: 0.4,
          note: '   ',
        },
        {
          key: 'entry-2',
          material: 'Autre matière',
          operation: 'drilling',
          insert: 'CODE-FICTIF-02',
          noseRadius: 1.2,
          note: ' Remarque fictive. ',
        },
      ],
    };

    expect(toInsertGuidePayload(draft)).toEqual({
      enabled: true,
      entries: [
        {
          material: 'Matière fictive',
          operation: 'grooving',
          insert: 'CODE-FICTIF-01',
          noseRadius: 0.4,
        },
        {
          material: 'Autre matière',
          operation: 'drilling',
          insert: 'CODE-FICTIF-02',
          noseRadius: 1.2,
          note: 'Remarque fictive.',
        },
      ],
    });
  });

  it('Given the guide switched off without lines When the payload is built Then it says so', () => {
    expect(toInsertGuidePayload({ enabled: false, entries: [] })).toEqual({
      enabled: false,
      entries: [],
    });
  });
});
