import {
  Component,
  DestroyRef,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { BLOG_GATEWAY } from '@features/blog/application';
import type { Comment, CommentStatus } from '@features/blog/domain';
import { ToastService } from '@shared/toast';

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
            {{ statusCounts().get(filter.value) ?? 0 }}
          </span>
        </button>
      }
    </div>

    <div class="bg-background border border-foreground/10 rounded-2xl overflow-hidden shadow-lg">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-foreground/10">
              <th scope="col" class="text-left px-6 py-4 text-sm font-medium text-muted">Auteur</th>
              <th scope="col" class="text-left px-6 py-4 text-sm font-medium text-muted">
                Contenu
              </th>
              <th scope="col" class="text-left px-6 py-4 text-sm font-medium text-muted">Note</th>
              <th scope="col" class="text-left px-6 py-4 text-sm font-medium text-muted">Statut</th>
              <th scope="col" class="text-left px-6 py-4 text-sm font-medium text-muted">Date</th>
              <th scope="col" class="text-right px-6 py-4 text-sm font-medium text-muted">
                Actions
              </th>
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
                      'px-2.5 py-1 rounded-lg text-xs font-medium ' + STATUS_CLASSES[comment.status]
                    "
                  >
                    {{ STATUS_LABELS[comment.status] }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-muted">{{ comment.date }}</td>
                <td class="px-6 py-4">
                  <div class="flex items-center justify-end gap-1">
                    @if (comment.status !== 'approved') {
                      <button
                        (click)="approve(comment)"
                        aria-label="Approuver"
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
                        aria-label="Rejeter"
                        class="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <svg class="w-4 h-4" aria-hidden="true">
                          <use href="/icons/sprite.svg#lucide-x" />
                        </svg>
                      </button>
                    }
                    <button
                      (click)="toggleFeatured(comment)"
                      [attr.aria-label]="comment.featured ? 'Retirer de la une' : 'Mettre en avant'"
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
                      aria-label="Supprimer"
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
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly commentsRes = rxResource({
    stream: () => this.blogGateway.getAllComments(),
  });

  readonly comments = computed(() => this.commentsRes.value() ?? []);
  readonly activeFilter = signal<FilterStatus>('all');

  readonly filters: readonly { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'Tous' },
    { value: 'pending', label: 'En attente' },
    { value: 'approved', label: 'Approuvés' },
    { value: 'rejected', label: 'Rejetés' },
  ];

  protected readonly STATUS_CLASSES: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-400',
    approved: 'bg-green-500/10 text-green-400',
    rejected: 'bg-red-500/10 text-red-400',
  };

  protected readonly STATUS_LABELS: Record<string, string> = {
    pending: 'En attente',
    approved: 'Approuvé',
    rejected: 'Rejeté',
  };

  readonly filteredComments = computed(() => {
    const filter = this.activeFilter();
    const all = this.comments();
    if (filter === 'all') return all;
    return all.filter((c) => c.status === filter);
  });

  protected readonly statusCounts = computed(() => {
    const comments = this.comments();
    const counts = new Map<string, number>();
    counts.set('all', comments.length);
    for (const c of comments) {
      counts.set(c.status, (counts.get(c.status) ?? 0) + 1);
    }
    return counts;
  });

  approve(comment: Comment): void {
    this.blogGateway
      .updateComment(comment.id, { status: 'approved' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.commentsRes.reload();
          this.toast.success('Commentaire approuvé');
        },
        error: () => this.toast.error("Erreur lors de l'approbation"),
      });
  }

  reject(comment: Comment): void {
    this.blogGateway
      .updateComment(comment.id, { status: 'rejected' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.commentsRes.reload();
          this.toast.success('Commentaire rejeté');
        },
        error: () => this.toast.error('Erreur lors du rejet'),
      });
  }

  toggleFeatured(comment: Comment): void {
    this.blogGateway
      .updateComment(comment.id, { featured: !comment.featured })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.commentsRes.reload();
          this.toast.success(
            comment.featured ? 'Commentaire retiré de la une' : 'Commentaire mis en avant',
          );
        },
        error: () => this.toast.error('Erreur lors de la mise à jour'),
      });
  }

  deleteComment(comment: Comment): void {
    this.blogGateway
      .deleteComment(comment.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.commentsRes.reload();
          this.toast.success('Commentaire supprimé');
        },
        error: () => this.toast.error('Erreur lors de la suppression'),
      });
  }
}
