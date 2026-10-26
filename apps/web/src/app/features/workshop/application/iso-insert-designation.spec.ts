import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { settle } from '@shared/testing/settle';
import type { IsoInsertDesignation as Designation } from '../domain/models/recommendation.model';
import {
  aCitation,
  anIsoInsertField,
  anIsoInsertProposal,
  aReference,
} from '../testing/insert-guide-builders';
import { InsertGuidePage } from '../testing/insert-guide.page-model';
import { IsoInsertDesignation } from './iso-insert-designation';

const FICTIONAL_INSERT: Designation = {
  kind: 'iso-1832',
  proposals: [
    anIsoInsertProposal({
      situation: 'external-shoulder',
      choice: [
        aCitation({ locator: 'Forme fictive écrite pour la situation' }),
        aCitation({ basis: 'deduced', locator: 'Principe fictif de dépouille' }),
      ],
      fields: [
        anIsoInsertField('Forme fictive', 'Z', 'Losange fictif'),
        anIsoInsertField('Dépouille fictive', 'Q', 'Angle fictif', aCitation({ basis: 'deduced' })),
        anIsoInsertField('Tolérance fictive', 'X', 'Classe fictive'),
      ],
    }),
    anIsoInsertProposal({
      situation: 'external-profiling',
      choice: [aCitation({ locator: 'Code entier écrit par une source fictive' })],
      fields: [
        anIsoInsertField('Forme fictive', 'Y', 'Losange fictif étroit'),
        anIsoInsertField('Dépouille fictive', 'Q', 'Angle fictif'),
      ],
    }),
  ],
};

async function render(): Promise<InsertGuidePage> {
  const fixture = TestBed.createComponent(IsoInsertDesignation);
  fixture.componentRef.setInput('insert', FICTIONAL_INSERT);
  fixture.componentRef.setInput('sources', aReference().sources);
  await settle(fixture);
  return new InsertGuidePage(fixture);
}

describe('IsoInsertDesignation', () => {
  it('Given several situations When the designation renders Then each one is an item of a list, in order, headed by its h4 label then its code', async () => {
    const page = await render();
    const proposals = page.all('iso-insert-proposal');

    expect({
      list: proposals[0]?.parentElement?.tagName,
      proposals: proposals.map((proposal) => ({
        tag: proposal.tagName,
        heading: proposal.firstElementChild?.tagName,
        situation: page.texts('iso-insert-situation', proposal),
        codeAfterHeading:
          proposal.firstElementChild?.nextElementSibling ===
          proposal.querySelector('[data-testid="iso-insert-code"]'),
        code: page.texts('iso-insert-code', proposal),
      })),
    }).toEqual({
      list: 'UL',
      proposals: [
        {
          tag: 'LI',
          heading: 'H4',
          situation: ['Chariotage avec épaulement'],
          codeAfterHeading: true,
          code: ['ZQX'],
        },
        {
          tag: 'LI',
          heading: 'H4',
          situation: ['Profilage'],
          codeAfterHeading: true,
          code: ['YQ'],
        },
      ],
    });
  });

  it('Given several situations When the designation renders Then each code is read in its own dl, field by field, with its code, its meaning and its own citation', async () => {
    const page = await render();

    expect(
      page.all('iso-insert-proposal').map((proposal) => {
        const rows = page.all('iso-insert-field', proposal);
        return {
          list: rows[0]?.parentElement?.tagName,
          rows: rows.map((row) => ({
            field: page.texts('iso-insert-field-name', row),
            term: row.querySelector('[data-testid="iso-insert-field-name"]')?.tagName,
            code: page.texts('iso-insert-field-code', row),
            meaning: page.texts('iso-insert-field-meaning', row),
            citations: page.all('source-citation', row).length,
          })),
        };
      }),
    ).toEqual([
      {
        list: 'DL',
        rows: [
          {
            field: ['Forme fictive'],
            term: 'DT',
            code: ['Z'],
            meaning: ['Losange fictif'],
            citations: 1,
          },
          {
            field: ['Dépouille fictive'],
            term: 'DT',
            code: ['Q'],
            meaning: ['Angle fictif'],
            citations: 1,
          },
          {
            field: ['Tolérance fictive'],
            term: 'DT',
            code: ['X'],
            meaning: ['Classe fictive'],
            citations: 1,
          },
        ],
      },
      {
        list: 'DL',
        rows: [
          {
            field: ['Forme fictive'],
            term: 'DT',
            code: ['Y'],
            meaning: ['Losange fictif étroit'],
            citations: 1,
          },
          {
            field: ['Dépouille fictive'],
            term: 'DT',
            code: ['Q'],
            meaning: ['Angle fictif'],
            citations: 1,
          },
        ],
      },
    ]);
  });

  it('Given a field deduced from the maker principles When the designation renders Then only that field says it is deduced', async () => {
    const page = await render();

    expect(
      page
        .all('iso-insert-proposal')
        .map((proposal) =>
          page
            .all('iso-insert-field', proposal)
            .map((row) => page.texts('source-citation-mention', row)),
        ),
    ).toEqual([
      [[], ['déduit des principes du fabricant'], []],
      [[], []],
    ]);
  });

  it('Given several situations When the designation renders Then each code is followed by the citations of its own choice, before its fields are read', async () => {
    const page = await render();

    expect(
      page.all('iso-insert-proposal').map((proposal) => {
        const code = proposal.querySelector('[data-testid="iso-insert-code"]');
        const choices = page.all('iso-insert-choice', proposal);
        const fields = page.all('iso-insert-field', proposal)[0]?.parentElement;
        return {
          choices: choices.map((choice) => ({
            locator: page.texts('source-citation-locator', choice),
            mention: page.texts('source-citation-mention', choice),
          })),
          afterCode: choices[0]?.previousElementSibling === code,
          beforeFields: choices.at(-1)?.nextElementSibling === fields,
        };
      }),
    ).toEqual([
      {
        choices: [
          { locator: ['Forme fictive écrite pour la situation'], mention: [] },
          {
            locator: ['Principe fictif de dépouille'],
            mention: ['déduit des principes du fabricant'],
          },
        ],
        afterCode: true,
        beforeFields: true,
      },
      {
        choices: [{ locator: ['Code entier écrit par une source fictive'], mention: [] }],
        afterCode: true,
        beforeFields: true,
      },
    ]);
  });
});
