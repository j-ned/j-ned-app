import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from './toast.service';
import { ToastType } from './toast.model';

const ICON_IDS: Record<ToastType, string> = {
  success: 'lucide-check',
  error: 'lucide-x',
  warning: 'lucide-zap',
  info: 'lucide-lightbulb',
};

@Component({
  selector: 'app-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="toast-item pointer-events-auto flex items-center gap-3 rounded-lg px-4 py-3
                 shadow-lg backdrop-blur-sm min-w-[300px] max-w-[420px]"
          [class]="typeClasses[toast.type]"
          role="alert"
        >
          <svg class="size-5 shrink-0">
            <use [attr.href]="'icons/sprite.svg#' + iconIds[toast.type]" />
          </svg>
          <span class="flex-1 text-sm font-medium">{{ toast.message }}</span>
          <button
            class="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            (click)="toastService.dismiss(toast.id)"
            aria-label="Fermer"
          >
            <svg class="size-4">
              <use href="icons/sprite.svg#lucide-x" />
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .toast-item {
      animation: toast-in 0.3s ease-out;
    }

    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .toast-success {
      background-color: rgba(22, 163, 74, 0.95);
      color: white;
    }

    .toast-error {
      background-color: rgba(220, 38, 38, 0.95);
      color: white;
    }

    .toast-warning {
      background-color: rgba(217, 119, 6, 0.95);
      color: white;
    }

    .toast-info {
      background-color: rgba(37, 99, 235, 0.95);
      color: white;
    }
  `,
})
export class ToastContainer {
  protected readonly toastService = inject(ToastService);

  protected readonly iconIds = ICON_IDS;

  protected readonly typeClasses: Record<ToastType, string> = {
    success: 'toast-success',
    error: 'toast-error',
    warning: 'toast-warning',
    info: 'toast-info',
  };
}
