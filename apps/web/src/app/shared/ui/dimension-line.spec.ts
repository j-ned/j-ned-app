import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { DimensionLine } from './dimension-line';

const FOCUSABLE_OR_ROLE =
  'a[href], button, input, select, textarea, iframe, summary, [tabindex], [contenteditable], [role]';

describe('DimensionLine', () => {
  const render = async (
    label: string,
  ): Promise<{ fixture: ComponentFixture<DimensionLine>; host: HTMLElement }> => {
    const fixture = TestBed.createComponent(DimensionLine);
    fixture.componentRef.setInput('label', label);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, host: fixture.nativeElement as HTMLElement };
  };

  const labelOf = (host: HTMLElement): string[] =>
    Array.from(host.querySelectorAll('[data-testid="dimension-line-label"]')).map(
      (el) => el.textContent?.trim() ?? '',
    );

  it.each(['7 jours', '3 semaines'])(
    'Given le libellé « %s » When la cote est rendue Then l’hôte est masqué aux technologies d’assistance et affiche ce libellé',
    async (label) => {
      const { host } = await render(label);

      expect(host.getAttribute('aria-hidden')).toBe('true');
      expect(labelOf(host)).toEqual([label]);
    },
  );

  it('Given une cote rendue When le libellé change Then le libellé affiché suit', async () => {
    const { fixture, host } = await render('7 jours');

    fixture.componentRef.setInput('label', '10 jours');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(labelOf(host)).toEqual(['10 jours']);
  });

  it('Given une cote rendue When on parcourt son arbre Then aucun élément focalisable ni rôle ARIA n’échappe au masquage', async () => {
    const { host } = await render('7 jours');

    expect(labelOf(host)).toEqual(['7 jours']);
    expect(host.querySelectorAll(FOCUSABLE_OR_ROLE)).toHaveLength(0);
    expect(host.hasAttribute('tabindex')).toBe(false);
    expect(host.hasAttribute('role')).toBe(false);
  });
});
