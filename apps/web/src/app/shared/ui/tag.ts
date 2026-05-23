import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type AppTagSeverity = 'info' | 'success' | 'warn' | 'error' | 'secondary';

const SEVERITY_CLASSES: Record<AppTagSeverity, string> = {
  info: 'bg-primary/10 text-primary',
  success: 'bg-status-success/15 text-status-success',
  warn: 'bg-status-warn/15 text-status-warn',
  error: 'bg-status-error/15 text-status-error',
  secondary: 'bg-foreground/8 text-muted',
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
