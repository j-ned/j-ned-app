import { Component, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { BLOG_GATEWAY } from '../domain/gateways';

@Component({
  selector: 'app-blog-detail',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <a
        routerLink="/blog"
        class="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-8"
      >
        <svg class="w-4 h-4" aria-hidden="true">
          <use href="/icons/sprite.svg#lucide-arrow-left"></use>
        </svg>
        Retour au blog
      </a>

      @if (article(); as article) {
        <article>
          @if (article.image) {
            <div class="aspect-video w-full overflow-hidden rounded-2xl mb-8">
              <img [src]="article.image" [alt]="article.title" class="w-full h-full object-cover" />
            </div>
          }

          <div class="flex items-center gap-2 text-sm text-muted mb-4">
            <time [attr.datetime]="article.date">{{ article.date }}</time>
            <span>&middot;</span>
            <span>{{ article.author }}</span>
          </div>

          <h1 class="text-3xl sm:text-4xl font-bold text-foreground mb-4">{{ article.title }}</h1>

          <div class="flex flex-wrap gap-2 mb-8">
            @for (tag of article.tags; track tag) {
              <span
                class="px-2.5 py-1 text-xs rounded-lg bg-primary/10 text-foreground border border-primary/20"
              >
                {{ tag }}
              </span>
            }
          </div>

          <div class="prose prose-invert max-w-none text-muted leading-relaxed whitespace-pre-line">
            {{ article.content }}
          </div>
        </article>

        <!-- Comments -->
        <div class="mt-12 pt-8 border-t border-foreground/10">
          <h2 class="text-xl font-bold text-foreground mb-6">Commentaires</h2>

          @for (comment of comments(); track comment.id) {
            <div class="mb-6 p-4 rounded-lg bg-primary-bg border border-foreground/10">
              <div class="flex items-center gap-2 text-sm text-muted mb-2">
                <span class="font-medium text-foreground">{{ comment.author }}</span>
                <span>&middot;</span>
                <time [attr.datetime]="comment.date">{{ comment.date }}</time>
              </div>
              <p class="text-muted text-sm">{{ comment.content }}</p>
            </div>
          } @empty {
            <p class="text-muted text-sm">Aucun commentaire pour le moment.</p>
          }
        </div>
      } @else {
        <div class="text-center py-12">
          <p class="text-muted">Chargement de l'article...</p>
        </div>
      }
    </section>
  `,
})
export class BlogDetail {
  private readonly blogGateway = inject(BLOG_GATEWAY);

  readonly id = input.required<string>();

  readonly article = toSignal(
    toObservable(this.id).pipe(switchMap((id) => this.blogGateway.getArticleById(Number(id)))),
  );

  readonly comments = toSignal(
    toObservable(this.id).pipe(
      switchMap((id) => this.blogGateway.getCommentsByArticle(Number(id))),
    ),
    { initialValue: [] },
  );
}
