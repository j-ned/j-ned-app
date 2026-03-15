import { Injectable, signal } from '@angular/core';
import { Toast, ToastType } from './toast.model';

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  error: 6000,
  warning: 5000,
  info: 4000,
};

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  private nextId = 0;

  success(message: string, duration?: number): void {
    this.show('success', message, duration);
  }

  error(message: string, duration?: number): void {
    this.show('error', message, duration);
  }

  warning(message: string, duration?: number): void {
    this.show('warning', message, duration);
  }

  info(message: string, duration?: number): void {
    this.show('info', message, duration);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private show(type: ToastType, message: string, duration?: number): void {
    const resolvedDuration = duration ?? DEFAULT_DURATIONS[type];
    const toast: Toast = { id: this.nextId++, type, message, duration: resolvedDuration };
    this.toasts.update((list) => [...list, toast]);
    setTimeout(() => this.dismiss(toast.id), resolvedDuration);
  }
}
