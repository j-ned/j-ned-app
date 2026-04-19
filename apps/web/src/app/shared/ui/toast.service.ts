import { Injectable, signal } from '@angular/core';
import type { ToastEntry, ToastMessage, ToastSeverity } from './toast.types';

const DEFAULT_LIFE_MS = 3000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  readonly messages = signal<readonly ToastEntry[]>([]);

  add(message: ToastMessage): void {
    const severity: ToastSeverity = message.severity ?? 'info';
    const entry: ToastEntry = {
      id: this.nextId++,
      severity,
      summary: message.summary,
      detail: message.detail,
      life: message.life ?? DEFAULT_LIFE_MS,
    };

    this.messages.update((current) => [...current, entry]);

    if (entry.life > 0) {
      setTimeout(() => this.dismiss(entry.id), entry.life);
    }
  }

  dismiss(id: number): void {
    this.messages.update((current) => current.filter((m) => m.id !== id));
  }

  clear(): void {
    this.messages.set([]);
  }
}
