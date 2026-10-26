import { describe, expect, it } from 'vitest';
import { editorialTexts } from '../../../testing/editorial-sources';
import {
  aCitation,
  aMaterial,
  anIsoInsert,
  anIsoInsertProposal,
  aRecommendation,
  aSource,
  aSourced,
} from '../testing/insert-guide-builders';
import { ISO_513_GROUPS } from './iso-groups.static-data';
import { MATERIALS } from './materials.static-data';
import type { IsoGroupLetter, IsoSubgroup, Material } from './models/material.model';
import type {
  CuttingSpeedRange,
  IsoInsertProposal,
  RecommendationEntry,
} from './models/recommendation.model';
import type { Source, SourceCitation, SourceId, Sourced } from './models/source.model';
import { normalizeDesignation } from './normalize-designation';
import { OPERATION_FAMILIES } from './operations.static-data';
import { RECOMMENDATIONS } from './recommendations.static-data';
import { SOURCES } from './sources.static-data';

const SLUG_FORMAT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const duplicates = (values: readonly string[]): readonly string[] => [
  ...new Set(values.filter((value, index) => values.indexOf(value) !== index)),
];

const sourcedTexts = (material: Material): readonly string[] => [
  ...material.designations.flatMap((designation) => [designation.value, designation.cite.locator]),
  material.isoGroup.cite.locator,
  ...material.behaviour.flatMap((line) => [line.value, line.cite.locator]),
];

const GENERATIVE_AI =
  /gemini|chatgpt|openai|claude|anthropic|copilot|mistral|perplexity|llama|intelligence artificielle|\bIA\b|\bAI\b|référentiel des alliages/iu;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

type SourceDefect = 'ai' | 'blank-text' | 'invalid-url' | 'invalid-date';

const isCalendarDate = (text: string): boolean =>
  ISO_DATE.test(text) && new Date(`${text}T00:00:00Z`).toISOString().startsWith(text);

const isHttpsUrl = (text: string): boolean =>
  URL.canParse(text) && new URL(text).protocol === 'https:' && new URL(text).hostname !== '';

const sourceDefects = (source: Source): readonly SourceDefect[] => {
  const defects: SourceDefect[] = [];
  if ([source.title, source.publisher, source.url ?? ''].some((text) => GENERATIVE_AI.test(text))) {
    defects.push('ai');
  }
  if ([source.title, source.publisher].some((text) => text.trim() === '')) {
    defects.push('blank-text');
  }
  if (source.url !== undefined && !isHttpsUrl(source.url)) {
    defects.push('invalid-url');
  }
  if (!isCalendarDate(source.consultedOn)) {
    defects.push('invalid-date');
  }
  return defects;
};

describe('SOURCES', () => {
  it('Given the catalogue When each source is checked Then none has a defect', () => {
    const defective = Object.entries<Source>(SOURCES)
      .filter(([, source]) => sourceDefects(source).length > 0)
      .map(([id]) => id);

    expect(defective).toEqual([]);
  });

  it('Given a well-formed fictional source When it is checked Then it has no defect', () => {
    expect(sourceDefects(aSource())).toEqual([]);
  });

  it('Given a fictional source without public URL When it is checked Then it has no defect', () => {
    const { url: _dropped, ...unlinked } = aSource();

    expect(sourceDefects(unlinked)).toEqual([]);
  });

  it('Given the catalogue When URLs are read Then only the working list has none, and nothing points to the site itself', () => {
    const entries = Object.entries<Source>(SOURCES);

    expect({
      unlinked: entries.filter(([, { url }]) => url === undefined).map(([id]) => id),
      ownSite: entries
        .filter(
          ([, { url }]) =>
            url !== undefined && new URL(url).hostname.endsWith('nedellec-julien.fr'),
        )
        .map(([id]) => id),
    }).toEqual({ unlinked: ['julien-working-list'], ownSite: [] });
  });

  it.each<[string, Partial<Source>]>([
    ['a title naming Gemini', { title: 'Référentiel fictif généré par Gemini' }],
    ['a title naming ChatGPT', { title: 'Export ChatGPT fictif' }],
    ['a title naming Claude', { title: 'Synthèse fictive par Claude' }],
    ['a title naming Copilot', { title: 'Brouillon Copilot fictif' }],
    ['a title naming the AI material list', { title: 'Référentiel des alliages' }],
    ['a publisher naming artificial intelligence', { publisher: 'Intelligence artificielle' }],
    ['a publisher abbreviated IA', { publisher: 'Assistant IA fictif' }],
    ['a publisher naming OpenAI', { publisher: 'OpenAI' }],
    ['a URL on an AI service', { url: 'https://gemini.google.com/share/fictif' }],
  ])(
    'Given a fictional source with %s When it is checked Then it is flagged as AI',
    (_, overrides) => {
      expect(sourceDefects(aSource(overrides))).toEqual(['ai']);
    },
  );

  it.each<[string, Partial<Source>, SourceDefect]>([
    ['a blank title', { title: '  ' }, 'blank-text'],
    ['a blank publisher', { publisher: '\u00a0' }, 'blank-text'],
    ['a URL without host', { url: 'https://' }, 'invalid-url'],
    ['a URL that does not parse', { url: 'https://exemple invalide' }, 'invalid-url'],
    ['a date in another format', { consultedOn: '01/01/2001' }, 'invalid-date'],
    ['a date that does not exist', { consultedOn: '2001-02-30' }, 'invalid-date'],
  ])(
    'Given a fictional source with %s When it is checked Then it is flagged',
    (_, overrides, defect) => {
      expect(sourceDefects(aSource(overrides))).toEqual([defect]);
    },
  );
});

describe('MATERIALS', () => {
  it('Given the reference When slugs are read Then each one is unique and URL-safe', () => {
    const slugs = MATERIALS.map((material) => material.slug);

    expect(duplicates(slugs)).toEqual([]);
    expect(slugs.filter((slug) => !SLUG_FORMAT.test(slug))).toEqual([]);
  });

  it('Given the reference When designations are normalized Then no two materials share one', () => {
    const owners = MATERIALS.flatMap((material) => [
      ...new Set(material.designations.map(({ value }) => normalizeDesignation(value))),
    ]);

    expect(duplicates(owners)).toEqual([]);
  });

  it('Given the reference When its texts are read Then none is blank', () => {
    const blanks = MATERIALS.flatMap((material) =>
      sourcedTexts(material)
        .filter((text) => text.trim() === '')
        .map(() => material.slug),
    );

    expect(blanks).toEqual([]);
  });
});

type RecommendationDefect =
  'unknown-material' | 'duplicate-coverage' | 'invalid-speed' | 'blank-text';

const hasValidSpeed = ({ cuttingSpeed }: RecommendationEntry): boolean =>
  cuttingSpeed === undefined ||
  (Number.isFinite(cuttingSpeed.value.max) &&
    cuttingSpeed.value.min > 0 &&
    cuttingSpeed.value.min <= cuttingSpeed.value.max);

const recommendationDefects = (
  entries: readonly RecommendationEntry[],
  materialSlugs: readonly string[],
): readonly RecommendationDefect[] => {
  const covered = entries.flatMap((entry) =>
    entry.materials.map((material) => `${material} × ${entry.operation}`),
  );
  const checks: readonly (readonly [RecommendationDefect, boolean])[] = [
    [
      'unknown-material',
      entries.some((entry) => entry.materials.some((slug) => !materialSlugs.includes(slug))),
    ],
    ['duplicate-coverage', duplicates(covered).length > 0],
    ['invalid-speed', !entries.every(hasValidSpeed)],
    ['blank-text', editorialTexts(entries, 'entries').some(({ text }) => text.trim() === '')],
  ];
  return checks.filter(([, failed]) => failed).map(([defect]) => defect);
};

describe('RECOMMENDATIONS', () => {
  it('Given the reference When each entry is checked Then none has a defect', () => {
    expect(
      recommendationDefects(
        RECOMMENDATIONS,
        MATERIALS.map(({ slug }) => slug),
      ),
    ).toEqual([]);
  });

  describe('Given fictional entries for the materials "alliage-essai-alpha" and "alliage-essai-beta"', () => {
    const KNOWN = ['alliage-essai-alpha', 'alliage-essai-beta'];
    const speed = (min: number, max: number): Sourced<CuttingSpeedRange> =>
      aSourced({ min, max, unit: 'm/min' });

    it.each<[string, readonly RecommendationEntry[]]>([
      ['no entry', []],
      [
        'an entry without cutting speed',
        [aRecommendation('grooving', { materials: ['alliage-essai-alpha'] })],
      ],
      [
        'a speed range of a single value',
        [
          aRecommendation('external-finishing', {
            materials: ['alliage-essai-alpha'],
            cuttingSpeed: speed(1, 1),
          }),
        ],
      ],
      [
        'one material in two operations and two materials in one operation',
        [
          aRecommendation('grooving', { materials: ['alliage-essai-alpha'] }),
          aRecommendation('threading', {
            materials: ['alliage-essai-alpha', 'alliage-essai-beta'],
          }),
        ],
      ],
    ])('When %s is checked Then it has no defect', (_, entries) => {
      expect(recommendationDefects(entries, KNOWN)).toEqual([]);
    });

    it.each<[string, readonly RecommendationEntry[], RecommendationDefect]>([
      [
        'an entry naming an unknown material',
        [aRecommendation('grooving', { materials: ['alliage-essai-alpha', 'alliage-inconnu'] })],
        'unknown-material',
      ],
      [
        'two entries covering the same couple',
        [
          aRecommendation('grooving', { materials: ['alliage-essai-alpha'] }),
          aRecommendation('grooving', { materials: ['alliage-essai-beta', 'alliage-essai-alpha'] }),
        ],
        'duplicate-coverage',
      ],
      [
        'an entry naming a material twice',
        [aRecommendation('threading', { materials: ['alliage-essai-beta', 'alliage-essai-beta'] })],
        'duplicate-coverage',
      ],
      [
        'a speed starting at zero',
        [
          aRecommendation('external-roughing', {
            materials: ['alliage-essai-alpha'],
            cuttingSpeed: speed(0, 10),
          }),
        ],
        'invalid-speed',
      ],
      [
        'a negative speed',
        [
          aRecommendation('external-roughing', {
            materials: ['alliage-essai-alpha'],
            cuttingSpeed: speed(-10, 10),
          }),
        ],
        'invalid-speed',
      ],
      [
        'a speed range upside down',
        [
          aRecommendation('internal-finishing', {
            materials: ['alliage-essai-alpha'],
            cuttingSpeed: speed(20, 10),
          }),
        ],
        'invalid-speed',
      ],
      [
        'a speed that is not a number',
        [
          aRecommendation('internal-finishing', {
            materials: ['alliage-essai-alpha'],
            cuttingSpeed: speed(Number.NaN, 10),
          }),
        ],
        'invalid-speed',
      ],
      [
        'an endless speed range',
        [
          aRecommendation('internal-finishing', {
            materials: ['alliage-essai-alpha'],
            cuttingSpeed: speed(10, Number.POSITIVE_INFINITY),
          }),
        ],
        'invalid-speed',
      ],
      [
        'a blank geometry',
        [
          aRecommendation('grooving', {
            materials: ['alliage-essai-alpha'],
            geometry: [aSourced('  ')],
          }),
        ],
        'blank-text',
      ],
      [
        'a blank grade',
        [
          aRecommendation('grooving', {
            materials: ['alliage-essai-alpha'],
            grade: aSourced('\u00a0'),
          }),
        ],
        'blank-text',
      ],
      [
        'a blank pitfall',
        [
          aRecommendation('grooving', {
            materials: ['alliage-essai-alpha'],
            pitfalls: [aSourced('Piège fictif.'), aSourced('')],
          }),
        ],
        'blank-text',
      ],
      [
        'a blank meaning in the ISO designation',
        [
          aRecommendation('external-finishing', {
            materials: ['alliage-essai-alpha'],
            insert: anIsoInsert(
              anIsoInsertProposal({
                fields: [aSourced({ field: 'Champ fictif', code: 'Z', meaning: ' ' })],
              }),
            ),
          }),
        ],
        'blank-text',
      ],
      [
        'a blank described aspect',
        [
          aRecommendation('parting-off', {
            materials: ['alliage-essai-alpha'],
            insert: { kind: 'described', aspects: [aSourced({ aspect: 'profile', text: '' })] },
          }),
        ],
        'blank-text',
      ],
      [
        'a blank locator',
        [
          aRecommendation('grooving', {
            materials: ['alliage-essai-alpha'],
            geometry: [{ value: 'Géométrie fictive.', cite: aCitation({ locator: ' ' }) }],
          }),
        ],
        'blank-text',
      ],
    ])('When %s is checked Then it is flagged', (_, entries, defect) => {
      expect(recommendationDefects(entries, KNOWN)).toEqual([defect]);
    });
  });
});

const COMMERCIAL_NAMES: readonly RegExp[] = [/sandvik/iu, /\bCoro\p{Lu}/u];

const CITED_SOURCE_ID = /(?:\.cite|\.choice\[\d+\])\.source$/u;

const commercialNamesIn = (value: unknown, name: string): readonly string[] =>
  editorialTexts(value, name)
    .filter(
      ({ path, text }) =>
        !CITED_SOURCE_ID.test(path) && COMMERCIAL_NAMES.some((pattern) => pattern.test(text)),
    )
    .map(({ path }) => path);

describe('commercial names', () => {
  it.each<[string, unknown]>([
    ['MATERIALS', MATERIALS],
    ['OPERATION_FAMILIES', OPERATION_FAMILIES],
    ['RECOMMENDATIONS', RECOMMENDATIONS],
  ])('Given %s When its texts are read Then none names a product or its maker', (name, value) => {
    expect(commercialNamesIn(value, name)).toEqual([]);
  });

  it.each<[string, unknown, readonly string[]]>([
    [
      'a maker name in a value',
      { geometry: { value: 'Arête fictive façon Sandvik' } },
      ['sample.geometry.value'],
    ],
    [
      'a maker name in capitals',
      { grade: { value: 'Nuance SANDVIK fictive' } },
      ['sample.grade.value'],
    ],
    [
      'a product name',
      { pitfalls: [{ value: 'Plaquette CoroFictive' }] },
      ['sample.pitfalls[0].value'],
    ],
    [
      'a maker name in a locator',
      { geometry: { cite: { source: 'source-fictive', locator: 'Sandvik, page 1' } } },
      ['sample.geometry.cite.locator'],
    ],
  ])('Given %s When the guard reads it Then it is flagged', (_, value, paths) => {
    expect(commercialNamesIn(value, 'sample')).toEqual(paths);
  });

  it.each<[string, unknown]>([
    ['a word starting like a product', { value: 'Corrosion et Coromandel fictifs' }],
    [
      'the id of a catalogued source',
      { geometry: { cite: { source: 'sandvik-fictif', locator: 'fixture' } } },
    ],
  ])('Given %s When the guard reads it Then it is not flagged', (_, value) => {
    expect(commercialNamesIn(value, 'sample')).toEqual([]);
  });
});

const ISO_GROUP_LETTERS: readonly IsoGroupLetter[] = ['P', 'M', 'K', 'N', 'S', 'H'];

const SANDVIK_HOST = 'www.sandvik.coromant.com';

const WORKING_LIST: SourceId = 'julien-working-list';

const isSandvikPage = (id: SourceId): boolean => {
  const { url } = SOURCES[id];
  return url !== undefined && new URL(url).hostname === SANDVIK_HOST;
};

const isCitation = (value: object): value is SourceCitation =>
  'source' in value && 'locator' in value && 'basis' in value;

const citationsIn = (value: unknown): readonly SourceCitation[] => {
  if (Array.isArray(value)) {
    return value.flatMap(citationsIn);
  }
  if (value !== null && typeof value === 'object') {
    return isCitation(value) ? [value] : Object.values(value).flatMap(citationsIn);
  }
  return [];
};

const materialsOf = (letter: IsoGroupLetter): readonly string[] =>
  MATERIALS.filter(({ isoGroup }) => isoGroup.value === letter).map(({ slug }) => slug);

const groupOf = (slug: string): IsoGroupLetter | undefined =>
  MATERIALS.find((material) => material.slug === slug)?.isoGroup.value;

const subgroupOf = (
  slug: string,
  materials: readonly Material[] = MATERIALS,
): IsoSubgroup | undefined => materials.find((material) => material.slug === slug)?.subgroup;

const TURNING_MATERIALS: SourceId = 'sandvik-turning-materials';

const SUBGROUPS: Readonly<
  Record<IsoSubgroup, { readonly letter: IsoGroupLetter; readonly section: string | undefined }>
> = {
  'non-alloyed-steel': { letter: 'P', section: 'Tournage des aciers non alliés' },
  'low-alloyed-steel': { letter: 'P', section: 'Tournage des aciers faiblement alliés' },
  'free-cutting-steel': { letter: 'P', section: undefined },
  'ferritic-martensitic-stainless': {
    letter: 'P',
    section: 'Tournage des aciers inoxydables ferritiques et martensitiques',
  },
  'austenitic-stainless': {
    letter: 'M',
    section: 'Tournage des aciers inoxydables austénitiques',
  },
  'duplex-stainless': {
    letter: 'M',
    section: 'Tournage des aciers inoxydables duplex (austénitiques/ferritiques)',
  },
  'precipitation-hardening-stainless': { letter: 'M', section: undefined },
  'cast-iron': { letter: 'K', section: 'Tournage des fontes' },
  aluminium: { letter: 'N', section: "Tournage des alliages d'aluminium" },
  'heat-resistant-and-titanium': {
    letter: 'S',
    section: 'Tournage des superalliages réfractaires',
  },
  'hardened-steel': { letter: 'H', section: 'Tournage des aciers trempés' },
  stellite: { letter: 'H', section: undefined },
};

const sectionLocator = (name: string): string => `section «\u00a0${name}\u00a0»`;

const groupList = (letter: IsoGroupLetter): string =>
  `${sectionLocator('Groupes de matières usinées')}, ISO ${letter}`;

const part = (name: string, ...headings: readonly string[]): string =>
  [sectionLocator(name), ...headings.map((heading) => `«\u00a0${heading}\u00a0»`)].join(', ');

type SubgroupDefect =
  'several-subgroups' | 'subgroup-without-section' | 'advice-of-another-section';

const subgroupDefects = (
  entry: RecommendationEntry,
  materials: readonly Material[],
): readonly SubgroupDefect[] => {
  const subgroups = [...new Set(entry.materials.map((slug) => subgroupOf(slug, materials)))];
  const [subgroup] = subgroups;
  if (subgroups.length !== 1 || subgroup === undefined) {
    return ['several-subgroups'];
  }
  const { section } = SUBGROUPS[subgroup];
  if (section === undefined) {
    return ['subgroup-without-section'];
  }
  const advice = citationsIn(entry).filter(({ source }) => source === TURNING_MATERIALS);
  return advice.length === 0 ||
    advice.some(({ locator }) => !locator.startsWith(sectionLocator(section)))
    ? ['advice-of-another-section']
    : [];
};

describe('ISO_513_GROUPS', () => {
  it('Given the six groups When they are read Then each one sits under its own letter', () => {
    expect(Object.entries(ISO_513_GROUPS).map(([key, group]) => [key, group.letter])).toEqual(
      ISO_GROUP_LETTERS.map((letter) => [letter, letter]),
    );
  });

  it('Given the six groups When their names are read Then each is written by a Sandvik Coromant page', () => {
    expect(
      Object.values(ISO_513_GROUPS)
        .filter(
          ({ name }) =>
            name.value.trim() === '' ||
            name.cite.basis !== 'stated' ||
            !isSandvikPage(name.cite.source),
        )
        .map(({ letter }) => letter),
    ).toEqual([]);
  });

  it('Given the materials When their groups are read Then each group cited by a material has its entry', () => {
    expect(
      MATERIALS.filter(({ isoGroup }) => !Object.hasOwn(ISO_513_GROUPS, isoGroup.value)).map(
        ({ slug }) => slug,
      ),
    ).toEqual([]);
  });

  it('Given a material sheet When its group is cited Then the citation is the page that names the group, except 17-4 PH, which only the working list classes', () => {
    expect(
      MATERIALS.filter(
        ({ isoGroup }) => isoGroup.cite.source !== ISO_513_GROUPS[isoGroup.value].name.cite.source,
      ).map(({ slug }) => slug),
    ).toEqual(['x5crnicunb16-4']);
  });
});

describe('MATERIALS content', () => {
  it.each<[string, IsoGroupLetter]>([
    ['stellite-6', 'H'],
    ['x20cr13-x30cr13', 'P'],
  ])(
    'Given %s When its group is read Then the Sandvik classification wins over the working list',
    (slug, letter) => {
      expect(groupOf(slug)).toBe(letter);
    },
  );

  it('Given X20Cr13 / X30Cr13 When its subgroup is read Then it sits with the ferritic and martensitic stainless steels, cited by the section that classes them in P', () => {
    const material = MATERIALS.find(({ slug }) => slug === 'x20cr13-x30cr13');

    expect({ subgroup: material?.subgroup, group: material?.isoGroup.cite }).toEqual({
      subgroup: 'ferritic-martensitic-stainless',
      group: {
        source: 'sandvik-workpiece-materials',
        locator: sectionLocator('Aciers inoxydables ferritiques et martensitiques – P5.0-5.1'),
        basis: 'stated',
      },
    });
  });

  it.each<[string, IsoSubgroup, string]>([
    ['11smn30', 'free-cutting-steel', 'Aciers non alliés – P 1.1-1.5'],
    ['11smnpb30', 'free-cutting-steel', 'Aciers non alliés – P 1.1-1.5'],
    ['s235jr', 'non-alloyed-steel', 'Aciers non alliés – P 1.1-1.5'],
    ['s355j2', 'non-alloyed-steel', 'Aciers non alliés – P 1.1-1.5'],
    ['c45', 'non-alloyed-steel', 'Aciers non alliés – P 1.1-1.5'],
    ['42crmo4', 'low-alloyed-steel', 'Aciers faiblement alliés – P 2.1-2.6'],
    ['16mncr5', 'low-alloyed-steel', 'Aciers faiblement alliés – P 2.1-2.6'],
    ['20nicrmo2-2', 'low-alloyed-steel', 'Aciers faiblement alliés – P 2.1-2.6'],
    ['100cr6', 'low-alloyed-steel', 'Aciers faiblement alliés – P 2.1-2.6'],
  ])(
    'Given %s When its subgroup is read Then it is %s, as the section %s of the materials page classes it',
    (slug, subgroup, section) => {
      const material = MATERIALS.find((candidate) => candidate.slug === slug);

      expect({ subgroup: material?.subgroup, group: material?.isoGroup.cite.locator }).toEqual({
        subgroup,
        group: sectionLocator(section),
      });
    },
  );

  it('Given 17-4 PH When its group is read Then M is the one the working list writes for it', () => {
    expect(MATERIALS.find(({ slug }) => slug === 'x5crnicunb16-4')?.isoGroup).toEqual({
      value: 'M',
      cite: {
        source: WORKING_LIST,
        locator: 'page 2, ISO M, ligne «\u00a0Précipitation (PH)\u00a0»',
        basis: 'stated',
      },
    });
  });

  it.each<[string, readonly string[]]>([
    ['s235jr', [groupList('P'), part('Aciers ISO P', 'Usinabilité en général')]],
    ['42crmo4', [groupList('P'), part('Aciers ISO P', 'Usinabilité en général')]],
    ['11smn30', [groupList('P'), part('Aciers ISO P', "Eléments d'alliage", 'Effet positif')]],
    [
      'x5crni18-10',
      [
        groupList('M'),
        part('ISO M aciers inoxydables', 'Usinabilité en général'),
        part('ISO M aciers inoxydables', 'Usinabilité en général'),
      ],
    ],
    [
      'en-gjl-250',
      [part('ISO K fontes', 'Usinabilité en général'), groupList('K'), groupList('K')],
    ],
    [
      'en-aw-2024',
      [
        part('ISO N - Matières non ferreuses', "Usinabilité de l'aluminium"),
        groupList('N'),
        groupList('N'),
      ],
    ],
    [
      'ta6v',
      [
        groupList('S'),
        part('ISO S, superalliages réfractaires et titane', 'Usinabilité en général'),
        part('Titane– S 4.1-4.4', 'Usinabilité'),
      ],
    ],
    [
      '100cr6-trempe',
      [
        part('ISO H aciers trempés', 'Usinabilité'),
        part('ISO H aciers trempés', 'Usinabilité'),
        groupList('H'),
      ],
    ],
  ])(
    'Given %s When its behaviour is read Then each sentence cites the section of the materials page that writes it',
    (slug, locators) => {
      expect(
        MATERIALS.find((material) => material.slug === slug)?.behaviour.map(
          ({ cite }) => cite.locator,
        ),
      ).toEqual(locators);
    },
  );

  it('Given the reference When subgroups are read Then each material sits in a subgroup of its own ISO group', () => {
    expect(
      MATERIALS.filter(
        ({ subgroup, isoGroup }) => SUBGROUPS[subgroup].letter !== isoGroup.value,
      ).map(({ slug }) => slug),
    ).toEqual([]);
  });

  it('Given the reference When materials are grouped Then every ISO group has at least one', () => {
    expect(ISO_GROUP_LETTERS.filter((letter) => materialsOf(letter).length === 0)).toEqual([]);
  });

  it('Given the reference When designations are read Then each one is written on the working list', () => {
    expect(
      MATERIALS.flatMap(({ slug, designations }) =>
        designations
          .filter(({ cite }) => cite.source !== WORKING_LIST || cite.basis !== 'stated')
          .map(({ value }) => `${slug}: ${value}`),
      ),
    ).toEqual([]);
  });

  it.each<[string, RegExp]>([
    ['material-number', /^\d\.\d{4}$/u],
    ['uns', /^[A-Z]\d{5}$/u],
  ])(
    'Given the reference When %s designations are read Then each follows its format',
    (system, format) => {
      expect(
        MATERIALS.flatMap(({ designations }) =>
          designations.filter(
            (designation) => designation.system === system && !format.test(designation.value),
          ),
        ).map(({ value }) => value),
      ).toEqual([]);
    },
  );

  it('Given the reference When behaviours are read Then each material has one to three, each the advice of its group or subgroup on a Sandvik Coromant page', () => {
    expect(
      MATERIALS.filter(
        ({ behaviour }) =>
          behaviour.length > 3 ||
          behaviour.some(({ cite }) => cite.scope === undefined || !isSandvikPage(cite.source)),
      ).map(({ slug }) => slug),
    ).toEqual([]);
  });
});

const TURNING_FIELDS = ['Forme', 'Dépouille', 'Tolérance', 'Fixation et brise-copeaux'];

type PlacedProposal = {
  readonly entry: RecommendationEntry;
  readonly group: IsoGroupLetter | undefined;
  readonly subgroup: IsoSubgroup | undefined;
  readonly proposal: IsoInsertProposal;
};

const proposalsOf = (entries: readonly RecommendationEntry[]): readonly PlacedProposal[] =>
  entries.flatMap((entry) =>
    entry.insert.kind === 'iso-1832'
      ? entry.insert.proposals.map((proposal) => ({
          entry,
          group: groupOf(entry.materials[0]),
          subgroup: subgroupOf(entry.materials[0]),
          proposal,
        }))
      : [],
  );

const label = ({ entry, group, proposal }: PlacedProposal): string =>
  `${group} × ${entry.operation} × ${proposal.situation}`;

const SHAPE_WORDS: readonly (readonly [string, string])[] = [
  ['type C (80°)', 'C'],
  ['rhombique à 80°', 'C'],
  ['type D (55°)', 'D'],
  ['type V (35°)', 'V'],
  ['carrée', 'S'],
  ['trigone', 'W'],
  ['triangulaire', 'T'],
  ['ronde', 'R'],
  ['rondes', 'R'],
];

const shapesNamedBy = (locator: string): readonly string[] =>
  SHAPE_WORDS.filter(([word]) =>
    new RegExp(`(?<![\\p{L}])${word.replace(/[()]/gu, '\\$&')}(?![\\p{L}])`, 'u').test(locator),
  ).map(([, letter]) => letter);

const shapeCitation = (proposal: IsoInsertProposal): SourceCitation | undefined =>
  proposal.choice.find(({ locator }) =>
    shapesNamedBy(locator).includes(proposal.fields[0].value.code),
  );

const WRITTEN_LETTER = /forme \p{Lu}(?![\p{L}])/u;

type ShapeRule = { readonly shapes: readonly string[]; readonly advice: RegExp };

const SHAPE_RULES: Partial<Record<IsoSubgroup, ShapeRule>> = {
  'austenitic-stainless': {
    shapes: ['R', 'S'],
    advice: /plaquettes rondes ou angles d'attaque faibles/u,
  },
  'duplex-stainless': { shapes: ['S'], advice: /petits angles d'attaque/u },
  'heat-resistant-and-titanium': { shapes: ['R'], advice: /angle d'attaque de moins de 45°/u },
};

const familyOf = ({ operation }: RecommendationEntry): 'external' | 'internal' =>
  operation.startsWith('internal-') ? 'internal' : 'external';

const FAMILY_PAGE: Readonly<Record<'external' | 'internal', SourceId>> = {
  external: 'sandvik-external-turning',
  internal: 'sandvik-internal-turning',
};

describe('RECOMMENDATIONS content', () => {
  it('Given the reference When external finishing is read Then every ISO group has a recommendation', () => {
    const covered = RECOMMENDATIONS.filter(({ operation }) => operation === 'external-finishing')
      .flatMap(({ materials }) => materials)
      .map(groupOf);

    expect(ISO_GROUP_LETTERS.filter((letter) => !covered.includes(letter))).toEqual([]);
  });

  it('Given the reference When an entry is read Then it covers only materials of the subgroup whose section it cites', () => {
    expect(
      RECOMMENDATIONS.filter((entry) => subgroupDefects(entry, MATERIALS).length > 0).map(
        ({ operation, materials }) => `${operation} × ${materials.join()}`,
      ),
    ).toEqual([]);
  });

  it('Given the reference When coverage is read Then the materials of a subgroup without section are the ones left without recommendation', () => {
    const covered = new Set(RECOMMENDATIONS.flatMap(({ materials }) => materials));

    expect(MATERIALS.filter(({ slug }) => !covered.has(slug)).map(({ slug }) => slug)).toEqual([
      '11smn30',
      '11smnpb30',
      'x5crnicunb16-4',
      'stellite-6',
    ]);
  });

  it('Given the reference When the turning page is cited as written advice Then it is the advice of a subgroup', () => {
    expect(
      citationsIn(RECOMMENDATIONS)
        .filter(
          ({ source, basis, scope }) =>
            source === TURNING_MATERIALS && basis === 'stated' && scope !== 'subgroup',
        )
        .map(({ locator }) => locator),
    ).toEqual([]);
  });

  describe('Given fictional materials of several subgroups', () => {
    const MATERIALS_FIXTURE = [
      aMaterial({ slug: 'alliage-essai-alpha', subgroup: 'austenitic-stainless' }),
      aMaterial({ slug: 'alliage-essai-beta', subgroup: 'duplex-stainless' }),
      aMaterial({ slug: 'alliage-essai-gamma', subgroup: 'stellite' }),
      aMaterial({ slug: 'alliage-essai-delta', subgroup: 'non-alloyed-steel' }),
    ];
    const advice = (section: string): Sourced<string> => ({
      value: 'Conseil fictif.',
      cite: aCitation({
        source: TURNING_MATERIALS,
        locator: `${sectionLocator(section)} (fixture)`,
        scope: 'subgroup',
      }),
    });
    const AUSTENITIC = 'Tournage des aciers inoxydables austénitiques';

    it.each<[string, RecommendationEntry, readonly SubgroupDefect[]]>([
      [
        'an entry of one subgroup citing its own section',
        aRecommendation('external-finishing', {
          materials: ['alliage-essai-alpha'],
          grade: advice(AUSTENITIC),
        }),
        [],
      ],
      [
        'an entry spread over two subgroups',
        aRecommendation('external-finishing', {
          materials: ['alliage-essai-alpha', 'alliage-essai-beta'],
          grade: advice(AUSTENITIC),
        }),
        ['several-subgroups'],
      ],
      [
        'an entry for a subgroup the page has no section for',
        aRecommendation('external-finishing', {
          materials: ['alliage-essai-gamma'],
          grade: advice('Tournage des aciers trempés'),
        }),
        ['subgroup-without-section'],
      ],
      [
        'an entry citing the section of another subgroup',
        aRecommendation('external-finishing', {
          materials: ['alliage-essai-beta'],
          grade: advice(AUSTENITIC),
        }),
        ['advice-of-another-section'],
      ],
      [
        'an entry citing the sections of two steel subgroups',
        aRecommendation('external-finishing', {
          materials: ['alliage-essai-delta'],
          geometry: [advice('Tournage des aciers non alliés')],
          grade: advice('Tournage des aciers faiblement alliés'),
        }),
        ['advice-of-another-section'],
      ],
      [
        'an entry citing no section at all',
        aRecommendation('external-finishing', { materials: ['alliage-essai-alpha'] }),
        ['advice-of-another-section'],
      ],
    ])('When %s is checked Then its defects are listed', (_, entry, defects) => {
      expect(subgroupDefects(entry, MATERIALS_FIXTURE)).toEqual(defects);
    });
  });

  it('Given the reference When entries are read Then none gives a cutting speed', () => {
    expect(RECOMMENDATIONS.filter((entry) => entry.cuttingSpeed !== undefined)).toEqual([]);
  });

  it('Given the whole reference When its citations are read Then every deduced one points to a Sandvik Coromant page', () => {
    expect(
      citationsIn([ISO_513_GROUPS, MATERIALS, RECOMMENDATIONS])
        .filter(({ basis, source }) => basis === 'deduced' && !isSandvikPage(source))
        .map(({ source, locator }) => `${source}: ${locator}`),
    ).toEqual([]);
  });

  it('Given the turning entries When their codes are read Then each one reads shape, clearance, tolerance and fixing, each meaning written by the code table', () => {
    expect(
      proposalsOf(RECOMMENDATIONS)
        .filter(
          ({ proposal }) =>
            proposal.fields.map(({ value }) => value.field).join() !== TURNING_FIELDS.join() ||
            proposal.fields.some(
              ({ cite }) => cite.basis !== 'stated' || isSandvikPage(cite.source),
            ),
        )
        .map(label),
    ).toEqual([]);
  });

  it('Given the turning entries When their situations are counted Then each proposes one to three distinct situations, and fewer than two only where a material constraint rules the others out', () => {
    expect(
      RECOMMENDATIONS.flatMap((entry) => {
        if (entry.insert.kind !== 'iso-1832') return [];
        const situations = entry.insert.proposals.map(({ situation }) => situation);
        const subgroup = subgroupOf(entry.materials[0]);
        const tooFew =
          situations.length < 2 && (subgroup === undefined || SHAPE_RULES[subgroup] === undefined);
        return situations.length > 3 || duplicates(situations).length > 0 || tooFew
          ? [`${subgroup} × ${entry.operation}`]
          : [];
      }),
    ).toEqual([]);
  });

  it('Given each proposal When its choice is read Then one citation names its shape letter for its situation', () => {
    expect(
      proposalsOf(RECOMMENDATIONS)
        .filter(({ proposal }) => shapeCitation(proposal) === undefined)
        .map(label),
    ).toEqual([]);
  });

  it('Given the shape words of the pages When they are read Then each gives its ISO letter, and a letter written alone gives none', () => {
    expect(
      [
        'plaquette type C (80°) en priorité',
        'plaquette rhombique à 80°',
        "plaquette type D (55°), angle d'attaque de 93°",
        'plaquette type V (35°)',
        "plaquette carrée, angle d'attaque de 75°",
        'plaquette trigone',
        'plaquette triangulaire',
        "plaquettes rondes ou angles d'attaque faibles",
        'forme S, forme W, forme T',
        'arrondie, carrées',
      ].map(shapesNamedBy),
    ).toEqual([['C'], ['C'], ['D'], ['V'], ['S'], ['W'], ['T'], ['R'], [], []]);
  });

  it('Given the reference When a citation says what the page writes Then it never writes an ISO letter the page does not', () => {
    expect(
      citationsIn(RECOMMENDATIONS)
        .filter(({ basis, locator }) => basis === 'stated' && WRITTEN_LETTER.test(locator))
        .map(({ source, locator }) => `${source}: ${locator}`),
    ).toEqual([]);
  });

  it('Given subgroups without shape rule When a shape is proposed Then it is written for the situation by the Sandvik page of its turning family', () => {
    expect(
      proposalsOf(RECOMMENDATIONS)
        .filter(({ subgroup }) => subgroup !== undefined && SHAPE_RULES[subgroup] === undefined)
        .filter(({ entry, proposal }) => {
          const cite = shapeCitation(proposal);
          return cite?.basis !== 'stated' || cite.source !== FAMILY_PAGE[familyOf(entry)];
        })
        .map(label),
    ).toEqual([]);
  });

  it('Given subgroups whose page rules the entering angle When a code is proposed Then its shape keeps that angle, the page advice is cited as written and the shape it imposes as deduced', () => {
    expect(
      proposalsOf(RECOMMENDATIONS)
        .filter(({ subgroup }) => subgroup !== undefined && SHAPE_RULES[subgroup] !== undefined)
        .filter(({ subgroup, proposal }) => {
          const rule = SHAPE_RULES[subgroup as IsoSubgroup] as ShapeRule;
          const shape = proposal.fields[0].value.code;
          return (
            !rule.shapes.includes(shape) ||
            !proposal.choice.some(
              ({ source, basis, scope, locator }) =>
                source === TURNING_MATERIALS &&
                basis === 'stated' &&
                scope === 'subgroup' &&
                rule.advice.test(locator),
            ) ||
            !proposal.choice.some(
              ({ basis, locator }) => basis === 'deduced' && shapesNamedBy(locator).includes(shape),
            )
          );
        })
        .map(label),
    ).toEqual([]);
  });

  it('Given group N When a code is proposed Then it is positive with a sharp edge in every situation', () => {
    expect(
      proposalsOf(RECOMMENDATIONS)
        .filter(({ group }) => group === 'N')
        .filter(
          ({ proposal }) =>
            proposal.fields[1].value.code === 'N' || proposal.fields[2].value.code !== 'G',
        )
        .map(label),
    ).toEqual([]);
  });

  it('Given aluminium finishing When a code is proposed Then the source writes it whole, so nothing in its choice is deduced', () => {
    expect(
      proposalsOf(RECOMMENDATIONS)
        .filter(
          ({ group, entry }) =>
            group === 'N' &&
            (entry.operation === 'external-finishing' || entry.operation === 'internal-finishing'),
        )
        .filter(
          ({ proposal }) =>
            !proposal.choice.some(({ source }) => source === 'kyocera-aluminium-finishing') ||
            proposal.choice.some(({ basis }) => basis === 'deduced'),
        )
        .map(label),
    ).toEqual([]);
  });

  it('Given group H When a code is proposed Then its choice cites hard turning: CBN, small depth of cut and wiper', () => {
    expect(
      proposalsOf(RECOMMENDATIONS)
        .filter(({ group }) => group === 'H')
        .filter(
          ({ proposal }) =>
            !proposal.choice.some(
              ({ source, locator }) =>
                source === 'sandvik-turning-materials' &&
                ['CBN', 'profondeur', 'wiper'].every((word) => locator.includes(word)),
            ),
        )
        .map(label),
    ).toEqual([]);
  });

  it('Given each proposal When its clearance, tolerance and fixing are chosen Then they are deduced from a principle unless a source writes the whole code', () => {
    expect(
      proposalsOf(RECOMMENDATIONS)
        .filter(({ proposal }) => {
          const others = proposal.choice.filter(
            ({ locator }) => shapesNamedBy(locator).length === 0,
          );
          const wholeCode = others.some(({ source }) => source === 'kyocera-aluminium-finishing');
          return (
            !wholeCode &&
            others.some(({ basis, scope }) => basis === 'stated' && scope === undefined)
          );
        })
        .map(label),
    ).toEqual([]);
  });
});

const TRADE_NAMES: readonly RegExp[] = [
  /kyocera|mitsubishi|tungaloy|iscar|kennametal|\bseco\b|\bwalter\b|sumitomo|ceratizit/iu,
  /t-max|primeturning|xcel|safe-lok|silent tools|kenloc|kendex|top notch|logiq|heli turn/iu,
  /(?<![\p{L}\p{N}])(?:GC|CC|CB|KC|IC|MP|PDL|KYK|KS|KA|BXA|BXM|WBH|CH)\d{2,4}\p{Lu}?(?![\p{L}\p{N}])/u,
  /(?<![\p{L}\p{N}])\p{Lu}\d{2}\p{Lu}(?![\p{L}\p{N}])/u,
  /(?<![\p{L}\p{N}])-\p{Lu}{1,3}(?![\p{L}\p{N}])/u,
];

const tradeNamesIn = (value: unknown, name: string): readonly string[] =>
  editorialTexts(value, name)
    .filter(
      ({ path, text }) =>
        !CITED_SOURCE_ID.test(path) && TRADE_NAMES.some((pattern) => pattern.test(text)),
    )
    .map(({ path }) => path);

describe('trade names in recommendations', () => {
  it('Given RECOMMENDATIONS When its texts are read Then none names a maker, a tool system, a grade or a chip breaker', () => {
    expect(tradeNamesIn(RECOMMENDATIONS, 'RECOMMENDATIONS')).toEqual([]);
  });

  it.each<[string, unknown, readonly string[]]>([
    ['a maker', { grade: { value: 'Nuance fictive vue chez Kyocera' } }, ['sample.grade.value']],
    [
      'a tool system',
      { pitfalls: [{ value: 'Porte-outil T-Max fictif' }] },
      ['sample.pitfalls[0].value'],
    ],
    ['a grade', { grade: { value: 'Nuance GC4325 fictive' } }, ['sample.grade.value']],
    ['a short grade', { grade: { value: 'Nuance H13A fictive' } }, ['sample.grade.value']],
    [
      'a chip breaker',
      { geometry: [{ value: 'Brise-copeaux -PM fictif' }] },
      ['sample.geometry[0].value'],
    ],
  ])('Given %s When the guard reads it Then it is flagged', (_, value, paths) => {
    expect(tradeNamesIn(value, 'sample')).toEqual(paths);
  });

  it.each<[string, unknown]>([
    ['an ISO code', { value: 'CNMG, plaquette négative' }],
    ['a hardness and a percentage', { value: 'Au-delà de 55 HRC, ou de 13\u00a0% de silicium' }],
    ['a word with a hyphen', { value: 'Semi-finition et brise-copeaux' }],
    ['a second step', { value: 'Une seconde passe' }],
    ['the id of a catalogued source', { cite: { source: 'kyocera-fictif', locator: 'page B1' } }],
  ])('Given %s When the guard reads it Then it is not flagged', (_, value) => {
    expect(tradeNamesIn(value, 'sample')).toEqual([]);
  });
});
