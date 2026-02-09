import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BLOG_GATEWAY } from '../../blog/domain';
import type { Article } from '../../blog/domain';

@Component({
  selector: 'app-admin-articles',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-2xl font-bold text-foreground">Articles</h1>
      <a
        routerLink="/admin/blog/articles/new"
        class="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Nouvel article
      </a>
    </div>

    <div class="bg-background border border-foreground/10 rounded-2xl overflow-hidden shadow-lg">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-foreground/10">
              <th class="text-left px-6 py-4 text-sm font-medium text-muted">Titre</th>
              <th class="text-left px-6 py-4 text-sm font-medium text-muted">Date</th>
              <th class="text-left px-6 py-4 text-sm font-medium text-muted">Tags</th>
              <th class="text-right px-6 py-4 text-sm font-medium text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (article of articles(); track article.id) {
              <tr class="border-b border-foreground/5 hover:bg-foreground/5 transition-colors">
                <td class="px-6 py-4 text-sm text-foreground font-medium">{{ article.title }}</td>
                <td class="px-6 py-4 text-sm text-muted">{{ article.date }}</td>
                <td class="px-6 py-4">
                  <div class="flex flex-wrap gap-1">
                    @for (tag of article.tags; track tag) {
                      <span class="px-2 py-0.5 text-xs rounded bg-primary/10 text-foreground">{{
                        tag
                      }}</span>
                    }
                  </div>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <a
                      [routerLink]="['/admin/blog/articles', article.id, 'edit']"
                      class="px-3 py-1.5 text-xs rounded-lg bg-foreground/5 text-foreground hover:bg-foreground/10 transition-colors"
                    >
                      Modifier
                    </a>
                    <button
                      (click)="deleteArticle(article)"
                      class="px-3 py-1.5 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="px-6 py-8 text-center text-muted text-sm">Aucun article</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AdminArticles {
  private readonly blogGateway = inject(BLOG_GATEWAY);

  readonly articles = signal<readonly Article[]>([]);

  constructor() {
    this.loadArticles();
  }

  deleteArticle(article: Article): void {
    this.blogGateway.deleteArticle(article.id).subscribe(() => this.loadArticles());
  }

  private loadArticles(): void {
    this.blogGateway.getAllArticles().subscribe((articles) => this.articles.set(articles));
  }
}
