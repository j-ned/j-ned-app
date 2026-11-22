import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { map, of, switchMap, type Observable } from 'rxjs';
import type { LoginEventPage } from '@features/auth/domain/models/login-event.model';
import { LoginJournalGateway } from '@features/auth/infra/gateways/login-journal.gateway';
import { loadState } from '@shared/ui/load-state';
import { AdminEmptyState } from '../../application/components/admin-empty-state';
import { AdminListState } from '../../application/components/admin-list-state';
import { AdminPager } from '../../application/components/admin-pager';
import {
  AdminPageHeader,
  type AdminPageParent,
} from '../../application/components/admin-page-header';
import {
  LOGIN_JOURNAL_PAGE_SIZE,
  loginJournalPager,
  loginJournalSummary,
  toLoginJournalRows,
} from '../../application/login-journal-view';

type LoadedPage = LoginEventPage & { readonly page: number };

const SETTINGS: AdminPageParent = { label: 'Paramètres', route: '/admin/settings' };

@Component({
  selector: 'app-admin-logins',
  imports: [AdminEmptyState, AdminListState, AdminPageHeader, AdminPager],
  host: { class: 'block' },
  template: `
    <app-admin-page-header [parent]="parent" heading="Journal des connexions">
      Chaque étape de connexion à l'administration, acceptée ou refusée, de la plus récente à la
      plus ancienne. Ni adresse IP ni e-mail saisi n'y sont gardés.
    </app-admin-page-header>

    <app-admin-list-state
      [state]="listState()"
      testIdPrefix="admin-logins"
      loadingLabel="Chargement du journal des connexions…"
      errorMessage="Le journal des connexions n'a pas pu être chargé. Vérifie ta connexion, puis réessaie."
      skeletonClass="h-14 rounded-sm"
      loadingClass="mt-5"
      (retry)="journalRes.reload()"
    >
      <ng-template #listEmpty>
        <app-admin-empty-state stamp="Journal vide" class="mt-5">
          <p>
            Aucune étape de connexion enregistrée sur les 90 derniers jours. La prochaine connexion
            apparaîtra ici.
          </p>
        </app-admin-empty-state>
      </ng-template>
      <ng-template #listReady>
        <p data-testid="admin-logins-summary" class="font-mono text-[0.8125rem] text-primary">
          {{ summary() }}
        </p>
        <ul data-testid="admin-logins-list" role="list" class="mt-2">
          @for (row of rows(); track row.id) {
            <li
              data-testid="admin-login-row"
              class="grid gap-x-6 gap-y-1 border-b border-line py-3.5 md:grid-cols-[11rem_minmax(0,1fr)_minmax(0,1.2fr)] md:items-baseline"
            >
              <time
                data-testid="login-date"
                [attr.datetime]="row.createdAt"
                class="font-mono text-xs text-muted tabular-nums"
                >{{ row.at }}</time
              >
              <p data-testid="login-result" class="min-w-0">
                <span data-testid="login-step" class="font-semibold">{{ row.step }}</span>
                <span class="sr-only">, </span>
                <span aria-hidden="true" class="text-muted"> · </span>
                <span
                  data-testid="login-outcome"
                  class="font-semibold"
                  [class.text-status-error]="row.rejected"
                  >{{ row.outcome }}</span
                >
                @if (row.note) {
                  <small data-testid="login-note" class="block text-[0.8125rem] text-muted">{{
                    row.note
                  }}</small>
                }
              </p>
              <p data-testid="login-origin" class="min-w-0 text-sm text-muted">{{ row.origin }}</p>
            </li>
          }
        </ul>
      </ng-template>
    </app-admin-list-state>

    @if (pager().pageCount > 1) {
      <nav
        app-admin-pager
        testIdPrefix="admin-logins"
        label="Pages du journal"
        newerLabel="Plus récentes"
        olderLabel="Plus anciennes"
        [pager]="pager()"
        (newer)="showNewer()"
        (older)="showOlder()"
      ></nav>
    }
  `,
})
export class AdminLogins {
  private readonly gateway = inject(LoginJournalGateway);

  protected readonly parent = SETTINGS;
  private readonly _requestedPage = signal(1);

  protected readonly journalRes = rxResource({
    params: () => this._requestedPage(),
    stream: ({ params }) => this.loadPage(params),
  });

  // Pendant un chargement, la page demandée ; ensuite celle que l'API a réellement servie.
  private readonly _page = computed(() =>
    this.journalRes.hasValue() ? this.journalRes.value().page : this._requestedPage(),
  );

  // Gardé pendant le chargement de la page suivante : le pagineur ne disparaît pas sous le focus.
  private readonly _total = linkedSignal<number | null, number>({
    source: () => (this.journalRes.hasValue() ? this.journalRes.value().total : null),
    computation: (total, previous) => total ?? previous?.value ?? 0,
  });
  protected readonly rows = computed(() =>
    this.journalRes.hasValue() ? toLoginJournalRows(this.journalRes.value().events) : [],
  );
  protected readonly summary = computed(() => loginJournalSummary(this._total()));
  protected readonly pager = computed(() => loginJournalPager(this._total(), this._page()));
  protected readonly listState = computed(() =>
    loadState(this.journalRes, () => this.rows().length === 0),
  );

  protected showNewer(): void {
    if (this.pager().hasNewer) this.show(this._page() - 1);
  }

  protected showOlder(): void {
    if (this.pager().hasOlder) this.show(this._page() + 1);
  }

  // Après un repli, la page servie n'est plus la page demandée : redemander cette dernière ne
  // changerait pas le paramètre de la ressource, il faut la relancer.
  private show(page: number): void {
    if (page === this._requestedPage()) this.journalRes.reload();
    else this._requestedPage.set(page);
  }

  // La purge quotidienne peut retirer la dernière page entre deux clics : on retombe alors sur la
  // nouvelle dernière page plutôt que d'afficher une page vide.
  private loadPage(page: number): Observable<LoadedPage> {
    return this.gateway.getPage(page, LOGIN_JOURNAL_PAGE_SIZE).pipe(
      switchMap((loaded) => {
        const lastPage = loginJournalPager(loaded.total, page).pageCount;
        return page <= lastPage
          ? of({ ...loaded, page })
          : this.gateway
              .getPage(lastPage, LOGIN_JOURNAL_PAGE_SIZE)
              .pipe(map((fallback) => ({ ...fallback, page: lastPage })));
      }),
    );
  }
}
