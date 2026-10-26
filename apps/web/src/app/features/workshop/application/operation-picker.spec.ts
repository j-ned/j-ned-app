import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormField, form } from '@angular/forms/signals';
import { beforeEach, describe, expect, it } from 'vitest';
import { settle } from '@shared/testing/settle';
import { OPERATION_FAMILIES } from '../domain/operations.static-data';
import { InsertGuidePage } from '../testing/insert-guide.page-model';
import { INSERT_GUIDE_COPY } from './insert-guide-copy';
import { OperationPicker } from './operation-picker';

const ALL_OPERATIONS = OPERATION_FAMILIES.flatMap(({ operations }) => operations);
const collapsed = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').trim();

async function render(
  value = '',
): Promise<{ fixture: ComponentFixture<OperationPicker>; page: InsertGuidePage }> {
  TestBed.configureTestingModule({ imports: [OperationPicker] });
  const fixture = TestBed.createComponent(OperationPicker);
  fixture.componentRef.setInput('families', OPERATION_FAMILIES);
  fixture.componentRef.setInput('value', value);
  await settle(fixture);
  return { fixture, page: new InsertGuidePage(fixture) };
}

describe('OperationPicker', () => {
  it('Given the families When the picker renders Then one group named « Opération » holds a fieldset per family, named by its visible legend', async () => {
    const { page } = await render();
    const outer = page.one('operation-picker');
    const families = page.all('operation-family');

    expect({
      outer: outer?.tagName,
      outerLegend: collapsed(outer?.querySelector(':scope > legend')),
      outerLegendHidden: outer?.querySelector(':scope > legend')?.classList.contains('sr-only'),
      families: families.map((family) => [
        family.tagName,
        collapsed(family.querySelector(':scope > legend')),
      ]),
      nested: families.every((family) => outer?.contains(family)),
    }).toEqual({
      outer: 'FIELDSET',
      outerLegend: INSERT_GUIDE_COPY.operationLegend,
      outerLegendHidden: true,
      families: OPERATION_FAMILIES.map(({ label }) => ['FIELDSET', label]),
      nested: true,
    });
  });

  it('Given the families When the picker renders Then each operation is a native radio, labelled, valued by its slug, all sharing one name', async () => {
    const { page } = await render();
    const radios = page.operationRadios();

    expect({
      radios: radios.map((radio) => [
        radio.type,
        radio.value,
        collapsed(page.host.querySelector(`label[for="${radio.id}"]`)),
      ]),
      names: [...new Set(radios.map((radio) => radio.name))].length,
      named: radios.every((radio) => radio.name !== ''),
      perFamily: page
        .all('operation-family')
        .map((family) => page.all('operation-radio', family).length),
    }).toEqual({
      radios: ALL_OPERATIONS.map(({ slug, label }) => ['radio', slug, label]),
      names: 1,
      named: true,
      perFamily: OPERATION_FAMILIES.map(({ operations }) => operations.length),
    });
  });

  it('Given nothing chosen When the picker renders Then no radio is checked', async () => {
    const { page } = await render();

    expect([page.operationRadios().length, page.checkedOperations()]).toEqual([
      ALL_OPERATIONS.length,
      [],
    ]);
  });

  it.each(['gorge', 'percage-plaquettes', 'finition-interieure'])(
    'Given the picker When the radio %s is chosen Then it becomes the value and the only checked radio',
    async (slug) => {
      const { fixture, page } = await render('ebauche-exterieure');

      await page.chooseOperation(slug);

      expect([fixture.componentInstance.value(), page.checkedOperations()]).toEqual([slug, [slug]]);
    },
  );

  it('Given a value set from outside When the picker renders Then its radio is checked, then none once emptied', async () => {
    const { fixture, page } = await render();

    fixture.componentRef.setInput('value', 'filetage');
    await settle(fixture);
    const checked = page.checkedOperations();
    fixture.componentRef.setInput('value', '');
    await settle(fixture);

    expect([checked, page.checkedOperations()]).toEqual([['filetage'], []]);
  });
});

@Component({
  imports: [OperationPicker, FormField],
  template: `<app-operation-picker [families]="families" [formField]="selectionForm.operation" />`,
})
class OperationFieldHost {
  readonly families = OPERATION_FAMILIES;
  readonly selection = signal({ operation: 'gorge' });
  readonly selectionForm = form(this.selection);
}

describe('OperationPicker: bound by [formField]', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [OperationFieldHost] });
  });

  async function renderHost(): Promise<{
    fixture: ComponentFixture<OperationFieldHost>;
    page: InsertGuidePage;
  }> {
    const fixture = TestBed.createComponent(OperationFieldHost);
    await settle(fixture);
    return { fixture, page: new InsertGuidePage(fixture) };
  }

  it('Given a form holding a slug When the picker renders Then its radio is checked', async () => {
    const { page } = await renderHost();

    expect(page.checkedOperations()).toEqual(['gorge']);
  });

  it('Given the bound picker When an operation is chosen Then the form model follows', async () => {
    const { fixture, page } = await renderHost();

    await page.chooseOperation('tronconnage');

    expect(fixture.componentInstance.selection()).toEqual({ operation: 'tronconnage' });
  });

  it('Given the bound picker When the form model is replaced Then the checked radio follows', async () => {
    const { fixture, page } = await renderHost();

    fixture.componentInstance.selection.set({ operation: 'finition-exterieure' });
    await settle(fixture);

    expect(page.checkedOperations()).toEqual(['finition-exterieure']);
  });
});
