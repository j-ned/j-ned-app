import { describe, expect, it } from 'vitest';
import { INSERT_GUIDE_COPY } from '@features/workshop/application/insert-guide-copy';
import { findConfidentialReferences } from '@features/workshop/domain/confidential-references';
import { MACHINING_OPERATIONS } from '@features/workshop/domain/machining-operations.static-data';
import { WORKSHOP_SPACE } from '@features/workshop/domain/workshop-space.static-data';
import WORKSHOP_GUIDE_FIXTURE from '../../ci/api-stub/fixtures/workshop-guide.json';
import { editorialTexts, ROUTE_TEXTS } from './testing/editorial-sources';

const confidentialPaths = (value: unknown, name: string): readonly string[] =>
  editorialTexts(value, name)
    .filter(({ text }) => findConfidentialReferences(text).length > 0)
    .map(({ path }) => path);

describe('workshop confidentiality', () => {
  it.each<[string, unknown]>([
    ['WORKSHOP_SPACE', WORKSHOP_SPACE],
    ['the /atelier route', ROUTE_TEXTS['/atelier']],
    ['INSERT_GUIDE_COPY', INSERT_GUIDE_COPY],
    ['MACHINING_OPERATIONS', MACHINING_OPERATIONS],
    ['the /atelier/plaquettes route', ROUTE_TEXTS['/atelier/plaquettes']],
    ['ci/api-stub/fixtures/workshop-guide.json', WORKSHOP_GUIDE_FIXTURE],
  ])('Given %s When its texts are read Then none carries a part reference', (name, value) => {
    expect(confidentialPaths(value, name)).toEqual([]);
  });

  describe('Given fictional content', () => {
    it.each<[string, unknown, readonly string[]]>([
      [
        'an intro paragraph',
        { heading: 'Espace fictif', intro: ['Paragraphe fictif.', 'Repris du plan n° 12.'] },
        ['sample.intro[1]'],
      ],
      ['an operation label', [{ id: 'grooving', label: 'Gorge P/N 4521-07' }], ['sample[0].label']],
      [
        'a guide line note',
        { entries: [{ material: 'Matière fictive', note: 'Vue sur l’OF n° 3.' }] },
        ['sample.entries[0].note'],
      ],
    ])('When %s carries a part reference Then its path is flagged', (_, value, paths) => {
      expect(confidentialPaths(value, 'sample')).toEqual(paths);
    });
  });
});
