import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormField, form } from '@angular/forms/signals';
import { describe, it, expect, beforeEach } from 'vitest';
import { settle } from '@shared/testing/settle';
import { AdminTagsSelector } from './admin-tags-selector';

const chipsOf = (host: HTMLElement): HTMLButtonElement[] => [
  ...host.querySelectorAll<HTMLButtonElement>('[data-testid="tag-chip"]'),
];

const chipNames = (host: HTMLElement): string[] =>
  chipsOf(host).map((chip) => chip.textContent?.trim() ?? '');

const pressed = (host: HTMLElement): (string | null)[] =>
  chipsOf(host).map((chip) => chip.getAttribute('aria-pressed'));

async function clickChip(fixture: ComponentFixture<unknown>, name: string): Promise<void> {
  const host = fixture.nativeElement as HTMLElement;
  chipsOf(host)
    .find((chip) => chip.textContent?.trim() === name)
    ?.click();
  await settle(fixture);
}

describe('AdminTagsSelector', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AdminTagsSelector] });
  });

  async function render(
    available: readonly string[],
    value: readonly string[] = [],
  ): Promise<ComponentFixture<AdminTagsSelector>> {
    const fixture = TestBed.createComponent(AdminTagsSelector);
    fixture.componentRef.setInput('availableTags', [...available]);
    fixture.componentRef.setInput('value', [...value]);
    await settle(fixture);
    return fixture;
  }

  it('Given a value When the chips render Then one chip per available tag is shown, pressed when the value holds it', async () => {
    const fixture = await render(['Angular', 'PBKDF2'], ['Angular']);

    expect({
      names: chipNames(fixture.nativeElement),
      pressed: pressed(fixture.nativeElement),
    }).toEqual({ names: ['Angular', 'PBKDF2'], pressed: ['true', 'false'] });
  });

  it.each([
    {
      start: ['Angular'],
      clicks: ['PBKDF2'],
      value: ['Angular', 'PBKDF2'],
      pressed: ['true', 'true'],
    },
    {
      start: ['Angular'],
      clicks: ['PBKDF2', 'Angular'],
      value: ['PBKDF2'],
      pressed: ['false', 'true'],
    },
    {
      start: ['Angular', 'PBKDF2'],
      clicks: ['Angular', 'Angular'],
      value: ['PBKDF2', 'Angular'],
      pressed: ['true', 'true'],
    },
  ])(
    'Given the value $start When $clicks is clicked Then the value is $value, as a new list',
    async ({ start, clicks, value, pressed: expectedPressed }) => {
      const initial = [...start];
      const fixture = await render(['Angular', 'PBKDF2']);
      fixture.componentRef.setInput('value', initial);
      await settle(fixture);

      for (const name of clicks) await clickChip(fixture, name);

      expect({
        value: fixture.componentInstance.value(),
        pressed: pressed(fixture.nativeElement),
        initial,
      }).toEqual({ value, pressed: expectedPressed, initial: start });
    },
  );

  it('Given a value holding a tag outside the catalogue When a chip is clicked Then that tag is kept and has no chip', async () => {
    const fixture = await render(['Angular', 'PBKDF2'], ['Héritée', 'Angular']);

    await clickChip(fixture, 'PBKDF2');

    expect({
      value: fixture.componentInstance.value(),
      names: chipNames(fixture.nativeElement),
    }).toEqual({ value: ['Héritée', 'Angular', 'PBKDF2'], names: ['Angular', 'PBKDF2'] });
  });

  it.each<[string, string, string]>([
    ['Angular', 'text-primary', 'bg-primary-bg'],
    ['PBKDF2', 'text-primary', 'bg-primary-bg'],
    ['Tests', 'text-primary', 'bg-primary-bg'],
    ['Carrière', 'text-primary', 'bg-primary-bg'],
    ['CI/CD', 'text-primary', 'bg-primary-bg'],
    ['Tag projet', 'text-muted', 'bg-primary-bg'],
  ])('colours "%s": %s when idle, %s when selected', async (tag, tint, solid) => {
    const fixture = await render([tag]);
    const chip = (): HTMLButtonElement => chipsOf(fixture.nativeElement)[0];
    expect(chip().className).toContain(tint);
    chip().click();
    await settle(fixture);
    expect(chip().className).toContain(solid);
    expect(chip().className).not.toContain(tint);
  });
});

@Component({
  imports: [AdminTagsSelector, FormField],
  template: ` <app-admin-tags-selector [availableTags]="available" [formField]="tagsForm.tags" /> `,
})
class TagsFieldHost {
  readonly available: readonly string[] = ['Angular', 'PBKDF2'];
  readonly draft = signal<{ tags: readonly string[] }>({ tags: ['Angular'] });
  readonly tagsForm = form(this.draft);
}

describe('AdminTagsSelector: bound by [formField]', () => {
  async function renderHost(): Promise<ComponentFixture<TagsFieldHost>> {
    const fixture = TestBed.createComponent(TagsFieldHost);
    await settle(fixture);
    return fixture;
  }

  it('Given a form whose tags hold Angular When the field renders Then the Angular chip is pressed', async () => {
    const fixture = await renderHost();

    expect(pressed(fixture.nativeElement)).toEqual(['true', 'false']);
  });

  it('Given the bound field When PBKDF2 is clicked Then the form model holds it after Angular', async () => {
    const fixture = await renderHost();

    await clickChip(fixture, 'PBKDF2');

    expect({
      tags: fixture.componentInstance.draft().tags,
      pressed: pressed(fixture.nativeElement),
    }).toEqual({ tags: ['Angular', 'PBKDF2'], pressed: ['true', 'true'] });
  });

  it('Given the bound field When the form model is replaced Then the chips follow it', async () => {
    const fixture = await renderHost();

    fixture.componentInstance.draft.set({ tags: ['PBKDF2'] });
    await settle(fixture);

    expect(pressed(fixture.nativeElement)).toEqual(['false', 'true']);
  });
});
