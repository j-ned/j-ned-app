import { Component, inject, input, effect, ChangeDetectionStrategy } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BLOG_GATEWAY } from './tokens';
import { CommentForm } from './comment-form';
import { AnalyticsService } from '@shared/analytics';

@Component({
  selector: 'app-blog-detail',
  imports: [RouterLink, CommentForm, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <main
      class="min-h-screen pt-20 pb-16 bg-linear-to-br from-background to-background/50 border border-foreground/10 rounded-2xl p-6 shadow-lg"
    >
      <section class="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 max-w-4xl">
        <a
          routerLink="/blog"
          class="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-8"
        >
          <svg class="w-4 h-4" aria-hidden="true">
            <use href="/icons/sprite.svg#lucide-arrow-left"></use>
          </svg>
          Retour au blog
        </a>

        @if (articleRes.value(); as article) {
          <article>
            @if (article.image) {
              <figure class="relative aspect-video w-full overflow-hidden rounded-2xl mb-8">
                <img
                  [ngSrc]="article.image"
                  [alt]="article.title"
                  fill
                  sizes="(max-width: 768px) 100vw, 80vw"
                  priority
                  class="object-cover"
                />
              </figure>
            }

            <p class="flex items-center gap-2 text-sm text-muted mb-4">
              <time [attr.datetime]="article.date">{{ article.date }}</time>
              <span>&middot;</span>
              <span>{{ article.author }}</span>
            </p>

            <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
              {{ article.title }}
            </h1>

            <ul class="flex flex-wrap gap-2 mb-8" role="list">
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

            <div
              class="prose prose-invert max-w-none text-muted leading-relaxed whitespace-pre-line"
            >
              {{ article.content }}
            </div>
          </article>

          <!-- Comments -->
          <section class="mt-12 pt-8 border-t border-foreground/10" aria-label="Commentaires">
            <h2 class="text-2xl font-bold text-foreground mb-6">Commentaires</h2>

            @for (comment of commentsRes.value() ?? []; track comment.id) {
              <article
                class="mb-6 p-6 rounded-2xl bg-background border border-foreground/10 shadow-lg"
              >
                <header class="flex items-center gap-2 text-sm text-muted mb-2">
                  <span class="font-medium text-foreground">{{ comment.author }}</span>
                  @if (comment.rating > 0) {
                    <span>&middot;</span>
                    <span class="flex gap-0.5">
                      @for (star of [1, 2, 3, 4, 5]; track star) {
                        <svg class="w-4 h-4" aria-hidden="true">
                          <use
                            href="/icons/sprite.svg#lucide-star"
                            [class]="star <= comment.rating ? 'text-yellow-400' : 'text-muted'"
                          />
                        </svg>
                      }
                    </span>
                  }
                  <span>&middot;</span>
                  <time [attr.datetime]="comment.date">{{ comment.date }}</time>
                </header>
                <p class="text-muted text-sm leading-relaxed">{{ comment.content }}</p>
              </article>
            } @empty {
              <p class="text-muted text-sm">Aucun commentaire pour le moment.</p>
            }

            <!-- Comment form -->
            <div class="mt-8">
              <app-comment-form [articleId]="article.id" (commentAdded)="refreshComments()" />
            </div>
          </section>
        } @else {
          <div class="text-center py-12">
            <p class="text-muted">Chargement de l'article...</p>
          </div>
        }
      </section>
    </main>
  `,
})
export class BlogDetail {
  private readonly blogGateway = inject(BLOG_GATEWAY);
  private readonly analytics = inject(AnalyticsService);
  private tracked = false;

  readonly id = input.required<string>();

  readonly articleRes = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.blogGateway.getArticleById(params.id),
  });

  readonly commentsRes = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.blogGateway.getCommentsByArticle(params.id),
  });

  private readonly trackEffect = effect(() => {
    const article = this.articleRes.value();
    if (article && !this.tracked) {
      this.tracked = true;
      this.analytics.trackArticleView(article.id, article.title);
    }
  });

  refreshComments(): void {
    this.commentsRes.reload();
  }
}
