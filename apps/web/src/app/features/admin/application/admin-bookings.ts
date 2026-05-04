import { Component, DestroyRef, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { BOOKING_GATEWAY } from '@features/booking/application';
import type { Booking } from '@features/booking/domain';
import { ToastService } from '@shared/ui';
import { AdminTable } from './components/admin-table';
import {
  AdminColContact,
  AdminColBadge,
  AdminColText,
  AdminColMuted,
  AdminColActions,
} from './components/admin-column';

@Component({
  selector: 'app-admin-bookings',
  imports: [
    AdminTable,
    AdminColContact,
    AdminColBadge,
    AdminColText,
    AdminColMuted,
    AdminColActions,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <app-admin-table
      title="Réservations"
      [items]="bookings()"
      [defaultSort]="{ key: 'date', dir: 'desc' }"
      emptyMessage="Aucune réservation"
    >
      <app-admin-col-contact
        key="name"
        label="Contact"
        sortable
        [nameAccessor]="contactName"
        [subAccessor]="contactEmail"
      />
      <app-admin-col-badge key="date" label="Date" sortable tone="primary" [accessor]="date" />
      <app-admin-col-badge key="slot" label="Créneau" tone="neutral" [accessor]="slot" />
      <app-admin-col-text key="subject" label="Objet" bold [accessor]="subject" />
      <app-admin-col-muted key="message" label="Message" truncate [accessor]="message" />
      <app-admin-col-actions (delete)="deleteBooking($event)" />
    </app-admin-table>
  `,
})
export class AdminBookings {
  private readonly bookingGateway = inject(BOOKING_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly contactName = (b: Booking): string => b.name;
  protected readonly contactEmail = (b: Booking): string => b.email;
  protected readonly date = (b: Booking): string => b.date;
  protected readonly slot = (b: Booking): string => `${b.startTime} (${b.duration} min)`;
  protected readonly subject = (b: Booking): string => b.subject;
  protected readonly message = (b: Booking): string => b.message;

  private readonly bookingsRes = rxResource({
    stream: () => this.bookingGateway.getAllBookings(),
  });

  protected readonly bookings = computed(() => [...(this.bookingsRes.value() ?? [])]);

  protected deleteBooking(booking: Booking): void {
    const snapshot = this.bookingsRes.value() ?? [];
    this.bookingsRes.update((list) => (list ?? []).filter((b) => b.id !== booking.id));

    this.bookingGateway
      .deleteBooking(booking.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () =>
          this.toast.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Réservation supprimée',
          }),
        error: () => {
          this.bookingsRes.set(snapshot);
          this.toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de la suppression',
          });
        },
      });
  }
}
