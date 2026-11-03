import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { byTestId } from '@shared/testing/by-test-id';
import { settle, settleBounded } from '@shared/testing/settle';
import { AdminSaveBar } from './admin-save-bar';

@Component({ template: '' })
class BlankPage {}

type BarInputs = { readonly changes?: number; readonly submitting?: boolean };

type RenderedBar = { readonly fixture: ComponentFixture<AdminSaveBar>; readonly host: HTMLElement };

async function renderBar({
  changes = 0,
  submitting = false,
}: BarInputs = {}): Promise<RenderedBar> {
  TestBed.configureTestingModule({
    providers: [provideRouter([{ path: 'admin/projects', component: BlankPage }])],
  });
  const fixture = TestBed.createComponent(AdminSaveBar);
  fixture.componentRef.setInput('formId', 'project-form');
  fixture.componentRef.setInput('changes', changes);
  fixture.componentRef.setInput('submitting', submitting);
  fixture.componentRef.setInput('cancelRoute', '/admin/projects');
  await settle(fixture);
  return { fixture, host: fixture.nativeElement as HTMLElement };
}

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, '');

const submitButton = (host: HTMLElement): HTMLButtonElement | null => {
  const element = byTestId(host, 'savebar-submit');
  return element instanceof HTMLButtonElement
    ? element
    : (element?.querySelector('button') ?? null);
};

describe('AdminSaveBar', () => {
  it.each([
    { changes: 0, state: 'Aucune modification' },
    { changes: 2, state: '2 modifications non enregistrées' },
  ])(
    'Given $changes change(s) When the bar renders Then its status reads « $state »',
    async ({ changes, state }) => {
      const { host } = await renderBar({ changes });
      const status = byTestId(host, 'savebar-state');

      expect({ role: status?.getAttribute('role'), text: normalized(status) }).toEqual({
        role: 'status',
        text: state,
      });
    },
  );

  it.each([
    { changes: 0, submitting: false, disabled: false },
    { changes: 3, submitting: false, disabled: false },
    { changes: 3, submitting: true, disabled: true },
  ])(
    'Given $changes change(s) and a submission in progress $submitting When the bar renders Then « Enregistrer » is disabled: $disabled',
    async ({ changes, submitting, disabled }) => {
      const { host } = await renderBar({ changes, submitting });

      expect(submitButton(host)?.disabled).toBe(disabled);
    },
  );

  it('Given the bar When « Annuler » is followed Then the admin goes back to the cancel route', async () => {
    const { fixture, host } = await renderBar({ changes: 1 });
    const cancel = byTestId(host, 'savebar-cancel');

    cancel?.click();
    await settleBounded(fixture);

    expect({
      url: TestBed.inject(Router).url,
    }).toEqual({ url: '/admin/projects' });
  });
});
