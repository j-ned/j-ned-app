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
import { AppIcon } from '@shared/icons/app-icon';

type Position = 'left' | 'right';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

@Component({
  selector: 'app-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppIcon],
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
        (keydown.tab)="trapForward($event)"
        (keydown.shift.tab)="trapBackward($event)"
      >
        @if (heading()) {
          <header class="flex items-center justify-between p-5 border-b border-foreground/10">
            <span class="text-lg font-bold text-foreground">{{ heading() }}</span>
            <button
              type="button"
              class="inline-flex items-center justify-center w-11 h-11 rounded-full text-muted hover:text-foreground hover:bg-foreground/5 transition"
              aria-label="Fermer"
              (click)="close()"
            >
              <app-icon name="xmark" [size]="18" />
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
export class Drawer {
  private readonly _document = inject(DOCUMENT);
  private readonly _panel = viewChild<ElementRef<HTMLElement>>('panel');
  private _previousActiveElement: HTMLElement | null = null;

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
      const body = this._document.body;
      if (!body) return;
      const isVisible = this.visible();
      body.style.overflow = isVisible ? 'hidden' : '';

      if (isVisible) {
        this._previousActiveElement = this._document.activeElement as HTMLElement | null;
      } else if (this._previousActiveElement) {
        this._previousActiveElement.focus();
        this._previousActiveElement = null;
      }
    });

    afterRenderEffect({
      write: () => {
        this._panel()?.nativeElement.focus();
      },
    });
  }

  close(): void {
    if (this.visible()) {
      this.visible.set(false);
    }
  }

  protected trapForward(event: Event): void {
    const focusables = this._focusableElements();
    if (focusables.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (this._document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  protected trapBackward(event: Event): void {
    const focusables = this._focusableElements();
    if (focusables.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (this._document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }
  }

  private _focusableElements(): HTMLElement[] {
    const panel = this._panel()?.nativeElement;
    if (!panel) return [];
    return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  }
}
