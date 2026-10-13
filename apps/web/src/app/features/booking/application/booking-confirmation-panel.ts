import { Component, ElementRef, afterNextRender, computed, input, viewChild } from '@angular/core';
import { Button } from '@shared/ui/button';
import { BOOKING_FORMAT_LABELS } from '../domain/booking-copy.static-data';
import type { BookingConfirmation } from '../domain/models/booking.model';
import { formatParisDateTime } from '../domain/paris-format';

@Component({
  selector: 'app-booking-confirmation-panel',
  imports: [Button],
  host: {
    class: 'block rounded-xl border border-foreground/8 bg-surface p-7 md:p-9',
    'data-testid': 'booking-confirmation',
  },
  template: `
    <p class="font-mono text-[0.8125rem] text-primary">Réservation enregistrée</p>
    <h2
      #heading
      tabindex="-1"
      data-testid="booking-confirmation-heading"
      class="mt-3 section-title"
    >
      Rendez-vous confirmé
    </h2>
    <dl class="mt-6 grid gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
      <dt class="text-muted">Date</dt>
      <dd data-testid="booking-confirmation-when" class="font-semibold first-letter:uppercase">
        {{ when() }}
      </dd>
      <dt class="text-muted">Format</dt>
      <dd data-testid="booking-confirmation-format" class="font-semibold">{{ formatLabel() }}</dd>
    </dl>
    <p class="mt-6 max-w-[60ch] text-muted">
      Une invitation part à
      <strong data-testid="booking-confirmation-email" class="font-semibold text-foreground">{{
        email()
      }}</strong
      >. Elle s’ajoute à votre agenda et contient le lien pour annuler si besoin.
    </p>
    @if (confirmation().videoUrl; as videoUrl) {
      <a
        appButton
        class="mt-6"
        target="_blank"
        rel="noopener noreferrer"
        data-testid="booking-confirmation-video"
        [href]="videoUrl"
      >
        Ouvrir le lien de la visio
      </a>
    }
  `,
})
export class BookingConfirmationPanel {
  readonly confirmation = input.required<BookingConfirmation>();
  readonly email = input.required<string>();

  private readonly _heading = viewChild.required<ElementRef<HTMLElement>>('heading');

  protected readonly when = computed(() => formatParisDateTime(this.confirmation().startsAt));
  protected readonly formatLabel = computed(
    () => BOOKING_FORMAT_LABELS[this.confirmation().format],
  );

  constructor() {
    afterNextRender({ write: () => this._heading().nativeElement.focus() });
  }
}
