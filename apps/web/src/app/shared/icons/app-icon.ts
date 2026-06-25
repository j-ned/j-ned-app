import { Component, ChangeDetectionStrategy, computed, input } from '@angular/core';
import { toFontAwesome } from './icon-map';

// Couleur héritée via `currentColor` (compatible Tailwind text-*). `aria-hidden`
// par défaut ; passer `label` pour l'exposer aux lecteurs d'écran (`role="img"`).
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
