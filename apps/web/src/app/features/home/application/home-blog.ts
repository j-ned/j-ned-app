import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { ButtonComponent } from '@layout';
import { BLOG_GATEWAY } from '@features/blog/application';

@Component({
  selector: 'app-home-blog',
  imports: [RouterLink, ButtonComponent, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <section id="blog">
      <div>
        <header class="text-center mb-14">
          <span class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest mb-5">
            <svg aria-hidden="true" class="w-4 h-4">
              <use href="/icons/sprite.svg#lucide-notebook-pen"></use>
            </svg>
            Blog
          </span>
          <h2
            class="text-3xl md:text-5xl font-extrabold tracking-tight mb-5"
            style="background: linear-gradient(135deg, var(--color-foreground) 40%, var(--color-primary) 100%); background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent;"
          >
            Derniers articles
          </h2>
          <p class="text-muted max-w-xl mx-auto text-base md:text-lg leading-relaxed">
            Réflexions et retours d'expérience sur le développement web, Angular et les bonnes
            pratiques.
          </p>
        </header>

        @if (latestArticles().length > 0) {
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            @if (latestArticles()[0]; as featured) {
              <a
                [routerLink]="['/blog', featured.id]"
                class="group lg:row-span-2 bg-background border border-foreground/10 rounded-xl overflow-hidden hover:border-foreground/20 transition duration-300 shadow-sm flex flex-col"
              >
                <article>
                  @if (featured.image) {
                    <div class="relative aspect-video w-full overflow-hidden">
                      <img
                        [ngSrc]="featured.image"
                        [alt]="featured.title"
                        fill
                        priority
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        class="object-cover group-hover:scale-[1.02] transition-transform duration-500"
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
                    <ul class="flex flex-wrap gap-2" role="list">
                      @for (tag of featured.tags; track tag) {
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
                </article>
              </a>
            }

            @for (article of latestArticles().slice(1); track article.id) {
              <a
                [routerLink]="['/blog', article.id]"
                class="group bg-background border border-foreground/10 rounded-xl overflow-hidden hover:border-foreground/20 transition duration-300 shadow-sm flex flex-col sm:flex-row"
              >
                <article>
                  @if (article.image) {
                    <div
                      class="relative aspect-video sm:aspect-video sm:w-1/3 flex-shrink-0 overflow-hidden"
                    >
                      <img
                        [ngSrc]="article.image"
                        [alt]="article.title"
                        fill
                        sizes="(max-width: 1024px) 100vw, 33vw"
                        class="object-cover group-hover:scale-[1.02] transition-transform duration-500"
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
                    <ul class="flex flex-wrap gap-1.5" role="list">
                      @for (tag of article.tags; track tag) {
                        <li>
                          <span
                            class="px-2 py-0.5 text-xs rounded-md bg-primary/10 text-foreground border border-primary/20"
                          >
                            {{ tag }}
                          </span>
                        </li>
                      }
                    </ul>
                  </div>
                </article>
              </a>
            }
          </div>
        } @else {
          <p class="text-center text-muted py-12">Aucun article pour le moment.</p>
        }

        <nav class="mt-8 text-center" aria-label="Voir tous les articles">
          <app-button variant="primary" size="md" radius="md" (clicked)="goToBlog()">
            Voir tous les articles
            <svg aria-hidden="true" class="w-5 h-5">
              <use href="/icons/sprite.svg#lucide-notebook-pen"></use>
            </svg>
          </app-button>
        </nav>
      </div>
    </section>
  `,
})
export class HomeBlog {
  private readonly router = inject(Router);
  private readonly blogGateway = inject(BLOG_GATEWAY);

  protected readonly latestArticles = toSignal(
    this.blogGateway
      .getFeaturedArticles()
      .pipe(
        switchMap((featured) =>
          featured.length > 0
            ? [featured.slice(0, 3)]
            : this.blogGateway.getAllArticles().pipe(map((all) => all.slice(0, 3))),
        ),
      ),
    { initialValue: [] },
  );

  goToBlog(): void {
    this.router.navigate(['/blog']);
  }
}
