import { Component, ChangeDetectionStrategy, inject, signal, viewChild } from '@angular/core';
import { BOOKING_GATEWAY } from '../domain';
import type { Booking as BookingModel, BookingFormData, DisabledDate } from '../domain/models';
import { BookingCalendar } from './booking-calendar';
import { BookingTimePicker } from './booking-time-picker';
import { BookingForm, type BookingFormPayload } from './booking-form';

@Component({
  selector: 'app-booking',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  imports: [BookingCalendar, BookingTimePicker, BookingForm],
  template: `
    <main class="min-h-screen pt-20 pb-16">
      <section class="container mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <header class="mb-12 text-center">
          <h1 class="text-4xl md:text-6xl font-bold mb-6 text-foreground">Réservation</h1>
          <p class="text-xl text-muted max-w-2xl mx-auto leading-relaxed">
            Choisissez un créneau qui vous convient pour un entretien téléphonique ou une discussion
            pour un projet.
          </p>
        </header>

        @defer (on viewport) {
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto items-stretch">
            <div class="flex flex-col gap-6">
              <app-booking-calendar
                [bookedSlots]="bookedSlots()"
                [disabledDates]="disabledDates()"
                (selectedDateChange)="onDateSelected($event)"
              />

              @if (selectedDate()) {
                <app-booking-time-picker
                  class="flex-1"
                  [date]="selectedDate()!"
                  [bookedSlots]="bookedSlots()"
                  (slotSelected)="onSlotSelected($event)"
                />
              }
            </div>

            <div class="flex flex-col">
              @if (selectedDate() && selectedSlot()) {
                <app-booking-form
                  class="flex-1"
                  [selectedDate]="selectedDate()!"
                  [selectedTime]="selectedSlot()!.time"
                  [selectedDuration]="selectedSlot()!.duration"
                  (formSubmitted)="onFormSubmitted($event)"
                />
              } @else {
                <div
                  class="bg-background/80 backdrop-blur-md border border-foreground/10 rounded-2xl p-8 shadow-lg flex flex-col items-center justify-center flex-1 text-center"
                >
                  <svg class="w-16 h-16 text-muted/30 mb-4" aria-hidden="true">
                    <use href="/icons/sprite.svg#lucide-calendar" />
                  </svg>
                  <p class="text-muted text-lg font-medium mb-2">Sélectionnez un créneau</p>
                  <p class="text-muted/60 text-sm max-w-xs">
                    Choisissez une date dans le calendrier puis un horaire pour accéder au
                    formulaire de réservation.
                  </p>
                </div>
              }
            </div>
          </div>
        } @placeholder {
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto items-stretch">
            <div
              class="h-96 bg-background/50 border border-foreground/10 rounded-2xl animate-pulse"
            ></div>
            <div
              class="h-96 bg-background/50 border border-foreground/10 rounded-2xl animate-pulse"
            ></div>
          </div>
        }
      </section>
    </main>
  `,
})
export class Booking {
  private readonly bookingGateway = inject(BOOKING_GATEWAY);
  private readonly bookingFormRef = viewChild(BookingForm);
  private readonly calendarRef = viewChild(BookingCalendar);

  readonly selectedDate = signal<string | null>(null);
  readonly selectedSlot = signal<{ time: string; duration: number } | null>(null);
  readonly bookedSlots = signal<readonly BookingModel[]>([]);
  readonly disabledDates = signal<readonly DisabledDate[]>([]);

  constructor() {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.loadBookedSlots(currentMonth);
    this.loadDisabledDates();
  }

  onDateSelected(date: string): void {
    this.selectedDate.set(date);
    this.selectedSlot.set(null);

    const month = date.substring(0, 7);
    this.loadBookedSlots(month);
  }

  onSlotSelected(slot: { time: string; duration: number }): void {
    this.selectedSlot.set(slot);
  }

  onFormSubmitted(payload: BookingFormPayload): void {
    const formRef = this.bookingFormRef();
    if (!formRef) return;

    const date = this.selectedDate();
    const slot = this.selectedSlot();
    if (!date || !slot) return;

    formRef.clearMessages();
    formRef.setSubmitting(true);

    const data: BookingFormData = {
      date,
      startTime: slot.time,
      duration: slot.duration,
      ...payload,
    };

    this.bookingGateway.submitBooking(data).subscribe({
      next: (result) => {
        formRef.setSubmitting(false);
        if (result.success) {
          formRef.setSuccess(result.message);
          this.selectedDate.set(null);
          this.selectedSlot.set(null);
          const calendarMonth =
            this.calendarRef()?.currentMonthString() ?? new Date().toISOString().substring(0, 7);
          this.loadBookedSlots(calendarMonth);
        } else {
          formRef.setError(result.message);
        }
      },
      error: () => {
        formRef.setSubmitting(false);
        formRef.setError('Une erreur est survenue. Veuillez réessayer.');
      },
    });
  }

  private loadBookedSlots(month: string): void {
    this.bookingGateway.getBookedSlots(month).subscribe((slots) => {
      this.bookedSlots.set(slots);
    });
  }

  private loadDisabledDates(): void {
    this.bookingGateway.getDisabledDates().subscribe((dates) => {
      this.disabledDates.set(dates);
    });
  }
}
