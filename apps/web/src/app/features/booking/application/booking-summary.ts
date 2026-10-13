import { Component, computed, input } from '@angular/core';
import { BOOKING_FORMAT_LABELS } from '../domain/booking-copy.static-data';
import type { BookingFormat } from '../domain/models/booking.model';
import { formatParisDateTime } from '../domain/paris-format';

@Component({
  selector: 'app-booking-summary',
  host: {
    class: 'block rounded-md border-l-2 border-primary bg-primary/8 px-5 py-4',
    'data-testid': 'booking-summary',
  },
  template: `
    <p class="font-mono text-[0.8125rem] text-primary">Votre rendez-vous</p>
    <dl class="mt-2 grid gap-1 sm:grid-cols-[auto_1fr] sm:gap-x-6">
      <dt class="sr-only">Date et heure</dt>
      <dd data-testid="booking-summary-when" class="font-semibold first-letter:uppercase">
        {{ when() }}
      </dd>
      <dt class="sr-only">Format</dt>
      <dd data-testid="booking-summary-format" class="text-muted">{{ formatLabel() }}</dd>
    </dl>
  `,
})
export class BookingSummary {
  readonly startsAt = input.required<string>();
  readonly format = input.required<BookingFormat>();

  protected readonly when = computed(() => formatParisDateTime(this.startsAt()));
  protected readonly formatLabel = computed(() => BOOKING_FORMAT_LABELS[this.format()]);
}
