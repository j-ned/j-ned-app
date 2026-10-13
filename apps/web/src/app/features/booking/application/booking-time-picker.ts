import { Component, input } from '@angular/core';
import { FormField, type FieldTree } from '@angular/forms/signals';
import type { BookingDay } from '../domain/models/booking.model';

@Component({
  selector: 'app-booking-time-picker',
  imports: [FormField],
  host: { class: 'block', 'data-testid': 'booking-time-picker' },
  template: `
    <fieldset>
      <legend
        class="mb-4 py-2.5 font-display text-lg font-bold font-stretch-110% first-letter:uppercase"
      >
        {{ day().label }}
      </legend>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2.5">
        @for (slot of day().slots; track slot.startsAt) {
          <label
            class="relative flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-field px-3 py-2 font-mono text-[0.9375rem] font-medium tabular-nums transition-colors hover:border-primary has-checked:border-primary-bg has-checked:bg-primary-bg has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary"
          >
            <input
              type="radio"
              class="sr-only"
              data-testid="booking-time-option"
              [value]="slot.startsAt"
              [formField]="field()"
            />{{ slot.timeLabel }}
          </label>
        }
      </div>
    </fieldset>
  `,
})
export class BookingTimePicker {
  readonly day = input.required<BookingDay>();
  readonly field = input.required<FieldTree<string>>();
}
