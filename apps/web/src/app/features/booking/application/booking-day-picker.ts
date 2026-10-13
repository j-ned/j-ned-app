import { Component, input, output } from '@angular/core';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';
import type { BookingWeek } from '../domain/models/booking.model';

@Component({
  selector: 'app-booking-day-picker',
  imports: [AppIcon, Button],
  host: { class: 'relative block', 'data-testid': 'booking-day-picker' },
  template: `
    <div class="absolute top-0 right-0 flex gap-2">
      <button
        appButton
        variant="outlined"
        size="icon"
        type="button"
        class="aria-disabled:cursor-not-allowed aria-disabled:opacity-40"
        aria-label="Semaine précédente"
        data-testid="booking-week-previous"
        [attr.aria-disabled]="hasPrevious() ? null : 'true'"
        (click)="showPrevious()"
      >
        <app-icon name="chevron-left" [size]="16" />
      </button>
      <button
        appButton
        variant="outlined"
        size="icon"
        type="button"
        class="aria-disabled:cursor-not-allowed aria-disabled:opacity-40"
        aria-label="Semaine suivante"
        data-testid="booking-week-next"
        [attr.aria-disabled]="hasNext() ? null : 'true'"
        (click)="showNext()"
      >
        <app-icon name="chevron-right" [size]="16" />
      </button>
    </div>
    <fieldset>
      <legend
        data-testid="booking-week-label"
        class="mb-4 py-2.5 pr-28 font-display text-lg font-bold font-stretch-110%"
      >
        {{ week().label }}
      </legend>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2.5">
        @for (day of week().days; track day.date) {
          <label
            class="relative flex min-h-16 cursor-pointer items-center justify-center rounded-md border border-field px-3 py-2.5 text-center font-semibold tabular-nums transition-colors hover:border-primary has-checked:border-primary-bg has-checked:bg-primary-bg has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary"
          >
            <input
              type="radio"
              name="booking-day"
              class="sr-only"
              data-testid="booking-day-option"
              [value]="day.date"
              [checked]="day.date === selectedDate()"
              (change)="daySelected.emit(day.date)"
            />
            <span aria-hidden="true">{{ day.shortLabel }}</span>
            <span class="sr-only">{{ day.label }}</span>
          </label>
        }
      </div>
    </fieldset>
  `,
})
export class BookingDayPicker {
  readonly week = input.required<BookingWeek>();
  readonly selectedDate = input<string | null>(null);
  readonly hasPrevious = input(false);
  readonly hasNext = input(false);
  readonly daySelected = output<string>();
  readonly previousWeek = output<void>();
  readonly nextWeek = output<void>();

  protected showPrevious(): void {
    if (this.hasPrevious()) this.previousWeek.emit();
  }

  protected showNext(): void {
    if (this.hasNext()) this.nextWeek.emit();
  }
}
