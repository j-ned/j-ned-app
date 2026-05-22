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
    container: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-400/60',
    icon: 'check-circle',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    summary: 'text-emerald-900 dark:text-emerald-100',
    close: 'text-emerald-700/70 dark:text-emerald-300/70 hover:bg-emerald-500/10',
  },
  info: {
    container: 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 dark:border-blue-400/60',
    icon: 'info-circle',
    iconClass: 'text-blue-600 dark:text-blue-400',
    summary: 'text-blue-900 dark:text-blue-100',
    close: 'text-blue-700/70 dark:text-blue-300/70 hover:bg-blue-500/10',
  },
  warn: {
    container: 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 dark:border-amber-400/60',
    icon: 'exclamation-triangle',
    iconClass: 'text-amber-600 dark:text-amber-400',
    summary: 'text-amber-900 dark:text-amber-100',
    close: 'text-amber-700/70 dark:text-amber-300/70 hover:bg-amber-500/10',
  },
  error: {
    container: 'bg-red-50 dark:bg-red-950/40 border-red-500 dark:border-red-400/60',
    icon: 'times-circle',
    iconClass: 'text-red-600 dark:text-red-400',
    summary: 'text-red-900 dark:text-red-100',
    close: 'text-red-700/70 dark:text-red-300/70 hover:bg-red-500/10',
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
