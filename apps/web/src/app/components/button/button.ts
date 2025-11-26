import { ChangeDetectionStrategy, Component, input, computed, output } from '@angular/core';

type ButtonVariant = 'primary' | 'accent' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary/90 focus:bg-primary/80 active:bg-primary/95',
  accent:
    'bg-gradient-to-br from-primary/20 to-accent/20 text-foreground hover:bg-accent/20 focus:bg-accent/15 active:bg-accent/25',
  ghost: 'text-muted hover:text-primary hover:bg-white/5 focus:bg-white/10 active:bg-white/15',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

@Component({
  selector: 'app-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type()"
      [class]="buttonClasses()"
      [disabled]="disabled() || isLoading()"
      (click)="buttonClick.emit($event)"
    >
      @if (isLoading()) {
        <svg class="w-5 h-5 animate-spin" viewBox="0 0 24 24">
          <use href="/icons/sprite.svg#spinners"></use>
        </svg>
      }
      <ng-content />
    </button>
  `,
})
export class Button {
  // Inputs
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly href = input<string>();
  readonly target = input<'_self' | '_blank'>('_self');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input<boolean>(false);
  readonly fullWidth = input<boolean>(false);
  readonly customClass = input<string>('');
  readonly isLoading = input<boolean>(false);
  readonly buttonClick = output<MouseEvent>();

  // Classes calculées
  protected readonly buttonClasses = computed(() => {
    const baseClasses =
      'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50';

    const variantClasses = VARIANT_CLASSES[this.variant()];
    const sizeClasses = SIZE_CLASSES[this.size()];
    const widthClass = this.fullWidth() ? 'w-full' : '';
    const disabledClasses = this.disabled()
      ? 'opacity-50 cursor-not-allowed hover:scale-100 active:scale-100'
      : '';
    const custom = this.customClass();

    return `${baseClasses} ${variantClasses} ${sizeClasses} ${widthClass} ${disabledClasses} ${custom}`.trim();
  });
}
