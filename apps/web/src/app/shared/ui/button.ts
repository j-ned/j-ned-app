import { Directive, computed, input } from '@angular/core';

export type ButtonVariant =
  | 'primary'
  | 'outlined'
  | 'danger'
  | 'outlined-danger'
  | 'text'
  | 'text-muted'
  | 'text-danger'
  | 'ghost-icon';
type ButtonSize = 'default' | 'icon';

const BASE_CLASSES =
  'inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50';

const GHOST_ICON_CLASSES =
  'inline-flex size-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-surface-elevated';

const SIZE_CLASSES: Record<ButtonSize, string> = {
  default: 'px-5',
  icon: 'min-w-11 justify-center',
};

const VARIANT_CLASSES: Record<Exclude<ButtonVariant, 'ghost-icon'>, string> = {
  primary: 'bg-primary-bg text-white hover:bg-primary-bg/90',
  outlined:
    'border border-foreground/15 text-foreground hover:border-primary/40 hover:text-primary',
  danger: 'bg-status-error text-on-status-error hover:bg-status-error/90',
  'outlined-danger':
    'border border-status-error/40 text-status-error hover:border-status-error/60 hover:bg-status-error/10',
  text: 'text-primary hover:bg-primary/10',
  'text-muted': 'text-muted hover:bg-foreground/5 hover:text-foreground',
  'text-danger': 'text-status-error hover:bg-status-error/10',
};

@Directive({
  selector: 'button[appButton], a[appButton]',
  host: { '[class]': 'classes()' },
})
export class Button {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('default');
  readonly rounded = input<boolean>(false);
  readonly block = input<boolean>(false);

  protected readonly classes = computed(() => {
    const variant = this.variant();
    if (variant === 'ghost-icon') return GHOST_ICON_CLASSES;
    return [
      BASE_CLASSES,
      this.rounded() ? 'rounded-full' : 'rounded-md',
      SIZE_CLASSES[this.size()],
      this.block() ? 'w-full justify-center' : '',
      VARIANT_CLASSES[variant],
    ]
      .filter(Boolean)
      .join(' ');
  });
}
