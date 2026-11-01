import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { settle } from '@shared/testing/settle';
import { AdminFormSection } from './admin-form-section';

@Component({
  imports: [AdminFormSection],
  template: `
    <fieldset
      app-admin-form-section
      number="02"
      heading="Présentation dans les Réalisations"
      description="Les textes de la carte publique."
    >
      <p data-testid="projected-field">Accroche</p>
    </fieldset>
  `,
})
class SectionHost {}

async function renderSection(): Promise<HTMLElement> {
  const fixture = TestBed.createComponent(SectionHost);
  await settle(fixture);
  return fixture.nativeElement as HTMLElement;
}

describe('AdminFormSection', () => {
  it('Given a numbered section When it renders Then the fieldset itself is the section and its legend is its first child', async () => {
    const host = await renderSection();
    const section = byTestId(host, 'form-section');

    expect({
      tag: section?.tagName,
      firstChild: section?.firstElementChild?.tagName,
    }).toEqual({ tag: 'FIELDSET', firstChild: 'LEGEND' });
  });

  it('Given a numbered section When it renders Then the legend reads the number and the heading, then the description', async () => {
    const host = await renderSection();
    const legend = byTestId(host, 'form-section')?.querySelector('legend');

    expect({
      title: testIdText(host, 'form-section-title'),
      description: testIdText(host, 'form-section-description'),
      titleInLegend: legend?.contains(byTestId(host, 'form-section-title')) ?? false,
      descriptionInLegend: legend?.contains(byTestId(host, 'form-section-description')) ?? false,
    }).toEqual({
      title: '02 · Présentation dans les Réalisations',
      description: 'Les textes de la carte publique.',
      titleInLegend: true,
      descriptionInLegend: true,
    });
  });

  it('Given projected fields When the section renders Then they follow the legend inside the fieldset', async () => {
    const host = await renderSection();
    const section = byTestId(host, 'form-section');
    const field = byTestId(host, 'projected-field');
    const legend = section?.querySelector('legend');

    expect({
      inside: section?.contains(field) ?? false,
      afterLegend:
        !!legend &&
        !!field &&
        (legend.compareDocumentPosition(field) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
    }).toEqual({ inside: true, afterLegend: true });
  });
});
