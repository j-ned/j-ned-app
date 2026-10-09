import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { BlogGateway } from '../domain/gateways/blog.gateway';
import { BlogPostRow } from './components/blog-post-row';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';
import { Cartouche } from '@shared/ui/cartouche';
import { FilterGroup } from '@shared/ui/filter-group';
import { filterPostsByCategory } from '../domain/filter-posts-by-category';
import type { BlogPost } from '../domain/models/blog-post.model';
import type { BlogCategoryFilter } from '../domain/models/blog-tag.model';
import { articleCountLabel, visibleArticleCountLabel } from './blog-list-copy';
import { toBlogListView, type BlogListFilter } from './blog-list-view';

@Component({
  selector: 'app-blog-list',
  imports: [BlogPostRow, RouterLink, AppIcon, Cartouche, FilterGroup, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-h-svh pt-20 pb-24' },
  template: `
    @let v = view();
    <section class="page-container" aria-labelledby="blog-heading">
      <header
        class="grid gap-10 pt-18 pb-14 md:pt-26 md:pb-18 lg:grid-cols-[minmax(0,1fr)_23.75rem] lg:items-end lg:gap-16"
      >
        <div>
          <p
            data-testid="blog-count"
            class="animate-fade-up font-mono text-[0.8125rem] font-medium text-primary"
          >
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
            data-testid="blog-intro"
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
        </div>
        <app-cartouche
          data-testid="blog-themes"
          class="animate-fade-up [animation-delay:200ms]"
          title="Thèmes"
          reference="Articles par thème"
          [rows]="v.themes"
        />
      </header>

      @if (failed()) {
        <div class="py-12 text-center" role="alert" data-testid="blog-error">
          <p class="mb-4 text-lg text-muted">
            Les articles n'ont pas pu être chargés. Vérifiez votre connexion, puis réessayez.
          </p>
          <button appButton type="button" variant="outlined" (click)="retry()">Réessayer</button>
        </div>
      } @else {
        @if (tag(); as activeTag) {
          <p
            data-testid="tag-filter-banner"
            class="flex min-h-11 flex-wrap items-center gap-2.5 text-sm text-muted"
          >
            Filtré par
            <a
              data-testid="tag-filter-clear"
              routerLink="/blog"
              class="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2.5 text-[0.8125rem] font-medium text-primary transition-colors hover:bg-primary/20"
              [attr.aria-label]="'Retirer le filtre ' + activeTag"
            >
              {{ activeTag }}
              <app-icon name="times" [size]="12" />
            </a>
          </p>
        } @else if (postsResource.hasValue() && v.total > 0) {
          <app-filter-group label="Filtrer par thème" [options]="v.filters" [(active)]="category" />
        }
        <p data-testid="blog-visible-count" role="status" class="sr-only">
          {{ visibleCountLabel() }}
        </p>

        <div class="mt-8 border-line" [class.border-t]="!!tag()">
          <ul role="list" data-testid="blog-posts">
            @for (row of v.rows; track row.slug) {
              <li><app-blog-post-row [post]="row" /></li>
            }
          </ul>
          @if (postsResource.hasValue()) {
            @if (v.total === 0) {
              <p data-testid="blog-empty" class="py-12 text-muted">Aucun article pour le moment.</p>
            } @else if (v.visibleCount === 0) {
              <p data-testid="blog-empty-tag" class="py-12 text-muted">
                Aucun article avec ce tag.
              </p>
            }
          }
        </div>
      }
    </section>
  `,
})
export class BlogList {
  private readonly gateway = inject(BlogGateway);

  // Bound via withComponentInputBinding() to the ?tag= query param — /blog?tag=Angular.
  readonly tag = input<string | null>(null);

  protected readonly postsResource = rxResource({
    stream: () => this.gateway.getPublishedPosts(),
  });
  private readonly _posts = computed(() =>
    this.postsResource.hasValue() ? this.postsResource.value() : [],
  );
  protected readonly failed = computed(() => this.postsResource.status() === 'error');

  protected readonly category = linkedSignal<readonly BlogPost[], BlogCategoryFilter>({
    source: this._posts,
    computation: (posts, previous) =>
      previous && filterPostsByCategory(posts, previous.value).length > 0 ? previous.value : 'all',
  });

  private readonly _listFilter = computed<BlogListFilter>(() => {
    const tag = this.tag();
    return tag ? { by: 'tag', tag } : { by: 'category', category: this.category() };
  });

  protected readonly view = computed(() => toBlogListView(this._posts(), this._listFilter()));

  protected readonly postCountLabel = computed(() => articleCountLabel(this.view().total));

  protected readonly visibleCountLabel = computed(() =>
    this.postsResource.hasValue() ? visibleArticleCountLabel(this.view().visibleCount) : '',
  );

  protected retry(): void {
    this.postsResource.reload();
  }
}
