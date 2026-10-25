import { describe, expect, it } from 'vitest';
import { editorialTexts } from '../../../testing/editorial-sources';
import {
  aCitation,
  anIsoInsert,
  aRecommendation,
  aSource,
  aSourced,
} from '../testing/insert-guide-builders';
import { MATERIALS } from './materials.static-data';
import type { Material } from './models/material.model';
import type { CuttingSpeedRange, RecommendationEntry } from './models/recommendation.model';
import type { Source, Sourced } from './models/source.model';
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
  if ([source.title, source.publisher, source.url].some((text) => GENERATIVE_AI.test(text))) {
    defects.push('ai');
  }
  if ([source.title, source.publisher].some((text) => text.trim() === '')) {
    defects.push('blank-text');
  }
  if (!isHttpsUrl(source.url)) {
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
            geometry: aSourced('  '),
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
            insert: {
              ...anIsoInsert(),
              fields: [aSourced({ field: 'Champ fictif', code: 'Z', meaning: ' ' })],
            },
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
            geometry: { value: 'Géométrie fictive.', cite: aCitation({ locator: ' ' }) },
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

const CITED_SOURCE_ID = /\.cite\.source$/u;

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
