import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormField, form, maxLength, required, validate } from '@angular/forms/signals';
import { byTestId } from '@shared/testing/by-test-id';
import { settle } from '@shared/testing/settle';
import { FieldError } from './field-error';

@Component({
  imports: [FormField, FieldError],
  template: `
    <input data-testid="name" [formField]="nameForm.name" />
    <div data-testid="slot">
      <app-field-error [field]="nameForm.name" errorId="name-error" [testId]="testId()" />
    </div>
  `,
})
class FieldErrorHost {
  readonly testId = signal<string | undefined>('name-error');
  readonly model = signal({ name: '' });
  readonly nameForm = form(this.model, (path) => {
    required(path.name, { message: 'Le nom est obligatoire' });
    validate(path.name, ({ value }) =>
      value() === '' ? { kind: 'blank', message: 'Message second' } : null,
    );
    maxLength(path.name, 5, { message: '5 caractères au plus' });
  });
}

type Rendered = {
  readonly fixture: ComponentFixture<FieldErrorHost>;
  readonly host: HTMLElement;
};

async function renderHost(testId: string | null = 'name-error'): Promise<Rendered> {
  const fixture = TestBed.createComponent(FieldErrorHost);
  fixture.componentInstance.testId.set(testId ?? undefined);
  await settle(fixture);
  return { fixture, host: fixture.nativeElement as HTMLElement };
}

async function typeAndLeave(rendered: Rendered, text: string): Promise<void> {
  const input = byTestId(rendered.host, 'name') as HTMLInputElement;
  input.value = text;
  input.dispatchEvent(new Event('input'));
  input.dispatchEvent(new Event('blur'));
  await settle(rendered.fixture);
}

const alerts = (host: HTMLElement): readonly HTMLElement[] => [
  ...(byTestId(host, 'slot')?.querySelectorAll<HTMLElement>('[role="alert"]') ?? []),
];

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, '');

describe('FieldError', () => {
  it('Given an invalid field never touched When it renders Then no error is shown', async () => {
    const { host } = await renderHost();

    expect({ error: byTestId(host, 'name-error'), alerts: alerts(host).length }).toEqual({
      error: null,
      alerts: 0,
    });
  });

  it.each([
    { label: 'left empty', text: '', message: 'Le nom est obligatoire' },
    { label: 'too long', text: 'abcdef', message: '5 caractères au plus' },
  ])(
    'Given a field $label When it is left Then a single paragraph announces its first message, under the given id',
    async ({ text, message }) => {
      const rendered = await renderHost();

      await typeAndLeave(rendered, text);

      expect(
        alerts(rendered.host).map((error) => ({
          tag: error.tagName,
          id: error.id,
          testId: error.getAttribute('data-testid'),
          text: normalized(error),
        })),
      ).toEqual([{ tag: 'P', id: 'name-error', testId: 'name-error', text: message }]);
    },
  );

  it('Given a field showing its error When it is corrected Then the error disappears', async () => {
    const rendered = await renderHost();
    await typeAndLeave(rendered, '');

    await typeAndLeave(rendered, 'Alice');

    expect({
      error: byTestId(rendered.host, 'name-error'),
      alerts: alerts(rendered.host).length,
    }).toEqual({ error: null, alerts: 0 });
  });

  it('Given no testId When the error shows Then it carries its id but no data-testid', async () => {
    const rendered = await renderHost(null);

    await typeAndLeave(rendered, '');

    expect(
      alerts(rendered.host).map((error) => ({
        id: error.id,
        hasTestId: error.hasAttribute('data-testid'),
      })),
    ).toEqual([{ id: 'name-error', hasTestId: false }]);
  });
});
