import type { ComponentFixture } from '@angular/core/testing';
import { byTestId, settleBounded } from '@shared/testing/press-test-id';

type ConfirmDialogView = {
  readonly open: boolean;
  readonly heading: string;
  readonly description: string;
  readonly confirm: string;
  readonly cancel: string;
};

const text = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, '');

export function confirmDialogElement(root: ParentNode): HTMLDialogElement | null {
  const element = byTestId(root, 'confirm-dialog');
  return element instanceof HTMLDialogElement ? element : null;
}

export function readConfirmDialog(root: HTMLElement): ConfirmDialogView {
  const dialog = confirmDialogElement(root);
  const describedBy = dialog?.getAttribute('aria-describedby');
  return {
    open: dialog?.open === true,
    heading: text(dialog && byTestId(dialog, 'confirm-dialog-heading')),
    description: describedBy ? text(root.ownerDocument.getElementById(describedBy)) : '',
    confirm: text(dialog && byTestId(dialog, 'confirm-dialog-confirm')),
    cancel: text(dialog && byTestId(dialog, 'confirm-dialog-cancel')),
  };
}

async function escapeConfirmDialog(fixture: ComponentFixture<unknown>): Promise<void> {
  confirmDialogElement(fixture.nativeElement as HTMLElement)?.dispatchEvent(
    new Event('cancel', { cancelable: true }),
  );
  await settleBounded(fixture);
}

export async function answerConfirmDialog(
  fixture: ComponentFixture<unknown>,
  answer: 'confirm' | 'cancel' | 'escape',
): Promise<void> {
  if (answer === 'escape') {
    await escapeConfirmDialog(fixture);
    return;
  }
  const dialog = confirmDialogElement(fixture.nativeElement as HTMLElement);
  const element = dialog && byTestId(dialog, `confirm-dialog-${answer}`);
  const button = element?.tagName === 'BUTTON' ? element : element?.querySelector('button');
  button?.click();
  await settleBounded(fixture);
}
