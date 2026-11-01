import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormField, form, required } from '@angular/forms/signals';
import { byTestId } from '@shared/testing/by-test-id';
import { settle } from '@shared/testing/settle';
import { focusFirstInvalid } from './focus-first-invalid';

type FocusModel = { c: string; b: string; a: string; unbound: string };

// Clés du modèle dans l'ordre inverse du DOM : seul l'ordre des contrôles liés doit compter.
@Component({
  imports: [FormField],
  template: `
    <button type="button" data-testid="elsewhere">Ailleurs</button>
    <input data-testid="a" [formField]="fields.a" />
    <input data-testid="b" [formField]="fields.b" />
    <input data-testid="c" [formField]="fields.c" />
  `,
})
class FocusHost {
  readonly model = signal<FocusModel>({ c: '', b: '', a: '', unbound: 'rempli' });
  readonly fields = form(this.model, (path) => {
    required(path.a);
    required(path.b);
    required(path.c);
    required(path.unbound);
  });
}

type Rendered = {
  readonly fixture: ComponentFixture<FocusHost>;
  readonly host: HTMLElement;
};

async function renderHost(values: Partial<FocusModel>): Promise<Rendered> {
  const fixture = TestBed.createComponent(FocusHost);
  fixture.componentInstance.model.update((model) => ({ ...model, ...values }));
  await settle(fixture);
  const host = fixture.nativeElement as HTMLElement;
  byTestId(host, 'elsewhere')?.focus();
  return { fixture, host };
}

const focusedTestId = (): string | null =>
  document.activeElement?.getAttribute('data-testid') ?? null;

describe('focusFirstInvalid', () => {
  it.each([
    { given: 'a, b and c empty', values: {}, focused: 'a' },
    { given: 'a filled', values: { a: 'x' }, focused: 'b' },
    { given: 'a and b filled', values: { a: 'x', b: 'x' }, focused: 'c' },
    {
      given: 'b and the unbound field empty',
      values: { a: 'x', c: 'x', unbound: '' },
      focused: 'b',
    },
  ])(
    'Given $given When the first invalid field is focused Then the focus lands on $focused',
    async ({ values, focused }) => {
      const { fixture } = await renderHost(values);

      focusFirstInvalid(fixture.componentInstance.fields);

      expect(focusedTestId()).toBe(focused);
    },
  );

  it('Given every field valid When the first invalid field is focused Then the focus does not move', async () => {
    const { fixture } = await renderHost({ a: 'x', b: 'x', c: 'x' });

    focusFirstInvalid(fixture.componentInstance.fields);

    expect(focusedTestId()).toBe('elsewhere');
  });

  it('Given only the unbound field invalid When the first invalid field is focused Then nothing throws and the focus does not move', async () => {
    const { fixture } = await renderHost({ a: 'x', b: 'x', c: 'x', unbound: '' });

    expect(() => focusFirstInvalid(fixture.componentInstance.fields)).not.toThrow();
    expect(focusedTestId()).toBe('elsewhere');
  });
});
