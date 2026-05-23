import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AppIcon } from '@shared/icons';
import type { ToastEntry, ToastSeverity } from './toast.types';

type SeverityStyle = {
  container: string;
  icon: string;
  iconClass: string;
  summary: string;
  close: string;
};

const SEVERITY_STYLES: Record<ToastSeverity, SeverityStyle> = {
  success: {
    container: 'bg-status-success/10 border-status-success/40',
    icon: 'check-circle',
    iconClass: 'text-status-success',
    summary: 'text-status-success',
    close: 'text-status-success/70 hover:bg-status-success/10',
  },
  info: {
    container: 'bg-primary/10 border-primary/40',
    icon: 'info-circle',
    iconClass: 'text-primary',
    summary: 'text-primary',
    close: 'text-primary/70 hover:bg-primary/10',
  },
  warn: {
    container: 'bg-status-warn/10 border-status-warn/40',
    icon: 'exclamation-triangle',
    iconClass: 'text-status-warn',
    summary: 'text-status-warn',
    close: 'text-status-warn/70 hover:bg-status-warn/10',
  },
  error: {
    container: 'bg-status-error/10 border-status-error/40',
    icon: 'times-circle',
    iconClass: 'text-status-error',
    summary: 'text-status-error',
    close: 'text-status-error/70 hover:bg-status-error/10',
  },
};

@Component({
  selector: 'app-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppIcon],
  template: `
    <div
      class="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-[calc(100vw-2rem)] max-w-sm pointer-events-none"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      @for (msg of messages(); track msg.id) {
        @let style = SEVERITY_STYLES[msg.severity];
        <div
          class="pointer-events-auto flex items-start gap-3 p-4 rounded-lg border-l-4 shadow-lg backdrop-blur-sm animate-slide-in-right"
          [class]="style.container"
          role="alert"
        >
          <app-icon
            class="shrink-0 mt-0.5"
            [class]="style.iconClass"
            [name]="style.icon"
            [size]="20"
          />
          <div class="flex-1 min-w-0">
            @if (msg.summary) {
              <div class="font-semibold text-sm leading-tight" [class]="style.summary">
                {{ msg.summary }}
              </div>
            }
            @if (msg.detail) {
              <div class="text-sm mt-1 text-foreground/80 leading-relaxed">
                {{ msg.detail }}
              </div>
            }
          </div>
          <button
            type="button"
            class="shrink-0 w-6 h-6 inline-flex items-center justify-center rounded-md transition-colors"
            [class]="style.close"
            aria-label="Fermer"
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
  `,
})
export class Toast {
  readonly messages = input.required<readonly ToastEntry[]>();
  readonly dismiss = output<number>();
  protected readonly SEVERITY_STYLES = SEVERITY_STYLES;
}
