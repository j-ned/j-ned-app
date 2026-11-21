import type { ComponentFixture } from '@angular/core/testing';
import { byTestId } from '@shared/testing/by-test-id';
import { pressTestId } from '@shared/testing/press-test-id';
import { answerConfirmDialog } from '@shared/ui/testing/confirm-dialog-page';

type PageTitleFocus = {
  readonly tag: string | undefined;
  readonly tabindex: string | null | undefined;
  readonly focused: boolean;
};

export async function deleteThroughDialog(
  fixture: ComponentFixture<unknown>,
  deleteTestId: string,
  answer: 'confirm' | 'cancel' | 'escape',
): Promise<void> {
  await pressTestId(fixture, deleteTestId, 0);
  await answerConfirmDialog(fixture, answer);
}

export function readPageTitleFocus(host: HTMLElement): PageTitleFocus {
  const title = byTestId(host, 'admin-page-title');
  return {
    tag: title?.tagName,
    tabindex: title?.getAttribute('tabindex'),
    focused: title !== null && host.ownerDocument.activeElement === title,
  };
}

export const presentTestIds = (host: HTMLElement, testIds: readonly string[]): readonly string[] =>
  testIds.filter((testId) => byTestId(host, testId) !== null);
