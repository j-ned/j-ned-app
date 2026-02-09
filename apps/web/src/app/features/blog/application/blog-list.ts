import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { BLOG_GATEWAY } from '../domain';

@Component({
  selector: 'app-blog-list',
  imports: [RouterLink, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <main
      class="min-h-screen pt-20 pb-16 bg-linear-to-br from-background to-background/50 border border-foreground/10 rounded-2xl p-6 shadow-lg"
    >
      <section class="container mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div class="mb-12">
          <h1 class="text-4xl md:text-6xl font-bold mb-6 text-foreground">Blog</h1>
          <p class="text-xl text-muted max-w-2xl leading-relaxed">
            Articles sur le développement web, Angular, et les bonnes pratiques.
          </p>
        </div>

        @defer (on viewport) {
          <ul class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" role="list">
            @for (article of articles(); track article.id) {
              <li>
                <a
                  [routerLink]="['/blog', article.id]"
                  class="group block bg-background border border-foreground/10 rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 shadow-lg"
                >
                  @if (article.image) {
                    <div class="relative aspect-video w-full overflow-hidden">
                      <img
                        [ngSrc]="article.image"
                        [alt]="article.title"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        class="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  }

                  <div class="p-6">
                    <p class="flex items-center gap-2 text-xs text-muted mb-3">
                      <time [attr.datetime]="article.date">{{ article.date }}</time>
                      <span>&middot;</span>
                      <span>{{ article.author }}</span>
                    </p>

                    <h2
                      class="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors"
                    >
                      {{ article.title }}
                    </h2>

                    <p class="text-muted text-sm leading-relaxed mb-4">
                      {{ article.excerpt }}
                    </p>

                    <ul class="flex flex-wrap gap-2" role="list">
                      @for (tag of article.tags; track tag) {
                        <li>
                          <span
                            class="px-2.5 py-1 text-xs rounded-lg bg-primary/10 text-foreground border border-primary/20"
                          >
                            {{ tag }}
                          </span>
                        </li>
                      }
                    </ul>
                  </div>
                </a>
              </li>
            } @empty {
              <p class="col-span-full text-center text-muted py-12">
                Aucun article pour le moment.
              </p>
            }
          </ul>
        } @placeholder {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            @for (i of [1, 2, 3]; track i) {
              <div
                class="h-80 bg-background/50 border border-foreground/10 rounded-2xl animate-pulse"
              ></div>
            }
          </div>
        }
      </section>
    </main>
  `,
})
export class BlogList {
  private readonly blogGateway = inject(BLOG_GATEWAY);

  readonly articles = toSignal(this.blogGateway.getAllArticles(), { initialValue: [] });
}
