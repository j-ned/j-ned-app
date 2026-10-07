import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type AppTagSeverity = 'info' | 'secondary';

const SEVERITY_CLASSES: Record<AppTagSeverity, string> = {
  info: 'bg-primary/10 text-primary',
  secondary: 'bg-foreground/8 text-muted',
};

@Component({
  selector: 'app-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
  template: `<span
    class="inline-flex px-2 py-1 rounded-md text-xs font-medium"
    [class]="classes()"
    >{{ value() }}</span
  >`,
})
export class AppTag {
  readonly value = input.required<string | number>();
  readonly severity = input<AppTagSeverity>('info');

  protected readonly classes = computed(() => SEVERITY_CLASSES[this.severity()]);
}
