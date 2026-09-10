import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { blogTagCategory, type BlogTagCategory } from '../../domain/models/blog-tag.model';

const CATEGORY_CLASSES: Record<BlogTagCategory, string> = {
  stack: 'bg-primary/10 text-primary hover:bg-primary/20',
  security: 'bg-rose-500/12 text-rose-700 hover:bg-rose-500/22 dark:text-rose-300',
  engineering: 'bg-emerald-500/12 text-emerald-700 hover:bg-emerald-500/22 dark:text-emerald-300',
  journey: 'bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:text-amber-300',
  projects: 'bg-sky-500/12 text-sky-700 hover:bg-sky-500/22 dark:text-sky-300',
};

const FREE_TAG_CLASSES = 'bg-foreground/8 text-muted hover:bg-foreground/15';

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

  protected readonly classes = computed(() => {
    const category = blogTagCategory(this.tag());
    return category ? CATEGORY_CLASSES[category] : FREE_TAG_CLASSES;
  });
}
