import type { InsertGuide } from '@features/workshop/domain/models/insert-guide.model';
import { aGenericEntry, anEntry } from '@features/workshop/testing/insert-guide-builders';
import {
  newInsertGuideGroup,
  newInsertGuideTool,
  toInsertGuideDraft,
  toInsertGuidePayload,
  type InsertGuideDraft,
  type InsertGuideGroupDraft,
  type InsertGuideToolDraft,
} from './insert-guide-draft';

const GUIDE: InsertGuide = {
  enabled: true,
  decoderEnabled: true,
  entries: [
    anEntry({ operation: 'threading', noseRadius: 0.2, note: 'Remarque fictive.' }),
    anEntry({ material: 'Autre matière', insert: 'CODE-FICTIF-02' }),
  ],
};

const aTool = (overrides: Partial<InsertGuideToolDraft> = {}): InsertGuideToolDraft => ({
  key: 'tool-1-1',
  operation: 'external-roughing',
  insert: 'CODE-FICTIF-01',
  noseRadius: 0.8,
  note: '',
  ...overrides,
});

const aGroup = (overrides: Partial<InsertGuideGroupDraft> = {}): InsertGuideGroupDraft => ({
  key: 'group-1',
  material: 'Matière fictive',
  allMaterials: false,
  tools: [aTool()],
  ...overrides,
});

const aDraft = (groups: InsertGuideGroupDraft[]): InsertGuideDraft => ({
  enabled: true,
  decoderEnabled: true,
  groups,
});

type GroupShape = { material: string; allMaterials: boolean; inserts: string[] };

const shape = (draft: InsertGuideDraft): GroupShape[] =>
  draft.groups.map(({ material, allMaterials, tools }) => ({
    material,
    allMaterials,
    inserts: tools.map(({ insert }) => insert),
  }));

describe('toInsertGuideDraft', () => {
  it('Given no guide yet When the draft is built Then the guide and the decoder are off, without any block', () => {
    expect(toInsertGuideDraft(null)).toEqual({
      enabled: false,
      decoderEnabled: false,
      groups: [],
    });
  });

  it('Given a guide When the draft is built Then each material is a block of editable tools, the note blank when absent, keyed by position', () => {
    expect(toInsertGuideDraft(GUIDE)).toEqual({
      enabled: true,
      decoderEnabled: true,
      groups: [
        {
          key: 'group-1',
          material: 'Matière fictive',
          allMaterials: false,
          tools: [
            {
              key: 'tool-1-1',
              operation: 'threading',
              insert: 'CODE-FICTIF-01',
              noseRadius: 0.2,
              note: 'Remarque fictive.',
            },
          ],
        },
        {
          key: 'group-2',
          material: 'Autre matière',
          allMaterials: false,
          tools: [
            {
              key: 'tool-2-1',
              operation: 'external-roughing',
              insert: 'CODE-FICTIF-02',
              noseRadius: 0.8,
              note: '',
            },
          ],
        },
      ],
    });
  });

  it('Given lines of the same material scattered and lines for all materials When the draft is built Then the blocks follow the first appearance, the generic block last', () => {
    const draft = toInsertGuideDraft({
      ...GUIDE,
      entries: [
        aGenericEntry({ insert: 'BARRE-1' }),
        anEntry({ material: 'Acier', insert: 'A-1' }),
        anEntry({ material: 'Inox', insert: 'I-1' }),
        aGenericEntry({ insert: 'BARRE-2' }),
        anEntry({ material: ' Acier ', insert: 'A-2' }),
        anEntry({ material: 'acier', insert: 'a-3' }),
      ],
    });

    expect(shape(draft)).toEqual([
      { material: 'Acier', allMaterials: false, inserts: ['A-1', 'A-2'] },
      { material: 'Inox', allMaterials: false, inserts: ['I-1'] },
      { material: 'acier', allMaterials: false, inserts: ['a-3'] },
      { material: '', allMaterials: true, inserts: ['BARRE-1', 'BARRE-2'] },
    ]);
  });

  it('Given a line for all materials without radius When the draft is built Then it sits in the generic block, without material, its radius blank', () => {
    expect(
      toInsertGuideDraft({ ...GUIDE, entries: [aGenericEntry({ note: 'Remarque fictive.' })] })
        .groups,
    ).toEqual([
      {
        key: 'group-1',
        material: '',
        allMaterials: true,
        tools: [
          {
            key: 'tool-1-1',
            operation: 'boring',
            insert: 'BARRE-FICTIVE-01',
            noseRadius: null,
            note: 'Remarque fictive.',
          },
        ],
      },
    ]);
  });

  it('Given a previous draft When the saved guide is turned back into a draft Then each block and each tool keeps the key of its position', () => {
    const previous = aDraft([
      aGroup({ key: 'group-a', tools: [aTool({ key: 'tool-a' }), aTool({ key: 'tool-b' })] }),
      aGroup({ key: 'group-b', tools: [] }),
    ]);

    const draft = toInsertGuideDraft(
      { ...GUIDE, entries: [anEntry(), anEntry(), anEntry({ material: 'Autre' }), anEntry()] },
      previous,
    );

    expect(draft.groups.map(({ key, tools }) => [key, tools.map((tool) => tool.key)])).toEqual([
      ['group-a', ['tool-a', 'tool-b', 'tool-1-3']],
      ['group-b', ['tool-2-1']],
    ]);
  });
});

describe('newInsertGuideGroup and newInsertGuideTool', () => {
  it('Given a new tool When it is created Then every field is blank and its key is its own', () => {
    const [first, second] = [newInsertGuideTool(), newInsertGuideTool()];

    expect({
      fields: { ...first, key: undefined },
      keyed: first.key.startsWith('tool-'),
      distinct: first.key !== second.key,
    }).toEqual({
      fields: { key: undefined, operation: '', insert: '', noseRadius: null, note: '' },
      keyed: true,
      distinct: true,
    });
  });

  it.each([false, true])(
    'Given a new block (all materials: %s) When it is created Then its material is blank and it holds one blank tool',
    (allMaterials) => {
      const [first, second] = [
        newInsertGuideGroup(allMaterials),
        newInsertGuideGroup(allMaterials),
      ];

      expect({
        material: first.material,
        allMaterials: first.allMaterials,
        tools: first.tools.map(({ operation, insert }) => [operation, insert]),
        keyed: first.key.startsWith('group-'),
        distinct: first.key !== second.key,
      }).toEqual({
        material: '',
        allMaterials,
        tools: [['', '']],
        keyed: true,
        distinct: true,
      });
    },
  );
});

describe('toInsertGuidePayload', () => {
  it('Given filled blocks When the payload is built Then the tools are laid flat, block after block, copied field by field, trimmed, without key nor blank note', () => {
    const draft = aDraft([
      aGroup({
        material: '  Matière fictive ',
        tools: [
          aTool({
            operation: 'grooving',
            insert: ' CODE-FICTIF-01 ',
            noseRadius: 0.4,
            note: '   ',
          }),
          aTool({ key: 'tool-1-2', operation: 'threading', insert: 'CODE-FICTIF-03' }),
        ],
      }),
      aGroup({
        key: 'group-2',
        material: 'Autre matière',
        tools: [
          aTool({
            operation: 'drilling',
            insert: 'CODE-FICTIF-02',
            noseRadius: 1.2,
            note: ' Remarque fictive. ',
          }),
        ],
      }),
    ]);

    expect(toInsertGuidePayload(draft)).toEqual({
      enabled: true,
      decoderEnabled: true,
      entries: [
        {
          material: 'Matière fictive',
          operation: 'grooving',
          insert: 'CODE-FICTIF-01',
          noseRadius: 0.4,
        },
        {
          material: 'Matière fictive',
          operation: 'threading',
          insert: 'CODE-FICTIF-03',
          noseRadius: 0.8,
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

  it('Given the generic block without radius When the payload is built Then its tools are sent flagged, without material nor radius', () => {
    expect(
      toInsertGuidePayload(
        aDraft([
          aGroup({
            material: 'Matière oubliée',
            allMaterials: true,
            tools: [
              aTool({
                operation: 'boring',
                insert: ' BARRE-FICTIVE-01 ',
                noseRadius: null,
                note: ' Diamètre au besoin. ',
              }),
            ],
          }),
        ]),
      ).entries,
    ).toEqual([
      {
        allMaterials: true,
        operation: 'boring',
        insert: 'BARRE-FICTIVE-01',
        note: 'Diamètre au besoin.',
      },
    ]);
  });

  it('Given a tool of one material without radius When the payload is built Then it is kept, without radius nor flag', () => {
    expect(
      toInsertGuidePayload(
        aDraft([aGroup({ tools: [aTool({ operation: 'boring', noseRadius: null })] })]),
      ).entries,
    ).toEqual([{ material: 'Matière fictive', operation: 'boring', insert: 'CODE-FICTIF-01' }]);
  });

  it('Given the guide switched off without blocks When the payload is built Then it says so', () => {
    expect(toInsertGuidePayload({ enabled: false, decoderEnabled: false, groups: [] })).toEqual({
      enabled: false,
      decoderEnabled: false,
      entries: [],
    });
  });

  it('Given a draft When it is laid flat and read back Then the same blocks come back', () => {
    const draft = aDraft([
      aGroup({ tools: [aTool(), aTool({ key: 'tool-1-2', insert: 'CODE-FICTIF-02' })] }),
      aGroup({ key: 'group-2', material: 'Autre', tools: [aTool({ key: 'tool-2-1' })] }),
      aGroup({
        key: 'group-3',
        material: '',
        allMaterials: true,
        tools: [aTool({ key: 'tool-3-1', noseRadius: null })],
      }),
    ]);

    expect(toInsertGuideDraft(toInsertGuidePayload(draft), draft)).toEqual(draft);
  });

  it.each([
    [true, false],
    [false, true],
  ])(
    'Given the guide switch at %s and the decoder switch at %s When the payload is built Then each switch is copied on its own',
    (enabled, decoderEnabled) => {
      const { enabled: guide, decoderEnabled: decoder } = toInsertGuidePayload({
        enabled,
        decoderEnabled,
        groups: [],
      });

      expect([guide, decoder]).toEqual([enabled, decoderEnabled]);
    },
  );
});
