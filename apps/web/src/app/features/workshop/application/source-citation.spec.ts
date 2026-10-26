import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { settle } from '@shared/testing/settle';
import type { Source, SourceCitation as Citation } from '../domain/models/source.model';
import { aCitation, aSource } from '../testing/insert-guide-builders';
import { InsertGuidePage } from '../testing/insert-guide.page-model';
import { SourceCitation } from './source-citation';

describe('SourceCitation', () => {
  async function render(
    overrides: Partial<Citation> = {},
    source: Source = aSource(),
  ): Promise<InsertGuidePage> {
    const fixture = TestBed.createComponent(SourceCitation);
    fixture.componentRef.setInput(
      'citation',
      aCitation({ locator: 'Tableau fictif 3', ...overrides }),
    );
    fixture.componentRef.setInput('source', source);
    await settle(fixture);
    return new InsertGuidePage(fixture);
  }

  it('Given a citation When it renders Then it names the source document, then where in it', async () => {
    const page = await render();

    expect([
      page.host.textContent?.replace(/\s+/g, ' ').trim(),
      page.text('source-citation-locator'),
    ]).toEqual([
      'Source : Document fictif de test (nouvel onglet), Tableau fictif 3',
      'Tableau fictif 3',
    ]);
  });

  it.each<[string, Partial<Citation>, string]>([
    [
      'deduced from the maker principles',
      { basis: 'deduced' },
      'déduit des principes du fabricant',
    ],
    ['given for the ISO group', { scope: 'group' }, 'conseil du groupe'],
    ['given for its subgroup', { scope: 'subgroup' }, 'conseil du sous-groupe'],
    [
      'given for its subgroup and deduced',
      { basis: 'deduced', scope: 'subgroup' },
      'conseil du sous-groupe, déduit des principes du fabricant',
    ],
    [
      'given for the ISO group and deduced',
      { basis: 'deduced', scope: 'group' },
      'conseil du groupe, déduit des principes du fabricant',
    ],
  ])(
    'Given a value %s When its citation renders Then it says so visibly, then links to the source',
    async (_, overrides, mention) => {
      const page = await render(overrides);
      const shown = page.one('source-citation-mention');

      expect({
        mention: page.text('source-citation-mention'),
        visible: shown?.classList.contains('sr-only'),
        beforeLink: shown?.nextElementSibling?.getAttribute('data-testid'),
        whole: page.host.textContent?.replace(/\s+/g, ' ').trim(),
      }).toEqual({
        mention,
        visible: false,
        beforeLink: 'source-citation-link',
        whole: `${mention} Source : Document fictif de test (nouvel onglet), Tableau fictif 3`,
      });
    },
  );

  it('Given a value written by the source When its citation renders Then no mention precedes it', async () => {
    const page = await render({ basis: 'stated' });

    expect(page.one('source-citation-mention')).toBeNull();
  });

  it('Given a citation When it renders Then the document title links to its URL in a new tab, said to screen readers', async () => {
    const page = await render();
    const link = page.one('source-citation-link');

    expect({
      tag: link?.tagName,
      href: link?.getAttribute('href'),
      target: link?.getAttribute('target'),
      rel: link?.getAttribute('rel'),
      newTab: link?.querySelector('.sr-only')?.textContent?.trim(),
    }).toEqual({
      tag: 'A',
      href: 'https://exemple.invalid/document-fictif',
      target: '_blank',
      rel: 'noopener noreferrer',
      newTab: '(nouvel onglet)',
    });
  });

  it('Given a source without public URL When its citation renders Then the title is plain text, with no link nor new-tab notice', async () => {
    const { url: _dropped, ...unlinked } = aSource({ title: 'Liste fictive sans lien' });
    const page = await render({ basis: 'deduced' }, unlinked);

    expect({
      link: page.one('source-citation-link'),
      anchors: page.host.querySelectorAll('a').length,
      title: page.text('source-citation-title'),
      whole: page.host.textContent?.replace(/\s+/g, ' ').trim(),
    }).toEqual({
      link: null,
      anchors: 0,
      title: 'Liste fictive sans lien',
      whole: 'déduit des principes du fabricant Source : Liste fictive sans lien, Tableau fictif 3',
    });
  });
});
