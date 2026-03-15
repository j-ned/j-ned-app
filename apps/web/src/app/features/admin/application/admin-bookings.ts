import { Component, DestroyRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { BOOKING_GATEWAY } from '@features/booking/application';
import type { Booking } from '@features/booking/domain';
import { ToastService } from '@shared/toast';

@Component({
  selector: 'app-admin-bookings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h1 class="text-2xl font-bold text-foreground mb-8">Réservations</h1>

    <div class="space-y-4">
      @for (booking of bookings(); track booking.id) {
        <div class="bg-background border border-foreground/10 rounded-2xl p-6 shadow-lg">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-2 text-sm text-muted mb-2">
                <span class="font-medium text-foreground">{{ booking.name }}</span>
                <span>&middot;</span>
                <span>{{ booking.email }}</span>
              </div>
              <div class="flex items-center gap-3 text-sm text-muted mb-3">
                <span class="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">
                  {{ booking.date }}
                </span>
                <span class="px-2 py-0.5 rounded bg-accent/10 text-accent text-xs">
                  {{ booking.startTime }} ({{ booking.duration }} min)
                </span>
              </div>
              <p class="text-sm font-medium text-foreground mb-1">{{ booking.subject }}</p>
              <p class="text-muted text-sm">{{ booking.message }}</p>
            </div>
            <button
              (click)="deleteBooking(booking)"
              class="shrink-0 px-3 py-1.5 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              Supprimer
            </button>
          </div>
        </div>
      } @empty {
        <p class="text-center text-muted py-12">Aucune réservation</p>
      }
    </div>
  `,
})
export class AdminBookings {
  private readonly bookingGateway = inject(BOOKING_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly bookingsRes = rxResource({
    stream: () => this.bookingGateway.getAllBookings(),
  });

  readonly bookings = (): readonly Booking[] => this.bookingsRes.value() ?? [];

  deleteBooking(booking: Booking): void {
    this.bookingGateway
      .deleteBooking(booking.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.bookingsRes.reload();
          this.toast.success('Réservation supprimée');
        },
        error: () => this.toast.error('Erreur lors de la suppression'),
      });
  }
}
