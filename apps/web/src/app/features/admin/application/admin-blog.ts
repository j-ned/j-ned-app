import { Component, DestroyRef, inject, signal, computed, viewChild } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { BlogGateway } from '@features/blog/domain/gateways/blog.gateway';
import type { BlogPost } from '@features/blog/domain/models/blog-post.model';
import { AppIcon } from '@shared/icons/app-icon';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { FilterGroup } from '@shared/ui/filter-group';
import { LoadError } from '@shared/ui/load-error';
import { loadState } from '@shared/ui/load-state';
import { AppSkeleton } from '@shared/ui/skeleton';
import { ToastStore } from '@shared/ui/toast-store';
import { AdminPageHeader } from './components/admin-page-header';
import { AdminPostRow } from './components/admin-post-row';
import { postsOverline } from './admin-page-copy';
import {
  toAdminPostsView,
  type AdminPostsFilter,
  type PostsSortDirection,
} from './admin-posts-view';

@Component({
  selector: 'app-admin-blog',
  imports: [
    RouterLink,
    AppIcon,
    ConfirmDialog,
    FilterGroup,
    LoadError,
    AppSkeleton,
    AdminPageHeader,
    AdminPostRow,
  ],
  host: { class: 'block' },
  template: `
    <app-admin-page-header [overline]="overline()" heading="Articles">
      Les articles du blog. Publier un article redéploie le site&nbsp;: il est en ligne quelques
      minutes plus tard.
      <div adminPageAside class="flex lg:justify-end">
        <a data-testid="admin-post-new" routerLink="/admin/blog/new" class="link-btn-primary">
          <app-icon name="plus" [size]="16" />Nouvel article
        </a>
      </div>
    </app-admin-page-header>

    @switch (listState()) {
      @case ('loading') {
        <div data-testid="admin-posts-loading" role="status" class="space-y-3">
          <span class="sr-only">Chargement des articles…</span>
          <app-skeleton class="block h-20 rounded-md" />
          <app-skeleton class="block h-20 rounded-md" />
          <app-skeleton class="block h-20 rounded-md" />
        </div>
      }
      @case ('error') {
        <app-load-error
          message="Les articles n'ont pas pu être chargés. Vérifiez votre connexion, puis réessayez."
          (retry)="postsResource.reload()"
        />
      }
      @case ('empty') {
        <p
          data-testid="admin-posts-empty"
          class="rounded-xs border border-dashed border-line-strong px-5.5 py-14 text-center text-sm text-muted"
        >
          Aucun article
        </p>
      }
      @default {
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
              <th scope="col" [class]="headClass">Article</th>
              <th scope="col" [class]="headClass">Statut</th>
              <th
                scope="col"
                [attr.aria-sort]="sortDir()"
                [class]="headClass + ' hidden md:table-cell'"
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
              <th scope="col" [class]="headClass + ' hidden md:table-cell'">Lecture</th>
              <th scope="col" [class]="headClass + ' hidden text-right md:table-cell'">J'aime</th>
              <th scope="col" [class]="headClass"><span class="sr-only">Actions</span></th>
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
      }
    }

    <app-confirm-dialog
      [open]="pendingDeletion() !== null"
      [heading]="deletionCopy().heading"
      [confirmLabel]="deletionCopy().confirm"
      (confirmed)="confirmDeletion()"
      (cancelled)="pendingDeletion.set(null)"
    >
      <p>L'article disparaît du blog au prochain déploiement. Cette action est définitive.</p>
    </app-confirm-dialog>
  `,
})
export class AdminBlog {
  private readonly gateway = inject(BlogGateway);
  private readonly toast = inject(ToastStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly _pageHeader = viewChild.required(AdminPageHeader);

  protected readonly postsResource = rxResource({
    stream: () => this.gateway.getAllPostsForAdmin(),
  });

  readonly posts = computed(() =>
    this.postsResource.hasValue() ? this.postsResource.value() : [],
  );

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

  protected readonly pendingDeletion = signal<BlogPost | null>(null);

  protected readonly deletionCopy = computed(() => {
    const title = this.pendingDeletion()?.title ?? '';
    return { heading: `Supprimer l'article ${title}\u202f?`, confirm: `Supprimer ${title}` };
  });

  protected readonly headClass =
    'py-2.5 pr-3 font-mono text-xs font-medium uppercase tracking-[0.06em] text-muted';

  protected toggleSort(): void {
    this.sortDir.update((dir) => (dir === 'descending' ? 'ascending' : 'descending'));
  }

  protected requestDeletion(id: string): void {
    this.pendingDeletion.set(this.posts().find((post) => post.id === id) ?? null);
  }

  protected confirmDeletion(): void {
    const post = this.pendingDeletion();
    this.pendingDeletion.set(null);
    this._pageHeader().focusTitle();
    if (post) this.remove(post.id);
  }

  remove(id: string): void {
    const snapshot = this.posts();
    this.postsResource.update((list) => (list ?? []).filter((p) => p.id !== id));

    this.gateway
      .deletePost(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.gateway.invalidateAdminPosts();
          this.toast.add({ severity: 'success', detail: 'Article supprimé' });
        },
        error: () => {
          this.postsResource.set(snapshot);
          this.toast.add({
            severity: 'error',
            detail: "Erreur lors de la suppression de l'article",
          });
        },
      });
  }
}
