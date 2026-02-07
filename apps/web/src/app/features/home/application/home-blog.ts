import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { ButtonComponent } from '../../../layout/components/button/button';
import { BLOG_GATEWAY } from '../../blog/domain/gateways';

@Component({
  selector: 'app-home-blog',
  imports: [RouterLink, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <section id="blog" class="py-20 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="mb-12">
          <h2 class="text-3xl md:text-4xl font-bold mb-4">Derniers articles</h2>
          <p class="text-muted max-w-2xl">
            Réflexions et retours d'expérience sur le développement web, Angular et les bonnes
            pratiques.
          </p>
        </div>

        @if (latestArticles().length > 0) {
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Featured article (first) -->
            @if (latestArticles()[0]; as featured) {
              <a
                [routerLink]="['/blog', featured.id]"
                class="group lg:row-span-2 bg-background border border-foreground/10 rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 shadow-lg flex flex-col"
              >
                @if (featured.image) {
                  <div class="aspect-video w-full overflow-hidden">
                    <img
                      [src]="featured.image"
                      [alt]="featured.title"
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                }
                <div class="p-6 flex flex-col flex-1">
                  <div class="flex items-center gap-2 text-xs text-muted mb-3">
                    <time [attr.datetime]="featured.date">{{ featured.date }}</time>
                    <span>&middot;</span>
                    <span>{{ featured.author }}</span>
                  </div>
                  <h3
                    class="text-xl lg:text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors"
                  >
                    {{ featured.title }}
                  </h3>
                  <p class="text-muted text-sm leading-relaxed mb-4 flex-1">
                    {{ featured.excerpt }}
                  </p>
                  <div class="flex flex-wrap gap-2">
                    @for (tag of featured.tags; track tag) {
                      <span
                        class="px-2.5 py-1 text-xs rounded-lg bg-primary/10 text-foreground border border-primary/20"
                      >
                        {{ tag }}
                      </span>
                    }
                  </div>
                </div>
              </a>
            }

            <!-- Secondary articles (compact horizontal) -->
            @for (article of latestArticles().slice(1); track article.id) {
              <a
                [routerLink]="['/blog', article.id]"
                class="group bg-background border border-foreground/10 rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 shadow-lg flex flex-col sm:flex-row"
              >
                @if (article.image) {
                  <div class="aspect-video sm:aspect-auto sm:w-1/3 flex-shrink-0 overflow-hidden">
                    <img
                      [src]="article.image"
                      [alt]="article.title"
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                }
                <div class="p-5 flex flex-col justify-center flex-1">
                  <div class="flex items-center gap-2 text-xs text-muted mb-2">
                    <time [attr.datetime]="article.date">{{ article.date }}</time>
                    <span>&middot;</span>
                    <span>{{ article.author }}</span>
                  </div>
                  <h3
                    class="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors"
                  >
                    {{ article.title }}
                  </h3>
                  <p class="text-muted text-sm leading-relaxed mb-3 line-clamp-2">
                    {{ article.excerpt }}
                  </p>
                  <div class="flex flex-wrap gap-1.5">
                    @for (tag of article.tags; track tag) {
                      <span
                        class="px-2 py-0.5 text-xs rounded-md bg-primary/10 text-foreground border border-primary/20"
                      >
                        {{ tag }}
                      </span>
                    }
                  </div>
                </div>
              </a>
            }
          </div>
        } @else {
          <p class="text-center text-muted py-12">Aucun article pour le moment.</p>
        }

        <div class="mt-8 text-center">
          <app-button variant="primary" size="md" radius="md" (clicked)="goToBlog()">
            Voir tous les articles
            <svg class="w-5 h-5">
              <use href="/icons/sprite.svg#lucide-notebook-pen"></use>
            </svg>
          </app-button>
        </div>
      </div>
    </section>
  `,
})
export class HomeBlog {
  private readonly router = inject(Router);
  private readonly blogGateway = inject(BLOG_GATEWAY);

  protected readonly latestArticles = toSignal(
    this.blogGateway.getAllArticles().pipe(map((articles) => articles.slice(0, 3))),
    { initialValue: [] },
  );

  goToBlog(): void {
    this.router.navigate(['/blog']);
  }
}
