import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BOOKING_GATEWAY } from './tokens';
import type { Booking as BookingModel, BookingFormData, DisabledDate } from '../domain/models';
import { BookingCalendar } from './booking-calendar';
import { BookingTimePicker } from './booking-time-picker';
import { BookingForm, type BookingFormPayload } from './booking-form';
import { ToastService } from '@shared/toast';

@Component({
  selector: 'app-booking',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  imports: [BookingCalendar, BookingTimePicker, BookingForm],
  template: `
    <main class="min-h-screen pt-20 pb-16">
      <section class="container mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <header class="text-center mb-14">
          <span
            class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest mb-5"
          >
            <svg aria-hidden="true" class="w-4 h-4">
              <use href="/icons/sprite.svg#lucide-calendar"></use>
            </svg>
            Rendez-vous
          </span>
          <h1
            class="text-4xl md:text-6xl font-extrabold tracking-tight mb-5"
            style="background: linear-gradient(135deg, var(--color-foreground) 40%, var(--color-primary) 100%); background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent;"
          >
            Réservation
          </h1>
          <p class="text-muted max-w-xl mx-auto text-base md:text-lg leading-relaxed">
            Choisissez un créneau qui vous convient pour un entretien téléphonique ou une discussion
            pour un projet.
          </p>
        </header>

        @defer (on viewport) {
          <div class="max-w-5xl mx-auto space-y-6">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              <app-booking-calendar
                [bookedSlots]="bookedSlots()"
                [disabledDates]="disabledDates()"
                (selectedDateChange)="onDateSelected($event)"
              />

              @if (selectedDate()) {
                <app-booking-time-picker
                  [date]="selectedDate()!"
                  [bookedSlots]="bookedSlots()"
                  (slotSelected)="onSlotSelected($event)"
                />
              } @else {
                <div
                  class="bg-background/80 backdrop-blur-md border border-foreground/10 rounded-2xl p-8 shadow-lg flex flex-col items-center justify-center h-full text-center"
                >
                  <svg class="w-16 h-16 text-muted/30 mb-4" aria-hidden="true">
                    <use href="/icons/sprite.svg#lucide-calendar" />
                  </svg>
                  <p class="text-muted text-lg font-medium mb-2">Sélectionnez une date</p>
                  <p class="text-muted/60 text-sm max-w-xs">
                    Choisissez une date dans le calendrier pour voir les créneaux disponibles.
                  </p>
                </div>
              }
            </div>

            @if (selectedDate() && selectedSlot()) {
              <app-booking-form
                [selectedDate]="selectedDate()!"
                [selectedTime]="selectedSlot()!.time"
                [selectedDuration]="selectedSlot()!.duration"
                (formSubmitted)="onFormSubmitted($event)"
              />
            }
          </div>
        } @placeholder {
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
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
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
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

    formRef.setSubmitting(true);

    const data: BookingFormData = {
      date,
      startTime: slot.time,
      duration: slot.duration,
      ...payload,
    };

    this.bookingGateway
      .submitBooking(data)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          formRef.setSubmitting(false);
          if (result.success) {
            this.toast.success(result.message);
            this.selectedDate.set(null);
            this.selectedSlot.set(null);
            formRef.resetForm();
            const calendarMonth =
              this.calendarRef()?.currentMonthString() ?? new Date().toISOString().substring(0, 7);
            this.loadBookedSlots(calendarMonth);
          } else {
            this.toast.error(result.message);
          }
        },
        error: () => {
          formRef.setSubmitting(false);
        },
      });
  }

  private loadBookedSlots(month: string): void {
    this.bookingGateway
      .getBookedSlots(month)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((slots) => {
        this.bookedSlots.set(slots);
      });
  }

  private loadDisabledDates(): void {
    this.bookingGateway
      .getDisabledDates()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((dates) => {
        this.disabledDates.set(dates);
      });
  }
}
