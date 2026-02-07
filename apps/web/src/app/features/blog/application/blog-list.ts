import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { BLOG_GATEWAY } from '../domain/gateways';

@Component({
  selector: 'app-blog-list',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-foreground mb-4">Blog</h1>
        <p class="text-muted text-lg max-w-2xl mx-auto">
          Articles sur le développement web, Angular, et les bonnes pratiques.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        @for (article of articles(); track article.id) {
          <a
            [routerLink]="['/blog', article.id]"
            class="group bg-background border border-foreground/10 rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 shadow-lg"
          >
            @if (article.image) {
              <div class="aspect-video w-full overflow-hidden">
                <img
                  [src]="article.image"
                  [alt]="article.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            }

            <div class="p-6">
              <div class="flex items-center gap-2 text-xs text-muted mb-3">
                <time [attr.datetime]="article.date">{{ article.date }}</time>
                <span>&middot;</span>
                <span>{{ article.author }}</span>
              </div>

              <h2
                class="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors"
              >
                {{ article.title }}
              </h2>

              <p class="text-muted text-sm leading-relaxed mb-4">
                {{ article.excerpt }}
              </p>

              <div class="flex flex-wrap gap-2">
                @for (tag of article.tags; track tag) {
                  <span
                    class="px-2.5 py-1 text-xs rounded-lg bg-primary/10 text-foreground border border-primary/20"
                  >
                    {{ tag }}
                  </span>
                }
              </div>
            </div>
          </a>
        } @empty {
          <p class="col-span-full text-center text-muted py-12">Aucun article pour le moment.</p>
        }
      </div>
    </section>
  `,
})
export class BlogList {
  private readonly blogGateway = inject(BLOG_GATEWAY);

  readonly articles = toSignal(this.blogGateway.getAllArticles(), { initialValue: [] });
}
