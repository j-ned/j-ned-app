import type { CanDeactivateFn } from '@angular/router';

export type LeaveConfirmable = { canLeave(): boolean | Promise<boolean> };

export const unsavedChangesGuard: CanDeactivateFn<LeaveConfirmable> = (page) => page.canLeave();
