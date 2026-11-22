import { computed, inject, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { map, tap, type Observable } from 'rxjs';
import type { AdminComment, CommentStatus } from '@features/comments/domain/models/comment.model';
import { CommentsGateway } from '@features/comments/infra/comments.gateway';
import { loadState, resourceValueOr } from '@shared/ui/load-state';
import { ADMIN_COMMENTS_PAGE_SIZE, commentsSummary } from '../../application/admin-comments-view';
import { pager } from '../../application/pager';
import { loadWithinLastPage } from '../../application/within-last-page';

type PageRequest = { readonly status: CommentStatus; readonly page: number };

// La file de modération d'un écran : filtre, page servie par l'API et total du filtre.
export class CommentQueue {
  private readonly _gateway = inject(CommentsGateway);

  readonly status = signal<CommentStatus>('pending');
  // Changer de filtre ramène à la première page.
  private readonly _requestedPage = linkedSignal({ source: this.status, computation: () => 1 });
  private readonly _served = signal<PageRequest & { readonly total: number }>({
    status: 'pending',
    page: 1,
    total: 0,
  });

  readonly list = rxResource({
    params: (): PageRequest => ({ status: this.status(), page: this._requestedPage() }),
    stream: ({ params }) => this.loadPage(params),
  });

  readonly comments = computed(() => resourceValueOr(this.list, []));
  readonly state = computed(() => loadState(this.list, () => this.comments().length === 0));
  readonly summary = computed(() => commentsSummary(this._served().status, this._served().total));
  readonly pager = computed(() =>
    pager(this._served().total, this._served().page, ADMIN_COMMENTS_PAGE_SIZE),
  );

  showNewer(): void {
    if (this.pager().hasNewer) this.show(this._served().page - 1);
  }

  showOlder(): void {
    if (this.pager().hasOlder) this.show(this._served().page + 1);
  }

  // Le compteur de la navigation et la page servie (total, pages) suivent la file réelle.
  refresh(): void {
    this._gateway.invalidatePendingCount();
    this.list.reload();
  }

  // Une réponse du propriétaire est publiée d'emblée : la plus récente, en tête de liste.
  addReply(parent: AdminComment, reply: AdminComment): void {
    this.list.update((list) => [
      reply,
      ...(list ?? []).map((entry) =>
        entry.id === parent.id ? { ...entry, replyCount: entry.replyCount + 1 } : entry,
      ),
    ]);
    this._served.update((served) => ({ ...served, total: served.total + 1 }));
  }

  // Après un repli, la page servie n'est plus la page demandée : la redemander ne changerait pas
  // le paramètre de la ressource, il faut la relancer.
  private show(page: number): void {
    if (page === this._requestedPage()) this.list.reload();
    else this._requestedPage.set(page);
  }

  private loadPage({ status, page }: PageRequest): Observable<readonly AdminComment[]> {
    return loadWithinLastPage(page, ADMIN_COMMENTS_PAGE_SIZE, (at) =>
      this._gateway.getAdminPage(status, at, ADMIN_COMMENTS_PAGE_SIZE),
    ).pipe(
      tap(({ total, page: served }) => this._served.set({ status, page: served, total })),
      map(({ comments }) => comments),
    );
  }
}
