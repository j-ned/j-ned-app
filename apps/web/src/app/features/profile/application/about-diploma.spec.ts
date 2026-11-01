import { TestBed } from '@angular/core/testing';
import type { Diploma } from '../domain/models/diploma.model';
import { aDiploma } from '../testing/profile-builders';
import { AboutDiploma } from './about-diploma';

const DIPLOMAS: readonly Diploma[] = [
  aDiploma({ id: 'diploma-1', title: 'Formation A', provider: 'Organisme A', level: 'Niveau A' }),
  aDiploma({
    id: 'diploma-2',
    title: 'Formation B',
    provider: 'Organisme B',
    level: 'Niveau B',
    skills: ['Compétence C'],
  }),
];

describe('AboutDiploma', () => {
  const render = async (summary = 'Résumé des formations témoin.'): Promise<HTMLElement> => {
    const fixture = TestBed.createComponent(AboutDiploma);
    fixture.componentRef.setInput('diplomas', DIPLOMAS);
    fixture.componentRef.setInput('summary', summary);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };

  it('Given les formations livrées When la section est rendue Then une ligne par formation avec organisme et niveau', async () => {
    const rows = Array.from((await render()).querySelectorAll('[data-testid="about-diploma"]'));

    expect(
      rows.map((row) => ({
        title: row.querySelector('h3')?.textContent?.trim(),
        meta: Array.from(
          row.querySelectorAll(
            '[data-testid="about-diploma-provider"], [data-testid="about-diploma-level"]',
          ),
        ).map((p) => p.textContent?.trim()),
      })),
    ).toEqual([
      { title: 'Formation A', meta: ['Organisme A', 'Niveau A'] },
      { title: 'Formation B', meta: ['Organisme B', 'Niveau B'] },
    ]);
  });

  it('Given une formation When la section est rendue Then chaque compétence est un élément de liste', async () => {
    const row = (await render()).querySelector('[data-testid="about-diploma"]');
    const skills = Array.from(row?.querySelectorAll('ul li') ?? []).map((li) =>
      li.textContent?.trim(),
    );
    expect(skills).toEqual(['Compétence A', 'Compétence B']);
  });

  it('Given un résumé en entrée When la section est rendue Then l’en-tête affiche ce résumé', async () => {
    expect(
      (await render('Trois titres témoins.'))
        .querySelector('[data-testid="split-section-summary"]')
        ?.textContent?.trim(),
    ).toBe('Trois titres témoins.');
  });
});
