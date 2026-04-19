import { Component, DestroyRef, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { BLOG_GATEWAY } from '@features/blog/application';
import type { Article } from '@features/blog/domain';
import { ToastService } from '@shared/ui';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { InputText } from 'primeng/inputtext';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';

@Component({
  selector: 'app-admin-articles',
  imports: [RouterLink, TableModule, Button, Tag, InputText, IconField, InputIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-foreground">Articles</h1>
      <p-button label="Nouvel article" icon="pi pi-plus" routerLink="/admin/content/articles/new" />
    </div>

    <div class="flex items-center mb-4">
      <p-iconfield>
        <p-inputicon styleClass="pi pi-search" />
        <input
          pInputText
          type="text"
          placeholder="Rechercher un article…"
          (input)="table.filterGlobal($any($event.target).value, 'contains')"
        />
      </p-iconfield>
    </div>

    <p-table
      #table
      [value]="articles()"
      [paginator]="articles().length > 10"
      [rows]="10"
      [rowHover]="true"
      dataKey="id"
      [globalFilterFields]="['title', 'author']"
      emptyMessage="Aucun article"
    >
      <ng-template #header>
        <tr>
          <th pSortableColumn="title">Titre <p-sortIcon field="title" /></th>
          <th pSortableColumn="date">Date <p-sortIcon field="date" /></th>
          <th>Tags</th>
          <th class="text-center" pSortableColumn="featured">
            Featured <p-sortIcon field="featured" />
          </th>
          <th class="text-right">Actions</th>
        </tr>
      </ng-template>
      <ng-template #body let-article>
        <tr>
          <td class="font-medium text-foreground">{{ article.title }}</td>
          <td class="text-muted">{{ article.date }}</td>
          <td>
            <div class="flex flex-wrap gap-1">
              @for (tag of article.tags; track tag) {
                <p-tag [value]="tag" severity="info" />
              }
            </div>
          </td>
          <td class="text-center">
            <p-button
              [label]="article.featured ? 'Oui' : 'Non'"
              size="small"
              [severity]="article.featured ? 'primary' : 'secondary'"
              [outlined]="!article.featured"
              (onClick)="toggleFeatured(article)"
            />
          </td>
          <td class="text-right">
            <div class="flex items-center justify-end gap-2">
              <p-button
                icon="pi pi-pencil"
                severity="secondary"
                size="small"
                [text]="true"
                [routerLink]="['/admin/content/articles', article.id, 'edit']"
                ariaLabel="Modifier"
              />
              <p-button
                icon="pi pi-trash"
                severity="danger"
                size="small"
                [text]="true"
                (onClick)="deleteArticle(article)"
                ariaLabel="Supprimer"
              />
            </div>
          </td>
        </tr>
      </ng-template>
    </p-table>
  `,
})
export class AdminArticles {
  private readonly blogGateway = inject(BLOG_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly articlesRes = rxResource({
    stream: () => this.blogGateway.getAllArticles(),
  });

  readonly articles = computed(() => [...(this.articlesRes.value() ?? [])]);

  toggleFeatured(article: Article): void {
    this.blogGateway
      .updateArticle(article.id, { featured: !article.featured })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.articlesRes.update((list) =>
            (list ?? []).map((a) => (a.id === article.id ? updated : a)),
          );
          this.toast.add({
            severity: 'success',
            summary: 'Succès',
            detail: article.featured ? 'Article retiré de la une' : 'Article mis en avant',
          });
        },
        error: () =>
          this.toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: "Erreur lors de la mise à jour de l'article",
          }),
      });
  }

  deleteArticle(article: Article): void {
    const snapshot = this.articlesRes.value() ?? [];
    this.articlesRes.update((list) => (list ?? []).filter((a) => a.id !== article.id));

    this.blogGateway
      .deleteArticle(article.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () =>
          this.toast.add({ severity: 'success', summary: 'Succès', detail: 'Article supprimé' }),
        error: () => {
          this.articlesRes.set(snapshot);
          this.toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: "Erreur lors de la suppression de l'article",
          });
        },
      });
  }
}
