import { Component, inject, input, computed, linkedSignal, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { BlogGateway } from '../domain/gateways/blog.gateway';
import { BlogPostCard } from './components/blog-post-card';
import { AppPaginator, type AppPaginatorEvent } from '@shared/ui/paginator';
import type { BlogPost } from '../domain/models/blog-post.model';

const PAGE_SIZE = 9;

@Component({
  selector: 'app-blog-list',
  imports: [BlogPostCard, AppPaginator, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <main class="page-container min-h-svh pt-20 pb-20">
      <h1 class="text-3xl md:text-4xl font-bold mb-8">Blog</h1>

      @if (tag()) {
        <p data-testid="tag-filter-banner" class="text-muted text-sm mb-6">
          Filtré par : <strong class="text-foreground">{{ tag() }}</strong>
          — <a data-testid="tag-filter-clear" routerLink="/blog" class="text-primary hover:underline">Effacer</a>
        </p>
      }

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        @for (post of pagedPosts(); track post.slug) {
          <app-blog-post-card [post]="post" />
        } @empty {
          <p class="text-muted col-span-full">Aucun article pour le moment.</p>
        }
      </div>

      @if (filteredPosts().length > PAGE_SIZE) {
        <app-paginator
          [rows]="PAGE_SIZE"
          [totalRecords]="filteredPosts().length"
          [first]="first()"
          (pageChange)="onPageChange($event)"
        />
      }
    </main>
  `,
})
export class BlogList {
  private readonly gateway = inject(BlogGateway);
  protected readonly PAGE_SIZE = PAGE_SIZE;

  // Bound via withComponentInputBinding() to the ?tag= query param — /blog?tag=Angular.
  readonly tag = input<string | null>(null);

  private readonly _posts = toSignal(this.gateway.getPublishedPosts(), {
    initialValue: [] as readonly BlogPost[],
  });

  // Reset to page 1 whenever the tag filter changes, but stays independently
  // settable by the paginator while the filter is unchanged.
  protected readonly first = linkedSignal({
    source: this.tag,
    computation: () => 0,
  });

  protected readonly filteredPosts = computed(() => {
    const tag = this.tag();
    const posts = this._posts();
    return tag ? posts.filter((p) => p.tags.includes(tag)) : posts;
  });

  protected readonly pagedPosts = computed(() =>
    this.filteredPosts().slice(this.first(), this.first() + PAGE_SIZE),
  );

  onPageChange(event: AppPaginatorEvent): void {
    this.first.set(event.first);
  }
}
