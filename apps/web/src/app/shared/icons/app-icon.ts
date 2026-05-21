import { Component, ChangeDetectionStrategy, computed, input } from '@angular/core';
import { toFontAwesome } from './icon-map';

/**
 * Renders a Font Awesome icon from the local SVG sprite.
 *
 * Usage:
 *   <app-icon name="envelope" />                       // 20px, decorative
 *   <app-icon name="lucide-github" [size]="24" />      // accepts Lucide tokens
 *   <app-icon name="lock" label="Verrouillé" />        // accessible
 *
 * The color is inherited from the parent via `currentColor` (compatible with
 * Tailwind text-* classes). The icon is `aria-hidden="true"` by default; pass
 * `label` to expose it to screen readers as `role="img"`.
 */
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex items-center justify-center shrink-0' },
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      [attr.aria-hidden]="label() ? null : 'true'"
      [attr.aria-label]="label()"
      [attr.role]="label() ? 'img' : null"
      fill="currentColor"
      viewBox="0 0 512 512"
    >
      <use [attr.href]="href()" />
    </svg>
  `,
})
export class AppIcon {
  readonly name = input.required<string>();
  readonly size = input<number>(20);
  readonly label = input<string | null>(null);

  protected readonly href = computed(() => {
    const ref = toFontAwesome(this.name());
    return `/icons/sprite.svg#${ref.style}-${ref.id}`;
  });
}
