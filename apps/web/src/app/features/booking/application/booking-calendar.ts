import { Component, ChangeDetectionStrategy, computed, input, output, signal } from '@angular/core';
import type { Booking } from '../domain';

type CalendarDay = {
  readonly date: string;
  readonly dayNumber: number;
  readonly isCurrentMonth: boolean;
  readonly isPast: boolean;
  readonly isToday: boolean;
  readonly hasBooking: boolean;
};

@Component({
  selector: 'app-booking-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div
      class="bg-background/80 backdrop-blur-md border border-foreground/10 rounded-2xl p-6 shadow-lg"
    >
      <header class="flex items-center justify-between mb-6">
        <button
          (click)="previousMonth()"
          class="w-10 h-10 rounded-lg bg-foreground/5 border border-foreground/10 flex items-center justify-center hover:border-primary/50 hover:text-primary transition-colors"
          aria-label="Mois précédent"
        >
          <svg class="w-5 h-5" aria-hidden="true">
            <use href="/icons/sprite.svg#lucide-chevron-left" />
          </svg>
        </button>
        <h3 class="text-lg font-bold text-foreground">{{ monthLabel() }}</h3>
        <button
          (click)="nextMonth()"
          class="w-10 h-10 rounded-lg bg-foreground/5 border border-foreground/10 flex items-center justify-center hover:border-primary/50 hover:text-primary transition-colors"
          aria-label="Mois suivant"
        >
          <svg class="w-5 h-5" aria-hidden="true">
            <use href="/icons/sprite.svg#lucide-chevron-right" />
          </svg>
        </button>
      </header>

      <div class="grid grid-cols-7 gap-1 mb-2">
        @for (day of weekDays; track day) {
          <div class="text-center text-xs font-medium text-muted py-2">{{ day }}</div>
        }
      </div>

      <div class="grid grid-cols-7 gap-1">
        @for (day of daysGrid(); track day.date) {
          @if (day.isCurrentMonth) {
            <button
              [disabled]="day.isPast"
              (click)="selectDate(day.date)"
              [class]="getDayClasses(day)"
            >
              <span>{{ day.dayNumber }}</span>
              @if (day.hasBooking) {
                <span
                  class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent"
                ></span>
              }
            </button>
          } @else {
            <div class="h-10"></div>
          }
        }
      </div>
    </div>
  `,
})
export class BookingCalendar {
  readonly bookedSlots = input<readonly Booking[]>([]);
  readonly selectedDateChange = output<string>();

  readonly currentMonth = signal(new Date());
  readonly selectedDate = signal<string | null>(null);

  readonly weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  readonly monthLabel = computed(() => {
    const date = this.currentMonth();
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  });

  readonly currentMonthString = computed(() => {
    const d = this.currentMonth();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  readonly daysGrid = computed(() => {
    const date = this.currentMonth();
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bookedDates = new Set(this.bookedSlots().map((b) => b.date));

    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const days: CalendarDay[] = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({
        date: `placeholder-${i}`,
        dayNumber: 0,
        isCurrentMonth: false,
        isPast: false,
        isToday: false,
        hasBooking: false,
      });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dayDate = new Date(year, month, d);
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        date: dateString,
        dayNumber: d,
        isCurrentMonth: true,
        isPast: dayDate < today,
        isToday: dayDate.getTime() === today.getTime(),
        hasBooking: bookedDates.has(dateString),
      });
    }

    return days;
  });

  previousMonth(): void {
    this.currentMonth.update((d) => {
      const newDate = new Date(d);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  }

  nextMonth(): void {
    this.currentMonth.update((d) => {
      const newDate = new Date(d);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  }

  selectDate(date: string): void {
    this.selectedDate.set(date);
    this.selectedDateChange.emit(date);
  }

  getDayClasses(day: CalendarDay): string {
    const base =
      'relative h-10 w-full rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center';

    if (day.isPast) {
      return `${base} text-muted/40 cursor-not-allowed`;
    }

    if (this.selectedDate() === day.date) {
      return `${base} bg-primary-bg text-white ring-2 ring-primary shadow-lg shadow-primary/25`;
    }

    if (day.isToday) {
      return `${base} bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 cursor-pointer`;
    }

    return `${base} text-foreground hover:bg-foreground/5 hover:text-primary cursor-pointer`;
  }
}
