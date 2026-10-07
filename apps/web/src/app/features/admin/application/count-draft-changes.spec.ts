import { toProjectDraft, type ProjectDraft } from './project-draft';
import { makeProject } from '@features/projects/testing/project-builders';
import { countChangedFields } from './count-draft-changes';

type Edited = ProjectDraft & { readonly tags: ReadonlySet<string> };

const BASELINE: Edited = {
  ...toProjectDraft(
    makeProject({
      title: 'DashFlow',
      category: 'Application Web',
      description: 'Budget et santé du foyer.',
      order: 1,
      kind: 'production',
      techChoices: [{ techno: 'NestJS', why: 'modules' }],
      architectureDecisions: [{ decision: 'Chiffrement client', rationale: 'santé' }],
    }),
  ),
  tags: new Set(['Angular', 'NestJS']),
};

const edited = (overrides: Partial<Edited> = {}): Edited => ({
  ...BASELINE,
  techChoices: BASELINE.techChoices.map((row) => ({ ...row })),
  architectureDecisions: BASELINE.architectureDecisions.map((row) => ({ ...row })),
  tags: new Set(BASELINE.tags),
  ...overrides,
});

const markedBySignalForms = <T extends object>(row: T): T =>
  Object.assign({ ...row }, { [Symbol('signal-forms-key')]: 7 });

describe('countChangedFields', () => {
  it('Given a copy of the baseline When the changes are counted Then there is none', () => {
    expect(countChangedFields(edited(), BASELINE)).toBe(0);
  });

  it.each([
    { name: 'the title', overrides: { title: 'Après' }, expected: 1 },
    { name: 'the nature', overrides: { kind: 'demo' }, expected: 1 },
    { name: 'the order', overrides: { order: 2 }, expected: 1 },
    { name: 'the featured flag', overrides: { featured: true }, expected: 1 },
    { name: 'a link', overrides: { liveUrl: 'https://dashflow.test' }, expected: 1 },
    { name: 'the title and the pitch', overrides: { title: 'Après', pitch: 'P.' }, expected: 2 },
    {
      name: 'three fields',
      overrides: { title: 'Après', pitch: 'P.', scope: 'Front' },
      expected: 3,
    },
  ] satisfies readonly { name: string; overrides: Partial<Edited>; expected: number }[])(
    'Given $name edited When the changes are counted Then $expected field(s) changed',
    ({ overrides, expected }) => {
      expect(countChangedFields(edited(overrides), BASELINE)).toBe(expected);
    },
  );

  it('Given a field typed then restored When the changes are counted Then it is not a change', () => {
    expect(countChangedFields(edited({ title: 'DashFlow' }), BASELINE)).toBe(0);
  });

  it.each([
    {
      name: 'rows copied with the same content',
      techChoices: [{ techno: 'NestJS', why: 'modules' }],
      expected: 0,
    },
    {
      name: 'rows marked by Signal Forms with the same content',
      techChoices: [markedBySignalForms({ techno: 'NestJS', why: 'modules' })],
      expected: 0,
    },
    {
      name: 'a row edited',
      techChoices: [{ techno: 'NestJS', why: 'injection' }],
      expected: 1,
    },
    {
      name: 'a row added',
      techChoices: [
        { techno: 'NestJS', why: 'modules' },
        { techno: '', why: '' },
      ],
      expected: 1,
    },
    { name: 'every row removed', techChoices: [], expected: 1 },
    {
      name: 'a row with both cells edited',
      techChoices: [{ techno: 'Express', why: 'léger' }],
      expected: 1,
    },
  ])(
    'Given $name When the changes are counted Then the repeated field counts $expected',
    ({ techChoices, expected }) => {
      expect(countChangedFields(edited({ techChoices }), BASELINE)).toBe(expected);
    },
  );

  it.each([
    { name: 'the same tags in another order', tags: ['NestJS', 'Angular'], expected: 0 },
    { name: 'one tag added', tags: ['Angular', 'NestJS', 'Docker'], expected: 1 },
    { name: 'one tag removed', tags: ['Angular'], expected: 1 },
    { name: 'one tag swapped', tags: ['Angular', 'Docker'], expected: 1 },
  ])(
    'Given $name When the changes are counted Then the tag set counts $expected',
    ({ tags, expected }) => {
      expect(countChangedFields(edited({ tags: new Set(tags) }), BASELINE)).toBe(expected);
    },
  );

  it('Given a title, a row and a tag edited When the changes are counted Then three fields changed', () => {
    expect(
      countChangedFields(
        edited({
          title: 'Après',
          architectureDecisions: [],
          tags: new Set(['Angular']),
        }),
        BASELINE,
      ),
    ).toBe(3);
  });

  it.each([
    { a: { cover: null }, b: { cover: null }, expected: 0 },
    { a: { cover: 'cover.png' }, b: { cover: null }, expected: 1 },
    { a: { cover: null }, b: { cover: 'cover.png' }, expected: 1 },
  ])(
    'Given the optional value $a.cover against $b.cover When the changes are counted Then $expected field changed',
    ({ a, b, expected }) => {
      expect(countChangedFields<{ cover: string | null }>(a, b)).toBe(expected);
    },
  );
});
