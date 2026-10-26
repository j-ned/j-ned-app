import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { settle } from '@shared/testing/settle';
import type { Material } from '../domain/models/material.model';
import { aMaterialCatalogue, aReference } from '../testing/insert-guide-builders';
import { InsertGuidePage } from '../testing/insert-guide.page-model';
import { MaterialSheet } from './material-sheet';

const [ALPHA] = aMaterialCatalogue();

async function render(material: Material = ALPHA): Promise<InsertGuidePage> {
  const fixture = TestBed.createComponent(MaterialSheet);
  fixture.componentRef.setInput('material', material);
  fixture.componentRef.setInput('sources', aReference().sources);
  fixture.componentRef.setInput('isoGroups', aReference().isoGroups);
  await settle(fixture);
  return new InsertGuidePage(fixture);
}

describe('MaterialSheet', () => {
  it('Given a material When its sheet renders Then the h3 is its displayed name and its ISO group letter and name follow in text', async () => {
    const page = await render();

    expect({
      tag: page.one('material-sheet-name')?.tagName,
      name: page.sheetName(),
      group: page.text('iso-group-letter'),
      groupName: page.text('iso-group-name'),
    }).toEqual({
      tag: 'H3',
      name: 'Alliage essai Alpha',
      group: 'P',
      groupName: 'Groupe fictif P',
    });
  });

  it('Given a material When its sheet renders Then each behaviour trait is a paragraph followed by its own citation', async () => {
    const page = await render();

    expect(
      page.all('material-behaviour').map((trait) => ({
        tag: trait.tagName,
        text: page.texts('material-behaviour-text', trait),
        locator: page.texts('source-citation-locator', trait),
      })),
    ).toEqual([
      { tag: 'DIV', text: ['Comportement fictif Alpha.'], locator: ['fixture'] },
      { tag: 'DIV', text: ['Second trait fictif Alpha.'], locator: ['fixture'] },
    ]);
  });

  it('Given a material When its sheet renders Then every designation is listed in a dl with its system and its own citation', async () => {
    const page = await render();
    const rows = page.all('material-designation');

    expect({
      list: rows[0]?.parentElement?.tagName,
      rows: rows.map((row) => ({
        system: page.texts('material-designation-system', row),
        value: page.texts('material-designation-value', row),
        citations: page.all('source-citation', row).length,
      })),
    }).toEqual({
      list: 'DL',
      rows: [
        { system: ['Nom courant'], value: ['Alliage essai Alpha'], citations: 1 },
        { system: ['Symbole EN'], value: ['ZZ-FICTIF-1'], citations: 1 },
        { system: ['AISI'], value: ['TEST-001'], citations: 1 },
      ],
    });
  });

  it('Given a material When its sheet renders Then its designations come under the heading that calls them indicative', async () => {
    const page = await render();
    const list = page.all('material-designation')[0]?.parentElement;
    const heading = list?.previousElementSibling;

    expect({
      tag: heading?.tagName,
      text: heading?.textContent?.trim(),
      testId: heading?.getAttribute('data-testid'),
    }).toEqual({
      tag: 'H4',
      text: 'Correspondances indicatives',
      testId: 'material-designations-heading',
    });
  });

  it('Given a material When its sheet renders Then the ISO group is cited too, so every datum has its source', async () => {
    const page = await render();

    expect([
      page.all('source-citation').length,
      page.texts('source-citation-locator', page.one('material-sheet-group')),
    ]).toEqual([1 + 2 + 3, ['fixture']]);
  });
});
