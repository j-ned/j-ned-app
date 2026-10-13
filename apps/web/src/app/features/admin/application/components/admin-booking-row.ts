import { Component, input, output } from '@angular/core';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';
import { Stamp } from '@shared/ui/stamp';
import type { AdminBookingRowView } from '../admin-bookings-view';

@Component({
  selector: 'li[app-admin-booking-row]',
  imports: [AppIcon, Button, Stamp],
  host: { 'data-testid': 'admin-booking-row', class: 'block border-b border-line' },
  template: `
    @let booking = row();
    <div
      class="grid gap-x-5 gap-y-2 py-4 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_auto] md:items-start"
    >
      <p class="flex flex-wrap items-center gap-x-3 gap-y-1.5 md:flex-col md:items-start">
        <time
          data-testid="admin-booking-when"
          [attr.datetime]="booking.startsAt"
          class="font-mono text-xs text-foreground tabular-nums"
          >{{ booking.when }}</time
        >
        <app-stamp data-testid="admin-booking-status">{{ booking.status }}</app-stamp>
      </p>
      <div class="min-w-0">
        <p class="font-semibold">
          <span data-testid="admin-booking-name">{{ booking.name }}</span>
          @if (booking.company) {
            <span class="font-normal text-muted">
              · <span data-testid="admin-booking-company">{{ booking.company }}</span></span
            >
          }
        </p>
        <a
          data-testid="admin-booking-email"
          [href]="booking.mailto"
          class="inline-flex min-h-11 items-center text-[0.8125rem] break-all text-muted underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-primary md:min-h-0"
          >{{ booking.email }}</a
        >
        <p class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span data-testid="admin-booking-format" class="font-mono text-xs text-muted uppercase">{{
            booking.format
          }}</span>
          @let contact = booking.contact;
          @if (contact?.kind === 'video') {
            <a
              data-testid="admin-booking-video"
              [href]="contact.href"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-primary"
            >
              <app-icon name="video" [size]="16" />
              Rejoindre la visio
              <span class="sr-only">avec {{ booking.name }} (nouvel onglet)</span>
            </a>
          } @else if (contact?.kind === 'phone') {
            <a
              data-testid="admin-booking-phone"
              [href]="contact.href"
              class="inline-flex min-h-11 items-center gap-2 font-semibold text-primary tabular-nums underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-primary"
            >
              <app-icon name="phone" [size]="14" />
              {{ contact.label }}
            </a>
          }
        </p>
        <p
          data-testid="admin-booking-message"
          class="mt-2 max-w-[70ch] whitespace-pre-line text-muted"
        >
          {{ booking.message }}
        </p>
        @if (booking.cancelReason) {
          <p class="mt-2 max-w-[70ch] text-sm">
            <span class="text-muted">Motif&nbsp;: </span>
            <span data-testid="admin-booking-cancel-reason">{{ booking.cancelReason }}</span>
          </p>
        }
      </div>
      @if (booking.cancellable) {
        <div class="md:justify-self-end">
          <button
            appButton
            type="button"
            variant="outlined-danger"
            data-testid="admin-booking-cancel"
            [attr.aria-label]="booking.cancelLabel"
            (click)="cancelRequested.emit()"
          >
            <app-icon name="xmark" [size]="16" />
            Annuler
          </button>
        </div>
      }
    </div>
  `,
})
export class AdminBookingRow {
  readonly row = input.required<AdminBookingRowView>();
  readonly cancelRequested = output<void>();
}
