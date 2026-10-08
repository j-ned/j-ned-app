import type { ReadonlyFieldTree } from '@angular/forms/signals';

export function focusFirstInvalid(field: ReadonlyFieldTree<unknown>): void {
  field().errorSummary()[0]?.fieldTree().focusBoundControl();
}
