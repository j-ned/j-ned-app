import { Component, inject, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BlogGateway } from '../domain/gateways/blog.gateway';
import { BlogPostCard } from './components/blog-post-card';
import { AppPaginator, type AppPaginatorEvent } from '@shared/ui/paginator';
import type { BlogPost } from '../domain/models/blog-post.model';

const PAGE_SIZE = 9;

@Component({
  selector: 'app-blog-list',
  imports: [BlogPostCard, AppPaginator],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <main class="page-container min-h-svh pt-20 pb-20">
      <h1 class="text-3xl md:text-4xl font-bold mb-8">Blog</h1>

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

  private readonly _posts = toSignal(this.gateway.getPublishedPosts(), {
    initialValue: [] as readonly BlogPost[],
  });

  private readonly _tagFilter = signal<string | null>(null);
  protected readonly first = signal(0);

  protected readonly filteredPosts = computed(() => {
    const tag = this._tagFilter();
    const posts = this._posts();
    return tag ? posts.filter((p) => p.tags.includes(tag)) : posts;
  });

  protected readonly pagedPosts = computed(() =>
    this.filteredPosts().slice(this.first(), this.first() + PAGE_SIZE),
  );

  setTagFilter(tag: string | null): void {
    this._tagFilter.set(tag);
    this.first.set(0);
  }

  onPageChange(event: AppPaginatorEvent): void {
    this.first.set(event.first);
  }
}
