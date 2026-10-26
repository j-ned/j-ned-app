import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormField, form } from '@angular/forms/signals';
import { beforeEach, describe, expect, it } from 'vitest';
import { settle } from '@shared/testing/settle';
import type { Material } from '../domain/models/material.model';
import { aMaterialCatalogue } from '../testing/insert-guide-builders';
import { InsertGuidePage } from '../testing/insert-guide.page-model';
import { INSERT_GUIDE_COPY } from './insert-guide-copy';
import { MaterialCombobox } from './material-combobox';

const [ALPHA, BETA, GAMMA] = aMaterialCatalogue();
const nameOf = (material: Material): string => material.designations[0].value;

async function render(
  materials: readonly Material[] = [ALPHA, BETA, GAMMA],
  value = '',
): Promise<{ fixture: ComponentFixture<MaterialCombobox>; page: InsertGuidePage }> {
  TestBed.configureTestingModule({ imports: [MaterialCombobox] });
  const fixture = TestBed.createComponent(MaterialCombobox);
  fixture.componentRef.setInput('materials', materials);
  fixture.componentRef.setInput('value', value);
  await settle(fixture);
  return { fixture, page: new InsertGuidePage(fixture) };
}

describe('MaterialCombobox', () => {
  describe('accessible structure', () => {
    it('Given the field When it renders Then the input is a closed list combobox named by its label and described by the hint', async () => {
      const { page } = await render();
      const input = page.materialInput;
      const byId = (attribute: string): Element | null =>
        page.host.querySelector(`[id="${input.getAttribute(attribute)}"]`);

      expect({
        hasId: input.id !== '',
        role: input.getAttribute('role'),
        autocomplete: input.getAttribute('aria-autocomplete'),
        browserAutocomplete: input.getAttribute('autocomplete'),
        expanded: input.getAttribute('aria-expanded'),
        label: page.host.querySelector(`label[for="${input.id}"]`)?.textContent?.trim(),
        hint: byId('aria-describedby')?.textContent?.trim(),
        listbox: byId('aria-controls')?.getAttribute('role'),
        listboxLabel: byId('aria-controls')?.getAttribute('aria-label'),
        options: page.options().length,
      }).toEqual({
        hasId: true,
        role: 'combobox',
        autocomplete: 'list',
        browserAutocomplete: 'off',
        expanded: 'false',
        label: INSERT_GUIDE_COPY.materialLabel,
        hint: INSERT_GUIDE_COPY.materialHint,
        listbox: 'listbox',
        listboxLabel: INSERT_GUIDE_COPY.materialListLabel,
        options: 0,
      });
    });

    it('Given the field When it renders Then its status region exists and is silent', async () => {
      const { page } = await render();

      expect([page.one('material-status')?.getAttribute('role'), page.materialStatus()]).toEqual([
        'status',
        '',
      ]);
    });
  });

  describe('search', () => {
    it.each<[string, string, readonly string[], string]>([
      [
        'a shared fragment of two designations',
        'zz fictif',
        ['Alliage essai Alpha', 'Alliage essai Bêta'],
        '2 matières trouvées',
      ],
      ['an AISI designation', 'test-001', ['Alliage essai Alpha'], '1 matière trouvée'],
      [
        'a material number typed without dash',
        'TEST002',
        ['Alliage essai Gamma'],
        '1 matière trouvée',
      ],
    ])(
      'Given %s When it is typed Then the matching materials are listed and their count announced',
      async (_case, query, names, status) => {
        const { page } = await render();

        await page.typeMaterial(query);

        expect({
          names: page.optionNames(),
          status: page.materialStatus(),
          expanded: page.expanded(),
        }).toEqual({ names, status, expanded: 'true' });
      },
    );

    it('Given a designation that is not the displayed name When it matches Then the option says which designation and system matched, and the ISO group letter in text', async () => {
      const { page } = await render();

      await page.typeMaterial('test-001');
      const option = page.options()[0];

      expect({
        match: page.texts('material-option-match', option),
        group: page.texts('material-option-group', option),
      }).toEqual({ match: ['TEST-001 · AISI'], group: ['Groupe ISO P'] });
    });

    it('Given the displayed name matches When it is typed Then the option repeats no designation', async () => {
      const { page } = await render();

      await page.typeMaterial('gamma');

      expect(page.texts('material-option-match', page.options()[0])).toEqual([]);
    });

    it('Given a designation absent from the guide When it is typed Then nothing is listed, the absence is announced and said visibly', async () => {
      const { page } = await render();

      await page.typeMaterial('ZZ-INCONNU');

      expect({
        options: page.options().length,
        expanded: page.expanded(),
        status: page.materialStatus(),
        notFound: page.text('material-not-found'),
      }).toEqual({
        options: 0,
        expanded: 'false',
        status: INSERT_GUIDE_COPY.noMaterialFound,
        notFound: INSERT_GUIDE_COPY.materialNotInGuide,
      });
    });
  });

  describe('keyboard', () => {
    it('Given an empty field When ArrowDown is pressed Then every material is listed and the first one is active', async () => {
      const { page } = await render();

      const event = await page.press('ArrowDown');
      const first = page.options()[0];

      expect({
        names: page.optionNames(),
        active: page.activeOptionName(),
        activeDescendant: page.materialInput.getAttribute('aria-activedescendant'),
        selected: page.options().map((option) => option.getAttribute('aria-selected')),
        prevented: event.defaultPrevented,
        status: page.materialStatus(),
      }).toEqual({
        names: [nameOf(ALPHA), nameOf(BETA), nameOf(GAMMA)],
        active: nameOf(ALPHA),
        activeDescendant: first.id,
        selected: ['true', 'false', 'false'],
        prevented: true,
        status: '3 matières trouvées',
      });
    });

    it('Given the list is open When the arrows run past either end Then the active option wraps around', async () => {
      const { page } = await render();
      const actives: (string | null)[] = [];

      for (const key of [
        'ArrowDown',
        'ArrowDown',
        'ArrowDown',
        'ArrowDown',
        'ArrowUp',
        'ArrowUp',
      ]) {
        await page.press(key);
        actives.push(page.activeOptionName());
      }

      expect(actives).toEqual([
        nameOf(ALPHA),
        nameOf(BETA),
        nameOf(GAMMA),
        nameOf(ALPHA),
        nameOf(GAMMA),
        nameOf(BETA),
      ]);
    });

    it('Given a closed list When ArrowUp is pressed Then the list opens on the last material', async () => {
      const { page } = await render();

      await page.press('ArrowUp');

      expect(page.activeOptionName()).toBe(nameOf(GAMMA));
    });

    it('Given an active option When Enter is pressed Then its slug becomes the value, the field shows its name and the list closes', async () => {
      const { fixture, page } = await render();

      await page.press('ArrowDown');
      await page.press('ArrowDown');
      const event = await page.press('Enter');

      expect({
        value: fixture.componentInstance.value(),
        text: page.materialInput.value,
        expanded: page.expanded(),
        options: page.options().length,
        activeDescendant: page.materialInput.getAttribute('aria-activedescendant'),
        prevented: event.defaultPrevented,
      }).toEqual({
        value: BETA.slug,
        text: nameOf(BETA),
        expanded: 'false',
        options: 0,
        activeDescendant: null,
        prevented: true,
      });
    });

    it('Given a typed text with matches but no active option When Enter is pressed Then nothing is chosen', async () => {
      const { fixture, page } = await render();

      await page.typeMaterial('alpha');
      const event = await page.press('Enter');

      expect([fixture.componentInstance.value(), event.defaultPrevented]).toEqual(['', true]);
    });

    it('Given an open list When Escape is pressed Then it closes and keeps the typed text and the value', async () => {
      const { fixture, page } = await render(undefined, ALPHA.slug);

      await page.typeMaterial('zz');
      const event = await page.press('Escape');

      expect({
        expanded: page.expanded(),
        options: page.options().length,
        text: page.materialInput.value,
        value: fixture.componentInstance.value(),
        prevented: event.defaultPrevented,
      }).toEqual({ expanded: 'false', options: 0, text: 'zz', value: ALPHA.slug, prevented: true });
    });

    it('Given a closed list over a typed text When Escape is pressed Then the field shows the chosen material again', async () => {
      const { page } = await render(undefined, ALPHA.slug);

      await page.typeMaterial('zz');
      await page.press('Escape');
      await page.press('Escape');

      expect(page.materialInput.value).toBe(nameOf(ALPHA));
    });

    it('Given nothing is chosen and a typed text When Escape is pressed twice Then the field is emptied', async () => {
      const { page } = await render();

      await page.typeMaterial('zz');
      await page.press('Escape');
      await page.press('Escape');

      expect(page.materialInput.value).toBe('');
    });

    it('Given an open list When the field loses focus Then the list closes without choosing', async () => {
      const { fixture, page } = await render();

      await page.press('ArrowDown');
      await page.leaveMaterial();

      expect([page.expanded(), page.options().length, fixture.componentInstance.value()]).toEqual([
        'false',
        0,
        '',
      ]);
    });
  });

  describe('clearing the field', () => {
    it('Given a chosen material When its text is cleared and the field loses focus Then nothing is chosen any more', async () => {
      const { fixture, page } = await render(undefined, ALPHA.slug);

      await page.typeMaterial('');
      await page.leaveMaterial();

      expect([
        fixture.componentInstance.value(),
        page.materialInput.value,
        page.expanded(),
      ]).toEqual(['', '', 'false']);
    });

    it('Given a chosen material When its text is cleared and Escape is pressed Then nothing is chosen any more and the field stays empty', async () => {
      const { fixture, page } = await render(undefined, ALPHA.slug);

      await page.typeMaterial('');
      const event = await page.press('Escape');

      expect({
        value: fixture.componentInstance.value(),
        text: page.materialInput.value,
        expanded: page.expanded(),
        prevented: event.defaultPrevented,
      }).toEqual({ value: '', text: '', expanded: 'false', prevented: true });
    });

    it('Given a chosen material When a partial text is left by losing focus Then the material stays chosen', async () => {
      const { fixture, page } = await render(undefined, ALPHA.slug);

      await page.typeMaterial('zz');
      await page.leaveMaterial();

      expect(fixture.componentInstance.value()).toBe(ALPHA.slug);
    });
  });

  describe('pointer', () => {
    it('Given an open list When an option is clicked Then the field keeps the focus and the option is chosen', async () => {
      const { fixture, page } = await render();

      await page.typeMaterial('fictif');
      const prevented = await page.pickOption(nameOf(BETA));

      expect({
        prevented,
        value: fixture.componentInstance.value(),
        text: page.materialInput.value,
        expanded: page.expanded(),
      }).toEqual({ prevented: true, value: BETA.slug, text: nameOf(BETA), expanded: 'false' });
    });
  });

  describe('value set from outside', () => {
    it('Given a value set from outside When the field renders Then it shows the name of that material', async () => {
      const { fixture, page } = await render();

      fixture.componentRef.setInput('value', GAMMA.slug);
      await settle(fixture);
      const chosen = page.materialInput.value;
      fixture.componentRef.setInput('value', '');
      await settle(fixture);

      expect([chosen, page.materialInput.value]).toEqual([nameOf(GAMMA), '']);
    });
  });

  describe('empty reference (no material verified yet)', () => {
    it('Given no material When ArrowDown is pressed Then no list opens and the absence is announced', async () => {
      const { fixture, page } = await render([]);

      const event = await page.press('ArrowDown');
      await page.press('Enter');

      expect({
        options: page.options().length,
        expanded: page.expanded(),
        activeDescendant: page.materialInput.getAttribute('aria-activedescendant'),
        status: page.materialStatus(),
        prevented: event.defaultPrevented,
        value: fixture.componentInstance.value(),
      }).toEqual({
        options: 0,
        expanded: 'false',
        activeDescendant: null,
        status: INSERT_GUIDE_COPY.noMaterialFound,
        prevented: true,
        value: '',
      });
    });

    it('Given no material When a designation is typed Then the field says it is not in the guide yet', async () => {
      const { page } = await render([]);

      await page.typeMaterial('ZZ-FICTIF-1');

      expect([page.materialStatus(), page.text('material-not-found')]).toEqual([
        INSERT_GUIDE_COPY.noMaterialFound,
        INSERT_GUIDE_COPY.materialNotInGuide,
      ]);
    });
  });
});

@Component({
  imports: [MaterialCombobox, FormField],
  template: `<app-material-combobox
    [materials]="materials"
    [formField]="selectionForm.material"
  />`,
})
class MaterialFieldHost {
  readonly materials = [ALPHA, BETA, GAMMA];
  readonly selection = signal({ material: BETA.slug });
  readonly selectionForm = form(this.selection);
}

describe('MaterialCombobox: bound by [formField]', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [MaterialFieldHost] });
  });

  async function renderHost(): Promise<{
    fixture: ComponentFixture<MaterialFieldHost>;
    page: InsertGuidePage;
  }> {
    const fixture = TestBed.createComponent(MaterialFieldHost);
    await settle(fixture);
    return { fixture, page: new InsertGuidePage(fixture) };
  }

  it('Given a form holding a slug When the field renders Then it shows that material', async () => {
    const { page } = await renderHost();

    expect(page.materialInput.value).toBe(nameOf(BETA));
  });

  it('Given the bound field When a material is chosen at the keyboard Then the form model follows', async () => {
    const { fixture, page } = await renderHost();

    await page.typeMaterial('gamma');
    await page.press('ArrowDown');
    await page.press('Enter');

    expect(fixture.componentInstance.selection()).toEqual({ material: GAMMA.slug });
  });

  it('Given the bound field When the form model is replaced Then the field shows the new material', async () => {
    const { fixture, page } = await renderHost();

    fixture.componentInstance.selection.set({ material: ALPHA.slug });
    await settle(fixture);

    expect(page.materialInput.value).toBe(nameOf(ALPHA));
  });
});
