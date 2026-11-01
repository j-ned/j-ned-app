import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SplitSection } from './split-section';

@Component({
  imports: [SplitSection],
  template: `
    <app-split-section heading="Formations" headingId="diploma-heading" [summary]="summary">
      <p data-testid="projected">Contenu</p>
    </app-split-section>
  `,
})
class Host {
  summary = 'Deux titres.';
}

describe('SplitSection', () => {
  const render = (summary: string): HTMLElement => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.summary = summary;
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('Given un titre et un id When la section est rendue Then la section est nommée par son h2', () => {
    const host = render('Deux titres.');
    const heading = host.querySelector('h2');
    expect(heading?.textContent?.trim()).toBe('Formations');
    expect(heading?.id).toBe('diploma-heading');
    expect(host.querySelector('section')?.getAttribute('aria-labelledby')).toBe('diploma-heading');
  });

  it('Given du contenu projeté When la section est rendue Then il apparaît dans la section', () => {
    const host = render('Deux titres.');
    expect(host.querySelector('section [data-testid="projected"]')).not.toBeNull();
  });

  it.each([
    { summary: 'Deux titres.', expected: 1 },
    { summary: '', expected: 0 },
  ])(
    'Given le résumé « $summary » When la section est rendue Then $expected paragraphe de résumé',
    ({ summary, expected }) => {
      const host = render(summary);
      expect(host.querySelectorAll('header p')).toHaveLength(expected);
    },
  );
});
