import { Component, DestroyRef, computed, inject, signal, viewChild } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormField, form, maxLength } from '@angular/forms/signals';
import { ToastStore } from '@core/notifications/toast-store';
import { BookingGateway } from '@features/booking/domain/gateways/booking.gateway';
import type {
  BookingAdminFailure,
  BookingScope,
} from '@features/booking/domain/models/booking-admin.model';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { FilterGroup } from '@shared/ui/filter-group';
import { LoadError } from '@shared/ui/load-error';
import { loadState } from '@shared/ui/load-state';
import { AppSkeleton } from '@shared/ui/skeleton';
import {
  ADMIN_BOOKINGS_FILTERS,
  bookingsOverline,
  toAdminBookingRows,
  type AdminBookingRowView,
} from '../../application/admin-bookings-view';
import { AdminBookingRow } from '../../application/components/admin-booking-row';
import { AdminEmptyState } from '../../application/components/admin-empty-state';
import { AdminPageHeader } from '../../application/components/admin-page-header';

const REASON_MAX_LENGTH = 500;

const SERVER_FAILURE =
  "Annulation impossible\u00a0: le serveur n'a pas répondu. Réessayez dans un instant.";

const CANCEL_FAILURES: Partial<Record<BookingAdminFailure, string>> = {
  'too-late': 'Ce rendez-vous a commencé\u00a0: il ne peut plus être annulé.',
  'not-found': 'Ce rendez-vous est introuvable. Rechargez la page.',
  invalid: `Le motif dépasse ${REASON_MAX_LENGTH} caractères.`,
  network: 'Annulation impossible\u00a0: vérifiez votre connexion, puis réessayez.',
};

@Component({
  selector: 'app-admin-bookings',
  imports: [
    ConfirmDialog,
    FilterGroup,
    FormField,
    LoadError,
    AppSkeleton,
    AdminBookingRow,
    AdminEmptyState,
    AdminPageHeader,
  ],
  host: { class: 'block' },
  template: `
    <app-admin-page-header [overline]="overline()" heading="Rendez-vous">
      Les appels de cadrage réservés depuis le site, à l'heure de Paris.
    </app-admin-page-header>

    <app-filter-group label="Filtrer les rendez-vous" [options]="filters" [(active)]="scope" />

    @switch (listState()) {
      @case ('loading') {
        <div data-testid="admin-bookings-loading" role="status" class="mt-5 space-y-3">
          <span class="sr-only">Chargement des rendez-vous…</span>
          <app-skeleton class="block h-24 rounded-sm" />
          <app-skeleton class="block h-24 rounded-sm" />
          <app-skeleton class="block h-24 rounded-sm" />
        </div>
      }
      @case ('error') {
        <app-load-error
          message="Les rendez-vous n'ont pas pu être chargés. Vérifiez votre connexion, puis réessayez."
          (retry)="bookingsRes.reload()"
        />
      }
      @case ('empty') {
        <app-admin-empty-state
          [stamp]="scope() === 'upcoming' ? 'Agenda libre' : 'Historique vide'"
          class="mt-5 justify-items-center! py-14! text-center [&_p]:mx-auto"
        >
          @if (scope() === 'upcoming') {
            <p>
              Aucun rendez-vous à venir pour le moment. Chaque réservation arrive ici et par e-mail.
            </p>
          } @else {
            <p>Aucun rendez-vous passé pour le moment.</p>
          }
        </app-admin-empty-state>
      }
      @default {
        <ul data-testid="admin-bookings-list" role="list" class="mt-2">
          @for (row of rows(); track row.id) {
            <li app-admin-booking-row [row]="row" (cancelRequested)="requestCancellation(row)"></li>
          }
        </ul>
      }
    }

    <app-confirm-dialog
      [open]="pendingCancellation() !== null"
      [heading]="cancellationHeading()"
      confirmLabel="Annuler le rendez-vous"
      cancelLabel="Garder le rendez-vous"
      (confirmed)="confirmCancellation()"
      (cancelled)="pendingCancellation.set(null)"
    >
      <p>
        Un e-mail prévient {{ pendingCancellation()?.name }}, avec le motif s'il est renseigné. Le
        créneau redevient réservable.
      </p>
      <label for="admin-booking-reason" class="form-label mt-4">Motif (facultatif)</label>
      <textarea
        id="admin-booking-reason"
        data-testid="admin-booking-reason"
        rows="3"
        [formField]="reasonForm.reason"
        class="form-textarea"
      ></textarea>
    </app-confirm-dialog>
  `,
})
export class AdminBookings {
  private readonly bookingGateway = inject(BookingGateway);
  private readonly toast = inject(ToastStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly _pageHeader = viewChild.required(AdminPageHeader);

  protected readonly filters = ADMIN_BOOKINGS_FILTERS;
  protected readonly scope = signal<BookingScope>('upcoming');

  protected readonly bookingsRes = rxResource({
    params: () => this.scope(),
    stream: ({ params }) => this.bookingGateway.getBookings(params),
  });

  private readonly _bookings = computed(() =>
    this.bookingsRes.hasValue() ? this.bookingsRes.value() : [],
  );
  protected readonly rows = computed(() =>
    toAdminBookingRows(this._bookings(), this.scope(), new Date()),
  );
  protected readonly overline = computed(() =>
    this.bookingsRes.hasValue() ? bookingsOverline(this._bookings().length, this.scope()) : '',
  );
  protected readonly listState = computed(() =>
    loadState(this.bookingsRes, () => this._bookings().length === 0),
  );

  protected readonly pendingCancellation = signal<AdminBookingRowView | null>(null);
  protected readonly cancellationHeading = computed(
    () => `Annuler le rendez-vous de ${this.pendingCancellation()?.name ?? ''}\u202f?`,
  );
  private readonly _reason = signal({ reason: '' });
  protected readonly reasonForm = form(this._reason, (path) => {
    maxLength(path.reason, REASON_MAX_LENGTH);
  });

  protected requestCancellation(row: AdminBookingRowView): void {
    this._reason.set({ reason: '' });
    this.pendingCancellation.set(row);
  }

  protected confirmCancellation(): void {
    const row = this.pendingCancellation();
    const reason = this._reason().reason.trim() || null;
    this.pendingCancellation.set(null);
    this._pageHeader().focusTitle();
    if (row) this.cancel(row, reason);
  }

  private cancel(row: AdminBookingRowView, reason: string | null): void {
    this.bookingGateway
      .cancelBookingAsOwner(row.id, reason)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (!result.success) {
          this.toast.add({
            severity: 'error',
            detail: CANCEL_FAILURES[result.reason] ?? SERVER_FAILURE,
          });
          return;
        }
        this.bookingsRes.update((list) =>
          (list ?? []).map((booking) => (booking.id === row.id ? result.data : booking)),
        );
        this.bookingGateway.invalidateUpcomingCount();
        this.toast.add({
          severity: 'success',
          detail: `Rendez-vous annulé\u00a0: un e-mail a prévenu ${row.name}`,
        });
      });
  }
}
