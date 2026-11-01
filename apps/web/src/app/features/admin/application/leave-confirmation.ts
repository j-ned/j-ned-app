import { signal } from '@angular/core';

export class LeaveConfirmation {
  private readonly _asked = signal(false);
  readonly asked = this._asked.asReadonly();
  private resolveLeave: ((leave: boolean) => void) | null = null;

  // Une demande restée en attente est refusée avant d'en ouvrir une nouvelle.
  ask(): Promise<boolean> {
    this.resolveLeave?.(false);
    this._asked.set(true);
    return new Promise((resolve) => (this.resolveLeave = resolve));
  }

  answer(leave: boolean): void {
    this._asked.set(false);
    this.resolveLeave?.(leave);
    this.resolveLeave = null;
  }
}
