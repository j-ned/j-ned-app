import { Component, DestroyRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { BOOKING_GATEWAY } from '@features/booking/application';
import type { Booking } from '@features/booking/domain';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';

@Component({
  selector: 'app-admin-bookings',
  imports: [TableModule, Button, Tag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h1 class="text-2xl font-bold text-foreground mb-8">Réservations</h1>

    <p-table
      [value]="bookings()"
      [paginator]="bookings().length > 10"
      [rows]="10"
      [rowHover]="true"
      dataKey="id"
      emptyMessage="Aucune réservation"
    >
      <ng-template #header>
        <tr>
          <th pSortableColumn="name">Contact <p-sortIcon field="name" /></th>
          <th pSortableColumn="date">Date <p-sortIcon field="date" /></th>
          <th>Créneau</th>
          <th>Objet / Message</th>
          <th class="text-right">Actions</th>
        </tr>
      </ng-template>
      <ng-template #body let-booking>
        <tr>
          <td>
            <div class="font-medium text-foreground">{{ booking.name }}</div>
            <div class="text-xs text-muted">{{ booking.email }}</div>
          </td>
          <td>
            <p-tag [value]="booking.date" severity="info" />
          </td>
          <td>
            <p-tag
              [value]="booking.startTime + ' (' + booking.duration + ' min)'"
              severity="secondary"
            />
          </td>
          <td>
            <div class="font-medium text-foreground">{{ booking.subject }}</div>
            <div class="text-xs text-muted max-w-md truncate">{{ booking.message }}</div>
          </td>
          <td class="text-right">
            <p-button
              icon="pi pi-trash"
              severity="danger"
              size="small"
              [text]="true"
              (onClick)="deleteBooking(booking)"
              ariaLabel="Supprimer"
            />
          </td>
        </tr>
      </ng-template>
    </p-table>
  `,
})
export class AdminBookings {
  private readonly bookingGateway = inject(BOOKING_GATEWAY);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly bookingsRes = rxResource({
    stream: () => this.bookingGateway.getAllBookings(),
  });

  readonly bookings = (): Booking[] => [...(this.bookingsRes.value() ?? [])];

  deleteBooking(booking: Booking): void {
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
