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
import { ToastService } from '@shared/ui';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';

type FilterStatus = 'all' | CommentStatus;

@Component({
  selector: 'app-admin-comments',
  imports: [TableModule, Button, Tag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h1 class="text-2xl font-bold text-foreground mb-8">Commentaires</h1>

    <div class="flex flex-wrap gap-2 mb-6">
      @for (filter of filters; track filter.value) {
        <p-button
          [label]="filter.label + ' (' + (statusCounts().get(filter.value) ?? 0) + ')'"
          size="small"
          [severity]="activeFilter() === filter.value ? 'primary' : 'secondary'"
          [outlined]="activeFilter() !== filter.value"
          (onClick)="activeFilter.set(filter.value)"
        />
      }
    </div>

    <p-table
      [value]="filteredComments()"
      [paginator]="filteredComments().length > 10"
      [rows]="10"
      [rowHover]="true"
      dataKey="id"
      emptyMessage="Aucun commentaire"
    >
      <ng-template #header>
        <tr>
          <th pSortableColumn="author">Auteur <p-sortIcon field="author" /></th>
          <th>Contenu</th>
          <th>Note</th>
          <th pSortableColumn="status">Statut <p-sortIcon field="status" /></th>
          <th pSortableColumn="date">Date <p-sortIcon field="date" /></th>
          <th class="text-right">Actions</th>
        </tr>
      </ng-template>
      <ng-template #body let-comment>
        <tr>
          <td class="font-medium text-foreground">{{ comment.author }}</td>
          <td class="text-muted max-w-xs truncate">{{ comment.content }}</td>
          <td>
            @if (comment.rating > 0) {
              <div class="flex gap-0.5">
                @for (star of [1, 2, 3, 4, 5]; track star) {
                  <i
                    class="pi pi-star text-base"
                    [class]="star <= comment.rating ? 'text-yellow-400' : 'text-muted'"
                    aria-hidden="true"
                  ></i>
                }
              </div>
            } @else {
              <span class="text-xs text-muted">&mdash;</span>
            }
          </td>
          <td>
            <p-tag
              [value]="STATUS_LABELS[comment.status]"
              [severity]="STATUS_SEVERITY[comment.status]"
            />
          </td>
          <td class="text-muted text-sm">{{ comment.date }}</td>
          <td class="text-right">
            <div class="flex items-center justify-end gap-1">
              @if (comment.status !== 'approved') {
                <p-button
                  icon="pi pi-check"
                  severity="success"
                  size="small"
                  [text]="true"
                  (onClick)="approve(comment)"
                  ariaLabel="Approuver"
                />
              }
              @if (comment.status !== 'rejected') {
                <p-button
                  icon="pi pi-times"
                  severity="danger"
                  size="small"
                  [text]="true"
                  (onClick)="reject(comment)"
                  ariaLabel="Rejeter"
                />
              }
              <p-button
                icon="pi pi-star"
                [severity]="comment.featured ? 'warn' : 'secondary'"
                size="small"
                [text]="true"
                (onClick)="toggleFeatured(comment)"
                [ariaLabel]="comment.featured ? 'Retirer de la une' : 'Mettre en avant'"
              />
              @if (comment.email) {
                <p-button
                  icon="pi pi-envelope"
                  severity="warn"
                  size="small"
                  [text]="true"
                  [attr.href]="'mailto:' + comment.email"
                  ariaLabel="Alerter par email"
                />
              }
              <p-button
                icon="pi pi-trash"
                severity="danger"
                size="small"
                [text]="true"
                (onClick)="deleteComment(comment)"
                ariaLabel="Supprimer"
              />
            </div>
          </td>
        </tr>
      </ng-template>
    </p-table>
  `,
})
export class AdminComments {
  private readonly blogGateway = inject(BLOG_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly commentsRes = rxResource({
    stream: () => this.blogGateway.getAllComments(),
  });

  readonly comments = computed(() => [...(this.commentsRes.value() ?? [])]);
  readonly activeFilter = signal<FilterStatus>('all');

  readonly filters: readonly { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'Tous' },
    { value: 'pending', label: 'En attente' },
    { value: 'approved', label: 'Approuvés' },
    { value: 'rejected', label: 'Rejetés' },
  ];

  protected readonly STATUS_LABELS: Record<string, string> = {
    pending: 'En attente',
    approved: 'Approuvé',
    rejected: 'Rejeté',
  };

  protected readonly STATUS_SEVERITY: Record<string, 'warn' | 'success' | 'danger'> = {
    pending: 'warn',
    approved: 'success',
    rejected: 'danger',
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
    this.patchComment(
      comment.id,
      { status: 'approved' },
      'Commentaire approuvé',
      "Erreur lors de l'approbation",
    );
  }

  reject(comment: Comment): void {
    this.patchComment(
      comment.id,
      { status: 'rejected' },
      'Commentaire rejeté',
      'Erreur lors du rejet',
    );
  }

  toggleFeatured(comment: Comment): void {
    this.patchComment(
      comment.id,
      { featured: !comment.featured },
      comment.featured ? 'Commentaire retiré de la une' : 'Commentaire mis en avant',
      'Erreur lors de la mise à jour',
    );
  }

  private patchComment(
    id: string,
    patch: Partial<Comment>,
    successMessage: string,
    errorMessage: string,
  ): void {
    this.blogGateway
      .updateComment(id, patch)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.commentsRes.update((list) => (list ?? []).map((c) => (c.id === id ? updated : c)));
          this.toast.add({ severity: 'success', summary: 'Succès', detail: successMessage });
        },
        error: () => this.toast.add({ severity: 'error', summary: 'Erreur', detail: errorMessage }),
      });
  }

  deleteComment(comment: Comment): void {
    const snapshot = this.commentsRes.value() ?? [];
    this.commentsRes.update((list) => (list ?? []).filter((c) => c.id !== comment.id));

    this.blogGateway
      .deleteComment(comment.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () =>
          this.toast.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Commentaire supprimé',
          }),
        error: () => {
          this.commentsRes.set(snapshot);
          this.toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de la suppression',
          });
        },
      });
  }
}
