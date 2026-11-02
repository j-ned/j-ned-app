import {
  hasViolation,
  violationsOf as violationsIn,
  type Violation,
} from '../../common/dto-testing';
import { WORKSHOP_GUIDE_OPERATIONS } from '../workshop-guide-content';
import { WORKSHOP_GUIDE_LIMITS } from '../workshop-guide-limits';
import { WORKSHOP_GUIDE_SEED } from '../workshop-guide.seed';
import {
  anAllMaterialsEntry,
  anEntry,
  aWorkshopGuideContent,
} from '../workshop-guide-test-builders';
import { updateWorkshopGuideSchema } from './update-workshop-guide.dto';

/** Corps modifiable : copie profonde du builder neutre + version. */
const aBody = (): Record<string, unknown> & {
  entries: Record<string, unknown>[];
} => ({
  ...(structuredClone(aWorkshopGuideContent()) as unknown as Record<
    string,
    unknown
  >),
  entries: structuredClone(
    aWorkshopGuideContent().entries,
  ) as unknown as Record<string, unknown>[],
  version: 1,
});

/** Corps valide dont la première ligne a `field` remplacé (ou retiré si `undefined`). */
const withEntryField = (field: string, value: unknown) => {
  const body = aBody();
  if (value === undefined) delete body.entries[0][field];
  else body.entries[0][field] = value;
  return body;
};

/** Issues `{ path, message }` du corps, avec la liste blanche des routes. */
function violationsOf(body: object): Promise<Violation[]> {
  return Promise.resolve(violationsIn(updateWorkshopGuideSchema, body));
}

/** Messages propres à l'API ; pour les autres contraintes, seul le champ en cause est vérifié. */
const OWN_MESSAGES: Readonly<Record<string, string>> = {
  isNotBlank: 'must not be blank',
  noMarkup: 'must not contain HTML markup',
  arrayUnique: 'Les identifiants doivent être uniques',
};

/**
 * `chemin:contrainte` attendu (forme des specs d'origine) : le champ est refusé, avec le message
 * propre à l'API quand la contrainte en a un.
 */
function expectViolation(violations: readonly Violation[], expected: string) {
  const at = expected.lastIndexOf(':');
  const path = expected.slice(0, at);
  const message = OWN_MESSAGES[expected.slice(at + 1)];
  expect({
    violations,
    refused: hasViolation(violations, path, message),
  }).toMatchObject({
    refused: true,
  });
}

const L = WORKSHOP_GUIDE_LIMITS;
const text = (length: number) => 'a'.repeat(length);

describe('UpdateWorkshopGuideDto (spec 035)', () => {
  it.each([
    [
      'the seed (disabled, no entry)',
      () => ({ ...WORKSHOP_GUIDE_SEED, version: 1 }),
    ],
    ['the neutral builder', aBody],
    ['version 0 (no document yet)', () => ({ ...aBody(), version: 0 })],
    [
      `${L.entries} entries`,
      () => ({
        ...aBody(),
        entries: Array.from({ length: L.entries }, () => ({ ...anEntry() })),
      }),
    ],
  ])('Given %s, When validated, Then it is accepted', async (_label, body) => {
    expect(await violationsOf(body())).toEqual([]);
  });

  it(`Given ${L.entries + 1} entries, When validated, Then the list is too long`, async () => {
    const body = {
      ...aBody(),
      entries: Array.from({ length: L.entries + 1 }, () => ({ ...anEntry() })),
    };

    expectViolation(await violationsOf(body), 'entries:arrayMaxSize');
  });

  it.each([
    ['missing', undefined, 'entries:isArray'],
    ['an object', { 0: anEntry() }, 'entries:isArray'],
  ])(
    'Given entries %s, When validated, Then it is refused',
    async (_l, entries, v) => {
      const body = aBody() as Record<string, unknown>;
      if (entries === undefined) delete body.entries;
      else body.entries = entries;

      expectViolation(await violationsOf(body), v);
    },
  );

  describe.each([
    ['material', L.material],
    ['insert', L.insert],
  ])('entries.0.%s', (field, max) => {
    it(`Given exactly ${max} characters, When validated, Then it is accepted`, async () => {
      expect(await violationsOf(withEntryField(field, text(max)))).toEqual([]);
    });

    it.each([
      ['too long', text(max + 1), 'maxLength'],
      ['empty', '', 'isNotBlank'],
      ['blank', '   ', 'isNotBlank'],
      ['HTML markup', '<b>x</b>', 'noMarkup'],
      ['missing', undefined, 'isString'],
    ])(
      'Given %s, When validated, Then it is refused',
      async (_l, value, constraint) => {
        expectViolation(
          await violationsOf(withEntryField(field, value)),
          `entries.0.${field}:${constraint}`,
        );
      },
    );
  });

  describe('entries.0.note (optional)', () => {
    it.each([
      ['missing', undefined],
      ['null', null],
      ['empty', ''],
      ['blank', '   '],
      [`exactly ${L.note} characters`, text(L.note)],
    ])('Given %s, When validated, Then it is accepted', async (_l, value) => {
      expect(await violationsOf(withEntryField('note', value))).toEqual([]);
    });

    it.each([
      ['too long', text(L.note + 1), 'maxLength'],
      ['HTML markup', '<script>', 'noMarkup'],
      ['a number', 3, 'isString'],
    ])(
      'Given %s, When validated, Then it is refused',
      async (_l, value, constraint) => {
        expectViolation(
          await violationsOf(withEntryField('note', value)),
          `entries.0.note:${constraint}`,
        );
      },
    );
  });

  describe('entries.0.operation (closed list)', () => {
    it.each(WORKSHOP_GUIDE_OPERATIONS)(
      'Given %s, When validated, Then it is accepted',
      async (operation) => {
        expect(
          await violationsOf(withEntryField('operation', operation)),
        ).toEqual([]);
      },
    );

    it.each([['milling'], ['External-Roughing'], [''], [undefined]])(
      'Given %p, When validated, Then it is refused',
      async (operation) => {
        expectViolation(
          await violationsOf(withEntryField('operation', operation)),
          'entries.0.operation:isIn',
        );
      },
    );
  });

  describe('entries.0.noseRadius (mm)', () => {
    it.each([[0.01], [0.4], [0.8], [1.2], [L.noseRadius]])(
      'Given %p, When validated, Then it is accepted',
      async (radius) => {
        expect(
          await violationsOf(withEntryField('noseRadius', radius)),
        ).toEqual([]);
      },
    );

    it.each([
      [0, 'isPositive'],
      [-0.4, 'isPositive'],
      [10.01, 'max'],
      [0.125, 'isNumber'],
      ['abc', 'isNumber'],
      ['', 'isPositive'],
    ])(
      'Given %p, When validated, Then %s fails',
      async (radius, constraint) => {
        expectViolation(
          await violationsOf(withEntryField('noseRadius', radius)),
          `entries.0.noseRadius:${constraint}`,
        );
      },
    );
  });

  describe('entries.0.noseRadius (optional, spec 037)', () => {
    it.each([
      ['missing', undefined],
      ['null', null],
    ])('Given %s, When validated, Then it is accepted', async (_l, value) => {
      expect(await violationsOf(withEntryField('noseRadius', value))).toEqual(
        [],
      );
    });
  });

  describe('entries.0.operation boring (spec 037)', () => {
    it('Given boring, When validated, Then it is accepted', async () => {
      expect(await violationsOf(withEntryField('operation', 'boring'))).toEqual(
        [],
      );
    });

    it('Given the closed list, When read, Then boring sits between internal-finishing and drilling', () => {
      const ops: readonly string[] = WORKSHOP_GUIDE_OPERATIONS;
      expect(ops.indexOf('boring')).toBe(ops.indexOf('internal-finishing') + 1);
      expect(ops.indexOf('drilling')).toBe(ops.indexOf('boring') + 1);
    });
  });

  describe('entries.0.allMaterials (spec 037)', () => {
    /** Corps valide dont la première ligne est remplacée par `entry`. */
    const withFirstEntry = (entry: Record<string, unknown>) => {
      const body = aBody();
      body.entries[0] = entry;
      return body;
    };

    it.each([
      ['without material nor radius', { ...anAllMaterialsEntry() }],
      ['with an empty material', { ...anAllMaterialsEntry(), material: '' }],
      ['with a null material', { ...anAllMaterialsEntry(), material: null }],
      [
        'with a radius and a note',
        { ...anAllMaterialsEntry({ noseRadius: 0.4, note: 'Remarque' }) },
      ],
    ])(
      'Given an all-materials entry %s, When validated, Then it is accepted',
      async (_l, entry) => {
        expect(await violationsOf(withFirstEntry(entry))).toEqual([]);
      },
    );

    it('Given an all-materials entry with a radius at 0, When validated, Then it is refused', async () => {
      expectViolation(
        await violationsOf(
          withFirstEntry({ ...anAllMaterialsEntry(), noseRadius: 0 }),
        ),
        'entries.0.noseRadius:isPositive',
      );
    });

    it.each([
      ['false', false],
      ['null', null],
    ])(
      'Given allMaterials %s and no material, When validated, Then the material is required',
      async (_l, allMaterials) => {
        const body = withEntryField('material', undefined);
        body.entries[0].allMaterials = allMaterials;

        expectViolation(
          await violationsOf(body),
          'entries.0.material:isString',
        );
      },
    );

    it.each([
      ['the string "true"', 'true'],
      ['1', 1],
    ])(
      'Given allMaterials as %s, When validated, Then it is refused (never coerced)',
      async (_l, allMaterials) => {
        expectViolation(
          await violationsOf(withEntryField('allMaterials', allMaterials)),
          'entries.0.allMaterials:isBoolean',
        );
      },
    );

    it('Given a body from the front before spec 037 (material and radius always sent), When validated, Then it is accepted', async () => {
      expect(
        await violationsOf(
          withFirstEntry({
            material: 'Matière A',
            operation: 'internal-finishing',
            insert: 'CODE 0001',
            noseRadius: 0.8,
            note: '',
          }),
        ),
      ).toEqual([]);
    });
  });

  it('Given an unknown key on an entry, When validated, Then it is refused', async () => {
    expectViolation(
      await violationsOf(withEntryField('id', 'x')),
      'entries.0.id:whitelistValidation',
    );
  });

  it.each([
    ['the string "false"', 'false'],
    ['the string "true"', 'true'],
    ['1', 1],
    ['missing', undefined],
  ])(
    'Given enabled as %s, When validated, Then it is refused (never coerced)',
    async (_l, enabled) => {
      const body = aBody();
      if (enabled === undefined) delete body.enabled;
      else body.enabled = enabled;

      expectViolation(await violationsOf(body), 'enabled:isBoolean');
    },
  );

  it.each([
    ['true', true],
    ['false', false],
    ['missing (admin before spec 036)', undefined],
  ])(
    'Given decoderEnabled %s, When validated, Then it is accepted',
    async (_l, decoderEnabled) => {
      const body = aBody();
      if (decoderEnabled === undefined) delete body.decoderEnabled;
      else body.decoderEnabled = decoderEnabled;

      expect(await violationsOf(body)).toEqual([]);
    },
  );

  it.each([
    ['the string "false"', 'false'],
    ['the string "true"', 'true'],
    ['1', 1],
    ['null', null],
  ])(
    'Given decoderEnabled as %s, When validated, Then it is refused (never coerced)',
    async (_l, decoderEnabled) => {
      expectViolation(
        await violationsOf({ ...aBody(), decoderEnabled }),
        'decoderEnabled:isBoolean',
      );
    },
  );

  it.each([
    ['missing', undefined, 'version:isInt'],
    ['negative', -1, 'version:min'],
    ['decimal', 1.5, 'version:isInt'],
  ])(
    'Given version %s, When validated, Then it is refused',
    async (_l, version, v) => {
      const body = aBody();
      if (version === undefined) delete body.version;
      else body.version = version;

      expectViolation(await violationsOf(body), v);
    },
  );
});
