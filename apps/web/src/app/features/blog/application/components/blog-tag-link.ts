import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { blogTagPalette } from '../blog-tag-palette';

/** Pastille de tag colorée par catégorie, lien vers la liste filtrée `/blog?tag=`. */
@Component({
  selector: 'app-blog-tag-link',
  imports: [RouterLink],
  host: { class: 'inline-flex' },
  template: `
    <a
      data-testid="tag-link"
      routerLink="/blog"
      [queryParams]="{ tag: tag() }"
      class="inline-flex min-h-6 items-center rounded-md px-2 py-1 text-xs font-medium leading-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      [class]="classes()"
    >
      {{ tag() }}
    </a>
  `,
})
export class BlogTagLink {
  readonly tag = input.required<string>();

  protected readonly classes = computed(() => blogTagPalette(this.tag()).tint);
}
