import { Component, computed, input } from '@angular/core';

const TONE_CLASSES = {
  success: 'bg-status-success/10 border-status-success/30 text-status-success',
  error: 'bg-status-error/10 border-status-error/30 text-status-error',
} as const;

@Component({
  selector: 'app-status-message',
  host: {
    'data-testid': 'status-message',
    class: 'block p-3 rounded-lg border text-sm text-center',
    '[class]': 'toneClass()',
    '[attr.role]': "tone() === 'error' ? 'alert' : 'status'",
  },
  template: `<ng-content />`,
})
export class StatusMessage {
  readonly tone = input.required<keyof typeof TONE_CLASSES>();

  protected readonly toneClass = computed(() => TONE_CLASSES[this.tone()]);
}
