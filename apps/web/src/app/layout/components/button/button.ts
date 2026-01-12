import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'link' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonRadius = 'none' | 'sm' | 'md' | 'lg' | 'full';

@Component({
  selector: 'app-button',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (href() || routerLink()) {
      <a
        [routerLink]="routerLink() || null"
        [attr.href]="routerLink() ? null : href()"
        [attr.target]="target()"
        [attr.rel]="rel()"
        [attr.aria-label]="ariaLabel()"
        [attr.aria-disabled]="disabled() || loading() ? 'true' : null"
        [class]="classes()"
        (click)="onClick($event)"
      >
        <ng-content />
      </a>
    } @else {
      <button
        [attr.type]="type()"
        [disabled]="disabled() || loading()"
        [attr.aria-label]="ariaLabel()"
        [attr.aria-disabled]="disabled() || loading() ? 'true' : null"
        [class]="classes()"
        (click)="onClick($event)"
      >
        <ng-content />
      </button>
    }
  `,
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly radius = input<ButtonRadius>('md');
  readonly fullWidth = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly elevation = input<0 | 1 | 2 | 3 | 4>(0);
  readonly ariaLabel = input<string | null>(null);
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly href = input<string | null>(null);
  readonly routerLink = input<string | (string | number)[] | null>(null);
  readonly target = input<string | null>(null);
  readonly rel = input<string | null>(null);

  readonly clicked = output<MouseEvent>();

  readonly classes = computed(() => {
    const baseClasses =
      'inline-flex items-center justify-center gap-2 font-semibold text-center whitespace-nowrap transition-all duration-200 cursor-pointer border-0 outline-none no-underline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2';

    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-0.5',
      secondary:
        'bg-transparent text-foreground border border-white/20 hover:bg-white/5 hover:border-primary',
      accent:
        'bg-gradient-to-br from-blue-600 to-violet-600 text-white hover:from-blue-700 hover:to-violet-700 hover:-translate-y-0.5 shadow-lg shadow-violet-500/25',
      ghost: 'bg-transparent text-foreground hover:bg-white/5',
      link: 'bg-transparent text-primary p-0 hover:underline dark:text-blue-400 dark:opacity-90',
      danger: 'bg-red-500 text-white hover:bg-red-600 hover:-translate-y-0.5',
    }[this.variant()];

    const sizeClasses = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    }[this.size()];

    const radiusClasses = {
      none: 'rounded-none',
      sm: 'rounded',
      md: 'rounded-lg',
      lg: 'rounded-xl',
      full: 'rounded-full',
    }[this.radius()];

    const elevationClasses = {
      0: '',
      1: 'shadow-sm',
      2: 'shadow',
      3: 'shadow-md',
      4: 'shadow-lg',
    }[this.elevation()];

    const stateClasses = [
      this.fullWidth() ? 'w-full' : '',
      this.disabled() ? 'opacity-50 cursor-not-allowed' : '',
      this.loading() ? 'opacity-70 cursor-wait' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return [baseClasses, variantClasses, sizeClasses, radiusClasses, elevationClasses, stateClasses]
      .filter(Boolean)
      .join(' ');
  });

  onClick(e: MouseEvent): void {
    if (this.disabled() || this.loading()) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    this.clicked.emit(e);
  }
}
