import {
  Component,
  inject,
  input,
  computed,
  linkedSignal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { BlogGateway } from '../domain/gateways/blog.gateway';
import { BlogPostRow } from './components/blog-post-row';
import { AppIcon } from '@shared/icons/app-icon';
import { AppPaginator, type AppPaginatorEvent } from '@shared/ui/paginator';
import type { BlogPost } from '../domain/models/blog-post.model';

const PAGE_SIZE = 9;

@Component({
  selector: 'app-blog-list',
  imports: [BlogPostRow, AppPaginator, RouterLink, AppIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-h-svh pt-20 pb-24' },
  template: `
    <section class="page-container" aria-labelledby="blog-heading">
      <header class="pt-18 pb-12 md:pt-26 md:pb-16">
        <p class="animate-fade-up font-mono text-[0.8125rem] font-medium text-primary">
          {{ postCountLabel() }}
        </p>
        <h1
          id="blog-heading"
          data-testid="blog-title"
          class="mt-4.5 text-[clamp(2.75rem,6vw,5.25rem)] font-extrabold leading-none tracking-[-0.04em]"
        >
          Blog
        </h1>
        <p
          class="animate-fade-up [animation-delay:120ms] mt-5.5 max-w-[56ch] text-[clamp(1.0625rem,1.4vw,1.25rem)] text-muted"
        >
          Retours d'expérience concrets sur mes projets, mon parcours et la façon dont je les
          construis.
        </p>
        <a
          href="/rss.xml"
          class="mt-4.5 inline-flex min-h-11 items-center font-mono text-[0.8125rem] text-muted transition-colors hover:text-primary"
          data-testid="rss-link"
        >
          S'abonner au flux RSS
        </a>
        @if (tag(); as activeTag) {
          <p
            data-testid="tag-filter-banner"
            class="mt-5 flex flex-wrap items-center gap-2.5 text-sm text-muted"
          >
            Filtré par
            <a
              data-testid="tag-filter-clear"
              routerLink="/blog"
              class="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2.5 text-[0.8125rem] font-medium text-primary transition-colors hover:bg-primary/20"
              [attr.aria-label]="'Retirer le filtre ' + activeTag"
            >
              {{ activeTag }}
              <app-icon name="times" [size]="12" />
            </a>
          </p>
        }
      </header>

      <div class="border-t border-foreground/8">
        @for (post of pagedPosts(); track post.slug) {
          <app-blog-post-row [post]="post" [priority]="$first" />
        } @empty {
          <p class="py-12 text-muted">Aucun article pour le moment.</p>
        }
      </div>

      @if (filteredPosts().length > PAGE_SIZE) {
        <app-paginator
          class="mt-12 block"
          [rows]="PAGE_SIZE"
          [totalRecords]="filteredPosts().length"
          [first]="first()"
          (pageChange)="onPageChange($event)"
        />
      }
    </section>
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

  protected readonly postCountLabel = computed(() => {
    const count = this._posts().length;
    return `${count} article${count > 1 ? 's' : ''}`;
  });

  protected readonly pagedPosts = computed(() =>
    this.filteredPosts().slice(this.first(), this.first() + PAGE_SIZE),
  );

  onPageChange(event: AppPaginatorEvent): void {
    this.first.set(event.first);
  }
}
