import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type Severity = 'primary' | 'secondary' | 'danger';
type Size = 'default' | 'large';
type Variant = 'solid' | 'outlined' | 'text';

@Component({
  selector: 'app-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.inline-flex]': '!block()',
    '[class.block]': 'block()',
  },
  template: `
    <button
      [attr.type]="type()"
      [attr.aria-label]="ariaLabel() || null"
      [disabled]="disabled()"
      [class]="classes()"
    >
      <ng-content />
    </button>
  `,
  styles: `
    :host button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-weight: 500;
      white-space: nowrap;
      transition:
        background-color 0.2s,
        border-color 0.2s,
        color 0.2s,
        transform 0.1s;
      cursor: pointer;
    }
    :host button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    :host button:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }
    :host button:not(:disabled):active {
      transform: translateY(1px);
    }
  `,
})
export class Button {
  readonly severity = input<Severity>('primary');
  readonly size = input<Size>('default');
  readonly variant = input<Variant>('solid');
  readonly rounded = input<boolean>(false);
  readonly block = input<boolean>(false);
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly disabled = input<boolean>(false);
  readonly type = input<'button' | 'submit'>('button');

  protected readonly classes = computed(() => {
    // min-h-11 garantit 44x44 px (WCAG 2.5.5 Target Size).
    const sizeClass =
      this.size() === 'large'
        ? 'text-base md:text-lg px-6 py-3 min-h-11'
        : 'text-sm px-5 py-2.5 min-h-11';
    const radiusClass = this.rounded() ? 'rounded-full' : 'rounded-lg';
    const widthClass = this.block() ? 'w-full' : '';
    return [sizeClass, radiusClass, widthClass, this.variantClass()].filter(Boolean).join(' ');
  });

  private variantClass(): string {
    const sev = this.severity();
    const variant = this.variant();

    if (variant === 'text') {
      if (sev === 'danger') {
        return 'bg-transparent text-status-error hover:bg-status-error/10';
      }
      return sev === 'primary'
        ? 'bg-transparent text-primary hover:bg-primary/10'
        : 'bg-transparent text-muted hover:bg-foreground/5 hover:text-foreground';
    }

    if (variant === 'outlined') {
      if (sev === 'danger') {
        return 'bg-transparent border border-status-error/40 text-status-error hover:bg-status-error/10 hover:border-status-error/60';
      }
      return sev === 'primary'
        ? 'bg-transparent border border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/60'
        : 'bg-transparent border border-muted/30 text-foreground hover:bg-surface-elevated hover:border-foreground/30';
    }

    // solid
    if (sev === 'danger') {
      return 'bg-status-error text-white border border-status-error shadow-sm hover:bg-status-error/90';
    }
    return sev === 'primary'
      ? 'bg-primary-bg text-white border border-primary-bg shadow-sm hover:opacity-90'
      : 'bg-foreground/10 text-foreground border border-foreground/15 hover:bg-foreground/15';
  }
}
