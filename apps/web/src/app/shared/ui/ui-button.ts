import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type Severity = 'primary' | 'secondary';
type Size = 'default' | 'large';
type Variant = 'solid' | 'outlined' | 'text';

@Component({
  selector: 'app-ui-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
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
export class UiButton {
  readonly severity = input<Severity>('primary');
  readonly size = input<Size>('default');
  readonly variant = input<Variant>('solid');
  readonly rounded = input<boolean>(false);
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly disabled = input<boolean>(false);
  readonly type = input<'button' | 'submit'>('button');

  protected readonly classes = computed(() => {
    const sizeClass =
      this.size() === 'large' ? 'text-base md:text-lg px-6 py-3' : 'text-sm px-4 py-2';
    const radiusClass = this.rounded() ? 'rounded-full' : 'rounded-lg';
    return [sizeClass, radiusClass, this.variantClass()].join(' ');
  });

  private variantClass(): string {
    const sev = this.severity();
    const variant = this.variant();

    if (variant === 'text') {
      return sev === 'primary'
        ? 'bg-transparent text-primary hover:bg-primary/10'
        : 'bg-transparent text-muted hover:bg-foreground/5 hover:text-foreground';
    }

    if (variant === 'outlined') {
      return sev === 'primary'
        ? 'bg-transparent border border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/60'
        : 'bg-transparent border border-foreground/15 text-foreground hover:bg-foreground/5 hover:border-foreground/30';
    }

    // solid
    return sev === 'primary'
      ? 'bg-primary-bg text-white border border-primary-bg hover:bg-primary-bg/90 hover:border-primary-bg/90'
      : 'bg-foreground/10 text-foreground border border-foreground/15 hover:bg-foreground/15';
  }
}
