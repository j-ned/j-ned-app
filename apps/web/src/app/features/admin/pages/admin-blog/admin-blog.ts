import { Component, inject, signal, computed, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import type { Observable } from 'rxjs';
import { RouterLink } from '@angular/router';
import { BlogGateway } from '@features/blog/domain/gateways/blog.gateway';
import type { BlogPost } from '@features/blog/domain/models/blog-post.model';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { FilterGroup } from '@shared/ui/filter-group';
import { loadState, resourceValueOr } from '@shared/ui/load-state';
import { refreshWhenVisible } from '@core/navigation/refresh-when-visible';
import { ToastStore } from '@core/notifications/toast-store';
import { AdminEmptyState } from '../../application/components/admin-empty-state';
import { AdminListState } from '../../application/components/admin-list-state';
import { AdminPageHeader } from '../../application/components/admin-page-header';
import { AdminPostRow } from '../../application/components/admin-post-row';
import { postsOverline } from '../../application/admin-page-copy';
import {
  toAdminPostsView,
  type AdminPostsFilter,
  type PostsSortDirection,
} from '../../application/admin-posts-view';
import { PendingDeletion } from '../../application/pending-deletion';

@Component({
  selector: 'app-admin-blog',
  imports: [
    RouterLink,
    AppIcon,
    Button,
    ConfirmDialog,
    FilterGroup,
    AdminEmptyState,
    AdminListState,
    AdminPageHeader,
    AdminPostRow,
  ],
  host: { class: 'block' },
  template: `
    <app-admin-page-header [overline]="overline()" heading="Articles">
      Les articles du blog. Un article publié est visible sur le site au plus une seconde après
      l'enregistrement, au rechargement de la page.
      <div adminPageAside class="flex lg:justify-end">
        <a appButton data-testid="admin-post-new" routerLink="/admin/blog/new">
          <app-icon name="plus" [size]="16" />Nouvel article
        </a>
      </div>
    </app-admin-page-header>

    <app-admin-list-state
      [state]="listState()"
      testIdPrefix="admin-posts"
      loadingLabel="Chargement des articles…"
      errorMessage="Les articles n'ont pas pu être chargés. Vérifie ta connexion, puis réessaie."
      skeletonClass="h-20 rounded-md"
      (retry)="postsResource.reload()"
    >
      <ng-template #listEmpty>
        <app-admin-empty-state data-testid="admin-posts-empty" stamp="Aucun article" />
      </ng-template>
      <ng-template #listReady>
        @let view = postsView();
        <app-filter-group label="Filtrer par statut" [options]="view.filters" [(active)]="filter" />
        <table data-testid="admin-posts-list" class="mt-2 w-full border-collapse text-left">
          <caption class="sr-only">
            {{
              caption()
            }}
          </caption>
          <thead>
            <tr class="border-b-[1.5px] border-line-strong">
              <th scope="col" class="table-head pr-3">Article</th>
              <th scope="col" class="table-head pr-3">Statut</th>
              <th
                scope="col"
                [attr.aria-sort]="sortDir()"
                class="table-head hidden pr-3 md:table-cell"
              >
                <button
                  type="button"
                  data-testid="sort-published"
                  class="inline-flex min-h-11 items-center gap-1.5 uppercase tracking-[0.06em] hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
                  (click)="toggleSort()"
                >
                  Publié le<app-icon [name]="sortIcon()" [size]="12" />
                </button>
              </th>
              <th scope="col" class="table-head hidden pr-3 md:table-cell">Lecture</th>
              <th scope="col" class="table-head hidden pr-3 text-right md:table-cell">J'aime</th>
              <th scope="col" class="table-head pr-3"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            @for (row of view.rows; track row.id) {
              <tr app-admin-post-row [row]="row" (deleteRequested)="requestDeletion(row.id)"></tr>
            } @empty {
              <tr>
                <td colspan="6" class="py-12 text-center text-sm text-muted">
                  Aucun article de ce statut
                </td>
              </tr>
            }
          </tbody>
        </table>
      </ng-template>
    </app-admin-list-state>

    <app-confirm-dialog
      [open]="deletion.target() !== null"
      [heading]="deletionCopy().heading"
      [confirmLabel]="deletionCopy().confirm"
      (confirmed)="confirmDeletion()"
      (cancelled)="deletion.cancel()"
    >
      <p>L'article disparaît du blog dans la seconde. Cette action est définitive.</p>
    </app-confirm-dialog>
  `,
})
export class AdminBlog {
  private readonly gateway = inject(BlogGateway);
  private readonly toast = inject(ToastStore);
  private readonly _pageHeader = viewChild.required(AdminPageHeader);

  protected readonly postsResource = rxResource({
    stream: () => this.gateway.getAllPostsForAdmin(),
  });

  readonly posts = computed(() => resourceValueOr(this.postsResource, []));

  protected readonly filter = signal<AdminPostsFilter>('all');
  protected readonly sortDir = signal<PostsSortDirection>('descending');
  protected readonly postsView = computed(() =>
    toAdminPostsView(this.posts(), this.filter(), this.sortDir()),
  );
  protected readonly caption = computed(() =>
    this.sortDir() === 'descending'
      ? 'Articles, du plus récent au plus ancien'
      : 'Articles, du plus ancien au plus récent',
  );
  protected readonly sortIcon = computed(() =>
    this.sortDir() === 'descending' ? 'arrow-down' : 'arrow-up',
  );

  protected readonly overline = computed(() =>
    this.postsResource.hasValue() ? postsOverline(this.postsResource.value()) : '',
  );

  protected readonly listState = computed(() =>
    loadState(this.postsResource, () => this.posts().length === 0),
  );

  protected readonly deletion = new PendingDeletion<BlogPost>({
    list: this.postsResource,
    remove: (post): Observable<void> => this.gateway.deletePost(post.id),
    succeeded: (): void => this.toast.add({ severity: 'success', detail: 'Article supprimé' }),
    failed: (): void =>
      this.toast.add({ severity: 'error', detail: "Erreur lors de la suppression de l'article" }),
  });

  protected readonly deletionCopy = computed(() => {
    const title = this.deletion.target()?.title ?? '';
    return { heading: `Supprimer l'article ${title}\u202f?`, confirm: `Supprimer ${title}` };
  });

  // Un article a pu être écrit depuis un autre onglet ; la navigation suit la même liste.
  constructor() {
    refreshWhenVisible(() => this.gateway.invalidateAdminPosts());
  }

  protected toggleSort(): void {
    this.sortDir.update((dir) => (dir === 'descending' ? 'ascending' : 'descending'));
  }

  protected requestDeletion(id: string): void {
    const post = this.posts().find((candidate) => candidate.id === id);
    if (post) this.deletion.request(post);
  }

  protected confirmDeletion(): void {
    this.deletion.confirm();
    this._pageHeader().focusTitle();
  }

  remove(id: string): void {
    const post = this.posts().find((candidate) => candidate.id === id);
    if (post) this.deletion.delete(post);
  }
}
