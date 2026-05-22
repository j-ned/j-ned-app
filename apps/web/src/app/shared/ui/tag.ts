import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type AppTagSeverity = 'info' | 'success' | 'warn' | 'error' | 'secondary';

const SEVERITY_CLASSES: Record<AppTagSeverity, string> = {
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  warn: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  secondary: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

@Component({
  selector: 'app-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
  template: `<span class="inline-flex px-2 py-1 rounded-md text-xs font-medium" [class]="classes()">{{ value() }}</span>`,
})
export class AppTag {
  readonly value = input.required<string | number>();
  readonly severity = input<AppTagSeverity>('info');

  protected readonly classes = computed(() => SEVERITY_CLASSES[this.severity()]);
}
