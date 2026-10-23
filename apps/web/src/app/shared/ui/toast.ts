import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AppIcon } from '@shared/icons/app-icon';
import type { ToastEntry, ToastSeverity } from './toast.types';

type SeverityStyle = {
  container: string;
  icon: string;
  colour: string;
};

const SEVERITY_STYLES: Record<ToastSeverity, SeverityStyle> = {
  success: {
    container: 'border-status-success',
    icon: 'check-circle',
    colour: 'text-status-success',
  },
  info: {
    container: 'border-primary',
    icon: 'info-circle',
    colour: 'text-primary',
  },
  warn: {
    container: 'border-status-warn',
    icon: 'exclamation-triangle',
    colour: 'text-status-warn',
  },
  error: {
    container: 'border-status-error',
    icon: 'times-circle',
    colour: 'text-status-error',
  },
};

@Component({
  selector: 'app-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppIcon],
  template: `
    <div
      class="fixed top-4 right-4 left-4 z-[9999] flex flex-col gap-3 max-w-sm ml-auto pointer-events-none"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      @for (msg of messages(); track msg.id) {
        @let style = SEVERITY_STYLES[msg.severity];
        <div
          class="pointer-events-auto flex items-start gap-3 p-4 rounded-lg border-l-4 bg-surface shadow-lg animate-slide-in-right"
          [class]="style.container"
          role="alert"
          data-testid="toast"
        >
          <app-icon
            class="shrink-0 mt-0.5"
            [class]="style.colour"
            [name]="style.icon"
            [size]="20"
            data-testid="toast-icon"
          />
          <div class="flex-1 min-w-0">
            <div
              class="font-semibold text-sm leading-tight text-foreground"
              data-testid="toast-summary"
            >
              {{ msg.summary }}
            </div>
            @if (msg.detail) {
              <div class="text-sm mt-1 text-foreground/80 leading-relaxed">
                {{ msg.detail }}
              </div>
            }
          </div>
          <button
            type="button"
            class="shrink-0 w-11 h-11 -m-2 inline-flex items-center justify-center rounded-md transition-colors hover:bg-foreground/5"
            [class]="style.colour"
            aria-label="Fermer"
            data-testid="toast-close"
            (click)="dismiss.emit(msg.id)"
          >
            <app-icon name="xmark" [size]="12" />
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    @keyframes slide-in-right {
      from {
        transform: translateX(110%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    .animate-slide-in-right {
      animation: slide-in-right 0.25s ease-out;
    }
    @media (prefers-reduced-motion: reduce) {
      .animate-slide-in-right {
        animation: none;
      }
    }
  `,
})
export class Toast {
  readonly messages = input.required<readonly ToastEntry[]>();
  readonly dismiss = output<number>();
  protected readonly SEVERITY_STYLES = SEVERITY_STYLES;
}
