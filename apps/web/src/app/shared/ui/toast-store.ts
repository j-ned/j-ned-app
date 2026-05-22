import { DestroyRef, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { ToastEntry, ToastMessage, ToastSeverity } from './toast.types';

const DEFAULT_LIFE_MS = 3000;

@Injectable({ providedIn: 'root' })
export class ToastStore {
  private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly _timers = new Map<number, ReturnType<typeof setTimeout>>();
  private _nextId = 1;

  readonly messages = signal<readonly ToastEntry[]>([]);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clear());
  }

  add(message: ToastMessage): void {
    const severity: ToastSeverity = message.severity ?? 'info';
    const entry: ToastEntry = {
      id: this._nextId++,
      severity,
      summary: message.summary,
      detail: message.detail,
      life: message.life ?? DEFAULT_LIFE_MS,
    };

    this.messages.update((current) => [...current, entry]);

    if (entry.life > 0 && this._isBrowser) {
      const handle = setTimeout(() => this.dismiss(entry.id), entry.life);
      this._timers.set(entry.id, handle);
    }
  }

  dismiss(id: number): void {
    this.clearTimer(id);
    this.messages.update((current) => current.filter((m) => m.id !== id));
  }

  clear(): void {
    for (const id of this._timers.keys()) this.clearTimer(id);
    this.messages.set([]);
  }

  private clearTimer(id: number): void {
    const handle = this._timers.get(id);
    if (handle !== undefined) {
      clearTimeout(handle);
      this._timers.delete(id);
    }
  }
}
