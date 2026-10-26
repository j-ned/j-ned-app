import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { settle } from '@shared/testing/settle';
import type { IsoGroupLetter } from '../domain/models/material.model';
import { anIsoGroup, aSourced } from '../testing/insert-guide-builders';
import { InsertGuidePage } from '../testing/insert-guide.page-model';
import { IsoGroupBadge } from './iso-group-badge';

describe('IsoGroupBadge', () => {
  it.each<[IsoGroupLetter, string]>([
    ['P', 'Groupe fictif des aciers'],
    ['S', 'Groupe fictif des alliages'],
  ])(
    'Given the group %s When the badge renders Then its letter then its name are said in text, after its label',
    async (letter, name) => {
      const fixture = TestBed.createComponent(IsoGroupBadge);
      fixture.componentRef.setInput('group', anIsoGroup(letter, { name: aSourced(name) }));
      await settle(fixture);
      const page = new InsertGuidePage(fixture);

      expect([
        page.host.textContent?.replace(/\s+/g, ' ').trim(),
        page.text('iso-group-letter'),
        page.text('iso-group-name'),
      ]).toEqual([`Groupe ISO ${letter} ${name}`, letter, name]);
    },
  );

  it('Given a group When the badge renders Then the letter carries it alone: no inline style and no aria-hidden swatch', async () => {
    const fixture = TestBed.createComponent(IsoGroupBadge);
    fixture.componentRef.setInput('group', anIsoGroup('K'));
    await settle(fixture);
    const host = fixture.nativeElement as HTMLElement;

    expect([
      host.querySelector('[data-testid="iso-group-letter"]')?.textContent?.trim(),
      host.querySelectorAll('[style]').length,
      host.querySelectorAll('[aria-hidden="true"]').length,
    ]).toEqual(['K', 0, 0]);
  });
});
