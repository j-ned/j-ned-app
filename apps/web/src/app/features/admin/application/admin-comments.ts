import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { BLOG_GATEWAY } from '../../blog/domain/gateways';
import type { Comment } from '../../blog/domain/models';

@Component({
  selector: 'app-admin-comments',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h1 class="text-2xl font-bold text-foreground mb-8">Commentaires</h1>

      <div class="space-y-4">
        @for (comment of comments(); track comment.id) {
          <div class="bg-background border border-foreground/10 rounded-2xl p-6 shadow-lg">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <div class="flex items-center gap-2 text-sm text-muted mb-2">
                  <span class="font-medium text-foreground">{{ comment.author }}</span>
                  <span>&middot;</span>
                  <time [attr.datetime]="comment.date">{{ comment.date }}</time>
                  <span>&middot;</span>
                  <span class="text-xs">Article #{{ comment.idArticle }}</span>
                </div>
                <p class="text-muted text-sm">{{ comment.content }}</p>
              </div>
              <button
                (click)="deleteComment(comment)"
                class="shrink-0 px-3 py-1.5 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        } @empty {
          <p class="text-center text-muted py-12">Aucun commentaire</p>
        }
      </div>
    </div>
  `,
})
export class AdminComments {
  private readonly blogGateway = inject(BLOG_GATEWAY);

  readonly comments = signal<readonly Comment[]>([]);

  constructor() {
    this.loadComments();
  }

  deleteComment(comment: Comment): void {
    this.blogGateway.deleteComment(comment.id).subscribe(() => this.loadComments());
  }

  private loadComments(): void {
    this.blogGateway.getAllComments().subscribe((comments) => this.comments.set(comments));
  }
}
