import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { BLOG_GATEWAY } from '../../blog/domain';
import type { Comment, CommentStatus } from '../../blog/domain';

type FilterStatus = 'all' | CommentStatus;

@Component({
  selector: 'app-admin-comments',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h1 class="text-2xl font-bold text-foreground mb-8">Commentaires</h1>

    <div class="flex flex-wrap gap-2 mb-6">
      @for (filter of filters; track filter.value) {
        <button
          (click)="activeFilter.set(filter.value)"
          [class]="
            'px-4 py-2 rounded-lg text-sm font-medium border transition-colors ' +
            (activeFilter() === filter.value
              ? 'bg-primary text-white border-primary'
              : 'bg-foreground/5 text-foreground border-foreground/20 hover:border-primary/50')
          "
        >
          {{ filter.label }}
          <span
            [class]="
              'ml-1.5 px-1.5 py-0.5 rounded text-xs ' +
              (activeFilter() === filter.value ? 'bg-white/20' : 'bg-foreground/10')
            "
          >
            {{ countByStatus(filter.value) }}
          </span>
        </button>
      }
    </div>

    <div class="bg-background border border-foreground/10 rounded-2xl overflow-hidden shadow-lg">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-foreground/10">
              <th class="text-left px-6 py-4 text-sm font-medium text-muted">Auteur</th>
              <th class="text-left px-6 py-4 text-sm font-medium text-muted">Contenu</th>
              <th class="text-left px-6 py-4 text-sm font-medium text-muted">Note</th>
              <th class="text-left px-6 py-4 text-sm font-medium text-muted">Statut</th>
              <th class="text-left px-6 py-4 text-sm font-medium text-muted">Date</th>
              <th class="text-right px-6 py-4 text-sm font-medium text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (comment of filteredComments(); track comment.id) {
              <tr class="border-b border-foreground/5 hover:bg-foreground/5 transition-colors">
                <td class="px-6 py-4 text-sm text-foreground font-medium">
                  {{ comment.author }}
                </td>
                <td class="px-6 py-4 text-sm text-muted max-w-xs truncate">
                  {{ comment.content }}
                </td>
                <td class="px-6 py-4">
                  @if (comment.rating > 0) {
                    <div class="flex gap-0.5">
                      @for (star of [1, 2, 3, 4, 5]; track star) {
                        <svg class="w-4 h-4" aria-hidden="true">
                          <use
                            href="/icons/sprite.svg#lucide-star"
                            [class]="star <= comment.rating ? 'text-yellow-400' : 'text-muted'"
                          />
                        </svg>
                      }
                    </div>
                  } @else {
                    <span class="text-xs text-muted">&mdash;</span>
                  }
                </td>
                <td class="px-6 py-4">
                  <span
                    [class]="
                      'px-2.5 py-1 rounded-lg text-xs font-medium ' + statusClass(comment.status)
                    "
                  >
                    {{ statusLabel(comment.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-muted">{{ comment.date }}</td>
                <td class="px-6 py-4">
                  <div class="flex items-center justify-end gap-1">
                    @if (comment.status !== 'approved') {
                      <button
                        (click)="approve(comment)"
                        title="Approuver"
                        class="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10 transition-colors"
                      >
                        <svg class="w-4 h-4" aria-hidden="true">
                          <use href="/icons/sprite.svg#lucide-check" />
                        </svg>
                      </button>
                    }
                    @if (comment.status !== 'rejected') {
                      <button
                        (click)="reject(comment)"
                        title="Rejeter"
                        class="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <svg class="w-4 h-4" aria-hidden="true">
                          <use href="/icons/sprite.svg#lucide-x" />
                        </svg>
                      </button>
                    }
                    <button
                      (click)="toggleFeatured(comment)"
                      [title]="comment.featured ? 'Retirer de la une' : 'Mettre en avant'"
                      [class]="
                        'p-1.5 rounded-lg transition-colors ' +
                        (comment.featured
                          ? 'text-yellow-400 hover:bg-yellow-500/10'
                          : 'text-muted hover:bg-foreground/10')
                      "
                    >
                      <svg class="w-4 h-4" aria-hidden="true">
                        <use href="/icons/sprite.svg#lucide-star" />
                      </svg>
                    </button>
                    @if (comment.email) {
                      <a
                        [href]="'mailto:' + comment.email"
                        title="Alerter par email"
                        class="p-1.5 rounded-lg text-orange-400 hover:bg-orange-500/10 transition-colors"
                      >
                        <svg class="w-4 h-4" aria-hidden="true">
                          <use href="/icons/sprite.svg#lucide-mail" />
                        </svg>
                      </a>
                    }
                    <button
                      (click)="deleteComment(comment)"
                      title="Supprimer"
                      class="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <svg class="w-4 h-4" aria-hidden="true">
                        <use href="/icons/sprite.svg#lucide-trash-2" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="px-6 py-8 text-center text-muted text-sm">
                  Aucun commentaire
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AdminComments {
  private readonly blogGateway = inject(BLOG_GATEWAY);

  readonly comments = signal<readonly Comment[]>([]);
  readonly activeFilter = signal<FilterStatus>('all');

  readonly filters: readonly { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'Tous' },
    { value: 'pending', label: 'En attente' },
    { value: 'approved', label: 'Approuvés' },
    { value: 'rejected', label: 'Rejetés' },
  ];

  readonly filteredComments = computed(() => {
    const filter = this.activeFilter();
    const all = this.comments();
    if (filter === 'all') return all;
    return all.filter((c) => c.status === filter);
  });

  constructor() {
    this.loadComments();
  }

  countByStatus(status: FilterStatus): number {
    const all = this.comments();
    if (status === 'all') return all.length;
    return all.filter((c) => c.status === status).length;
  }

  statusClass(status: CommentStatus): string {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400';
      case 'approved':
        return 'bg-green-500/10 text-green-400';
      case 'rejected':
        return 'bg-red-500/10 text-red-400';
    }
  }

  statusLabel(status: CommentStatus): string {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'approved':
        return 'Approuvé';
      case 'rejected':
        return 'Rejeté';
    }
  }

  approve(comment: Comment): void {
    this.blogGateway
      .updateComment(comment.id, { status: 'approved' })
      .subscribe(() => this.loadComments());
  }

  reject(comment: Comment): void {
    this.blogGateway
      .updateComment(comment.id, { status: 'rejected' })
      .subscribe(() => this.loadComments());
  }

  toggleFeatured(comment: Comment): void {
    this.blogGateway
      .updateComment(comment.id, { featured: !comment.featured })
      .subscribe(() => this.loadComments());
  }

  deleteComment(comment: Comment): void {
    this.blogGateway.deleteComment(comment.id).subscribe(() => this.loadComments());
  }

  private loadComments(): void {
    this.blogGateway.getAllComments().subscribe((comments) => this.comments.set(comments));
  }
}
