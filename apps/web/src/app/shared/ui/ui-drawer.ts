import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  effect,
  inject,
  model,
  viewChild,
  input,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

type Position = 'left' | 'right';

@Component({
  selector: 'app-ui-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'close()',
  },
  template: `
    @if (visible()) {
      <div
        class="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm animate-fade-in"
        (click)="close()"
        aria-hidden="true"
      ></div>
      <div
        #panel
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="ariaLabel()"
        tabindex="-1"
        [class]="panelClasses()"
        [class.animate-slide-right]="position() === 'right'"
        [class.animate-slide-left]="position() === 'left'"
      >
        @if (heading()) {
          <header class="flex items-center justify-between p-5 border-b border-foreground/10">
            <span class="text-lg font-bold text-foreground">{{ heading() }}</span>
            <button
              type="button"
              class="inline-flex items-center justify-center w-9 h-9 rounded-full text-muted hover:text-foreground hover:bg-foreground/5 transition"
              aria-label="Fermer"
              (click)="close()"
            >
              <i class="pi pi-times text-lg" aria-hidden="true"></i>
            </button>
          </header>
        }
        <div class="p-5 overflow-y-auto flex-1">
          <ng-content />
        </div>
      </div>
    }
  `,
  styles: `
    @keyframes fade-in {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    @keyframes slide-in-right {
      from {
        transform: translateX(100%);
      }
      to {
        transform: translateX(0);
      }
    }
    @keyframes slide-in-left {
      from {
        transform: translateX(-100%);
      }
      to {
        transform: translateX(0);
      }
    }
    .animate-fade-in {
      animation: fade-in 0.2s ease-out;
    }
    .animate-slide-right {
      animation: slide-in-right 0.25s ease-out;
    }
    .animate-slide-left {
      animation: slide-in-left 0.25s ease-out;
    }
  `,
})
export class UiDrawer {
  private readonly document = inject(DOCUMENT);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  readonly visible = model(false);
  readonly position = input<Position>('right');
  readonly heading = input<string | undefined>(undefined);
  readonly ariaLabel = input<string>('Drawer');

  protected readonly panelClasses = computed(() => {
    const base =
      'fixed top-0 bottom-0 z-[1001] w-[85vw] max-w-sm bg-background border-foreground/10 flex flex-col shadow-2xl outline-none';
    const side = this.position() === 'right' ? 'right-0 border-l' : 'left-0 border-r';
    return `${base} ${side}`;
  });

  constructor() {
    effect(() => {
      const body = this.document.body;
      if (!body) return;
      body.style.overflow = this.visible() ? 'hidden' : '';
    });

    afterRenderEffect(() => {
      this.panel()?.nativeElement.focus();
    });
  }

  close(): void {
    if (this.visible()) {
      this.visible.set(false);
    }
  }
}
