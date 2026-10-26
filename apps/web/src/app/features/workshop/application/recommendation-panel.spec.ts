import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { settle } from '@shared/testing/settle';
import type {
  ExternalSituation,
  GuideState,
  RecommendationEntry,
} from '../domain/models/recommendation.model';
import {
  aCitation,
  aMaterialCatalogue,
  anIsoInsert,
  anIsoInsertField,
  anIsoInsertProposal,
  anOperation,
  aRecommendation,
  aReference,
  aSourced,
} from '../testing/insert-guide-builders';
import { InsertGuidePage } from '../testing/insert-guide.page-model';
import { INSERT_GUIDE_COPY } from './insert-guide-copy';
import { RecommendationPanel } from './recommendation-panel';

const [ALPHA] = aMaterialCatalogue();

async function render(state: GuideState): Promise<InsertGuidePage> {
  TestBed.configureTestingModule({ imports: [RecommendationPanel] });
  const fixture = TestBed.createComponent(RecommendationPanel);
  fixture.componentRef.setInput('state', state);
  fixture.componentRef.setInput('sources', aReference().sources);
  await settle(fixture);
  return new InsertGuidePage(fixture);
}

describe('RecommendationPanel', () => {
  it('Given an incomplete selection When the panel renders Then it invites to choose a material and an operation', async () => {
    const page = await render({ status: 'incomplete' });

    expect({
      tag: page.one('recommendation-incomplete')?.tagName,
      incomplete: page.text('recommendation-incomplete'),
      unavailable: page.one('insert-guide-unavailable'),
    }).toEqual({ tag: 'P', incomplete: INSERT_GUIDE_COPY.incomplete, unavailable: null });
  });

  it('Given a combination without recommendation When the panel renders Then it says so plainly and shows nothing else', async () => {
    const page = await render({
      status: 'unavailable',
      material: ALPHA,
      operation: anOperation('external-finishing', { label: 'Finition fictive' }),
    });

    expect({
      tag: page.one('insert-guide-unavailable')?.tagName,
      unavailable: page.text('insert-guide-unavailable'),
      incomplete: page.one('recommendation-incomplete'),
      whole: page.host.textContent?.replace(/[ \t\n\r]+/g, ' ').trim(),
      citations: page.all('source-citation').length,
    }).toEqual({
      tag: 'P',
      unavailable: INSERT_GUIDE_COPY.unavailable,
      incomplete: null,
      whole: INSERT_GUIDE_COPY.unavailable,
      citations: 0,
    });
  });

  const OUTER_FINISHING = anOperation('external-finishing', { label: 'Finition fictive' });

  const ENTRY = aRecommendation('external-finishing', {
    materials: [ALPHA.slug],
    insert: anIsoInsert<ExternalSituation>(
      anIsoInsertProposal({
        situation: 'external-shoulder',
        choice: [aCitation({ basis: 'deduced' })],
        fields: [
          anIsoInsertField('Forme fictive', 'Z', 'Losange fictif'),
          anIsoInsertField(
            'Dépouille fictive',
            'Q',
            'Angle fictif',
            aCitation({ basis: 'deduced' }),
          ),
        ],
      }),
      anIsoInsertProposal({
        situation: 'external-steep-profiling',
        choice: [aCitation()],
        fields: [anIsoInsertField('Forme fictive', 'Y', 'Losange fictif étroit')],
      }),
    ),
    geometry: [
      { value: 'Géométrie fictive.', cite: aCitation({ basis: 'deduced' }) },
      { value: 'Seconde géométrie fictive.', cite: aCitation({ scope: 'group' }) },
    ],
    grade: aSourced('Nuance fictive.'),
    cuttingSpeed: aSourced({ min: 123, max: 456, unit: 'm/min' }),
    pitfalls: [
      aSourced('Premier piège fictif.'),
      { value: 'Second piège fictif.', cite: aCitation({ scope: 'group' }) },
    ],
  });

  const available = (entry: RecommendationEntry = ENTRY): GuideState => ({
    status: 'available',
    material: ALPHA,
    operation: OUTER_FINISHING,
    entry,
  });

  const blocks = (page: InsertGuidePage): readonly Record<string, unknown>[] =>
    page.all('recommendation-block').map((block) => ({
      heading: block.firstElementChild?.tagName,
      title: block.firstElementChild?.textContent?.trim(),
      values: page.texts('recommendation-value', block),
      situations: page.texts('iso-insert-situation', block),
      code: page.texts('iso-insert-code', block),
      mentions: page
        .all('source-citation', block)
        .map((citation) => page.texts('source-citation-mention', citation).join('')),
    }));

  it('Given an available recommendation When the panel renders Then it shows the insert, geometry, grade and pitfalls blocks, each under its h3', async () => {
    const page = await render(available());

    expect({
      headings: [...page.host.querySelectorAll('h3')].map((heading) => heading.textContent?.trim()),
      unavailable: page.one('insert-guide-unavailable'),
      incomplete: page.one('recommendation-incomplete'),
    }).toEqual({
      headings: ['Plaquette', 'Géométrie', 'Nuance', 'Pièges'],
      unavailable: null,
      incomplete: null,
    });
  });

  it('Given an available recommendation When the panel renders Then every value is followed by its citation, each insert code under its situation, followed by the principles it is deduced from, each saying when it is deduced or given for the group', async () => {
    const page = await render(available());

    expect(blocks(page)).toEqual([
      {
        heading: 'H3',
        title: 'Plaquette',
        values: [],
        situations: ['Chariotage avec épaulement', 'Profilage à forte rampe'],
        code: ['ZQ', 'Y'],
        mentions: [
          'déduit des principes du fabricant',
          '',
          'déduit des principes du fabricant',
          '',
          '',
        ],
      },
      {
        heading: 'H3',
        title: 'Géométrie',
        values: ['Géométrie fictive.', 'Seconde géométrie fictive.'],
        situations: [],
        code: [],
        mentions: ['déduit des principes du fabricant', 'conseil du groupe'],
      },
      {
        heading: 'H3',
        title: 'Nuance',
        values: ['Nuance fictive.'],
        situations: [],
        code: [],
        mentions: [''],
      },
      {
        heading: 'H3',
        title: 'Pièges',
        values: ['Premier piège fictif.', 'Second piège fictif.'],
        situations: [],
        code: [],
        mentions: ['', 'conseil du groupe'],
      },
    ]);
  });

  it('Given a recommendation whose source gives a cutting speed When the panel renders Then no speed is shown', async () => {
    const page = await render(available());
    const whole = page.host.textContent ?? '';

    expect({
      min: whole.includes('123'),
      max: whole.includes('456'),
      unit: whole.includes('m/min'),
      blocks: page.all('recommendation-block').length,
    }).toEqual({ min: false, max: false, unit: false, blocks: 4 });
  });

  it('Given a recommendation without pitfall When the panel renders Then no empty pitfalls block is shown', async () => {
    const page = await render(available({ ...ENTRY, pitfalls: [] }));

    expect(
      [...page.host.querySelectorAll('h3')].map((heading) => heading.textContent?.trim()),
    ).toEqual(['Plaquette', 'Géométrie', 'Nuance']);
  });
});
