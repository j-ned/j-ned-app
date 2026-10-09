import { TestBed } from '@angular/core/testing';
import { STATIC_DIPLOMAS } from '../infra/data/profile.static-data';
import { AboutDiploma } from './about-diploma';

describe('AboutDiploma', () => {
  const render = async (): Promise<HTMLElement> => {
    const fixture = TestBed.createComponent(AboutDiploma);
    fixture.componentRef.setInput('diplomas', STATIC_DIPLOMAS);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };

  it('Given les formations livrées When la section est rendue Then une ligne par formation avec organisme et niveau', async () => {
    const rows = Array.from((await render()).querySelectorAll('[data-testid="about-diploma"]'));
    expect(rows).toHaveLength(STATIC_DIPLOMAS.length);
    STATIC_DIPLOMAS.forEach((diploma, i) => {
      expect(rows[i].querySelector('h3')?.textContent?.trim()).toBe(diploma.title);
      expect(rows[i].textContent).toContain(diploma.provider);
      expect(rows[i].textContent).toContain(diploma.level);
    });
  });

  it('Given une formation When la section est rendue Then chaque compétence est un élément de liste', async () => {
    const row = (await render()).querySelector('[data-testid="about-diploma"]');
    const skills = Array.from(row?.querySelectorAll('ul li') ?? []).map((li) =>
      li.textContent?.trim(),
    );
    expect(skills).toEqual([...STATIC_DIPLOMAS[0].skills]);
  });

  // Le niveau est une métadonnée : il ne doit plus polluer le titre affiché.
  it.each(STATIC_DIPLOMAS.map((d) => d.title))(
    'Given le titre « %s » Then il ne contient pas le niveau',
    (title) => {
      expect(title).not.toMatch(/Bac\+2/);
    },
  );
});
