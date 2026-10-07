import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ConfirmDialog } from './confirm-dialog';
import { byTestId } from '@shared/testing/by-test-id';
import { settle } from '@shared/testing/settle';
import {
  answerConfirmDialog,
  confirmDialogElement,
  readConfirmDialog,
} from './testing/confirm-dialog-page';

const HEADING = 'Supprimer le projet DashFlow\u202f?';
const CONSEQUENCE = 'Le projet disparaît des Réalisations. Cette action est définitive.';

@Component({
  imports: [ConfirmDialog],
  template: `
    <app-confirm-dialog
      [open]="open()"
      [heading]="heading"
      confirmLabel="Supprimer DashFlow"
      (confirmed)="countConfirmed()"
      (cancelled)="countCancelled()"
    >
      <p>{{ consequence }}</p>
    </app-confirm-dialog>
  `,
})
class DialogHost {
  readonly open = signal(false);
  protected readonly heading = HEADING;
  protected readonly consequence = CONSEQUENCE;
  readonly confirmed = signal(0);
  readonly cancelled = signal(0);

  countConfirmed(): void {
    this.confirmed.update((count) => count + 1);
  }

  countCancelled(): void {
    this.cancelled.update((count) => count + 1);
  }
}

async function renderHost(open: boolean): Promise<{
  fixture: ComponentFixture<DialogHost>;
  host: HTMLElement;
}> {
  const fixture = TestBed.createComponent(DialogHost);
  fixture.componentInstance.open.set(open);
  await settle(fixture);
  return { fixture, host: fixture.nativeElement as HTMLElement };
}

function nativeButton(root: ParentNode, testId: string): HTMLButtonElement | null {
  const element = byTestId(root, testId);
  if (element instanceof HTMLButtonElement) return element;
  return element?.querySelector('button') ?? null;
}

describe('ConfirmDialog', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    { open: true, expected: true },
    { open: false, expected: false },
  ])(
    'Given open is $open When the dialog renders Then the native dialog open state is $expected',
    async ({ open, expected }) => {
      const { host } = await renderHost(open);

      expect({
        tag: confirmDialogElement(host)?.tagName,
        open: confirmDialogElement(host)?.open,
      }).toEqual({ tag: 'DIALOG', open: expected });
    },
  );

  it('Given a closed dialog When open turns true Then it opens as a modal', async () => {
    const showModal = vi.spyOn(HTMLDialogElement.prototype, 'showModal');
    const { fixture, host } = await renderHost(false);

    fixture.componentInstance.open.set(true);
    await settle(fixture);

    expect({
      open: confirmDialogElement(host)?.open,
      showModal: showModal.mock.calls.length,
    }).toEqual({ open: true, showModal: 1 });
  });

  it('Given an open dialog When open turns false Then the dialog closes', async () => {
    const { fixture, host } = await renderHost(true);

    fixture.componentInstance.open.set(false);
    await settle(fixture);

    expect(confirmDialogElement(host)?.open).toBe(false);
  });

  it('Given an open dialog Then it shows the heading, the projected consequence and both labels', async () => {
    const { host } = await renderHost(true);

    expect(readConfirmDialog(host)).toEqual({
      open: true,
      heading: HEADING,
      description: CONSEQUENCE,
      confirm: 'Supprimer DashFlow',
      cancel: 'Annuler',
    });
  });

  it('Given an open dialog Then it is named by its heading and described by the consequence', async () => {
    const { host } = await renderHost(true);
    const dialog = confirmDialogElement(host);
    const heading = dialog && byTestId(dialog, 'confirm-dialog-heading');
    const describedBy = dialog?.getAttribute('aria-describedby') ?? '';
    const description = describedBy ? host.ownerDocument.getElementById(describedBy) : null;

    expect({
      labelledBy: dialog?.getAttribute('aria-labelledby'),
      headingIdSet: (heading?.id ?? '') !== '',
      describedInsideDialog: description !== null && dialog?.contains(description) === true,
    }).toEqual({ labelledBy: heading?.id, headingIdSet: true, describedInsideDialog: true });
  });

  it('Given a cancel label When the dialog renders Then the cancel button shows it', async () => {
    const fixture = TestBed.createComponent(ConfirmDialog);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('heading', HEADING);
    fixture.componentRef.setInput('confirmLabel', 'Retirer le CV');
    fixture.componentRef.setInput('cancelLabel', 'Garder le CV');
    await settle(fixture);

    expect(readConfirmDialog(fixture.nativeElement as HTMLElement)).toEqual(
      expect.objectContaining({ confirm: 'Retirer le CV', cancel: 'Garder le CV' }),
    );
  });

  it.each([
    { answer: 'confirm' as const, confirmed: 1, cancelled: 0 },
    { answer: 'cancel' as const, confirmed: 0, cancelled: 1 },
    { answer: 'escape' as const, confirmed: 0, cancelled: 1 },
  ])(
    'Given an open dialog When the user answers $answer Then confirmed is emitted $confirmed time(s) and cancelled $cancelled time(s)',
    async ({ answer, confirmed, cancelled }) => {
      const { fixture } = await renderHost(true);

      await answerConfirmDialog(fixture, answer);

      expect({
        confirmed: fixture.componentInstance.confirmed(),
        cancelled: fixture.componentInstance.cancelled(),
      }).toEqual({ confirmed, cancelled });
    },
  );

  it('Given an open dialog Then the cancel button takes the initial focus', async () => {
    const { host } = await renderHost(true);
    const dialog = confirmDialogElement(host);

    expect(dialog && nativeButton(dialog, 'confirm-dialog-cancel')?.hasAttribute('autofocus')).toBe(
      true,
    );
  });

  it('Given an open dialog Then the confirm button is the solid danger button', async () => {
    const { host } = await renderHost(true);
    const dialog = confirmDialogElement(host);
    const classes = [
      ...(dialog ? (nativeButton(dialog, 'confirm-dialog-confirm')?.classList ?? []) : []),
    ];

    expect(classes).toEqual(expect.arrayContaining(['bg-status-error', 'text-on-status-error']));
  });
});
