import { Component, DestroyRef, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { BOOKING_GATEWAY } from '@features/booking/application';
import type { DisabledDate } from '@features/booking/domain';
import { getFrenchHolidays, getUnavailableReason } from '@shared/calendar';
import { ToastService } from '@shared/toast';

type CalendarDay = {
  readonly date: string;
  readonly dayNumber: number;
  readonly isCurrentMonth: boolean;
  readonly isToday: boolean;
  readonly isDisabled: boolean;
  readonly reason?: string;
  readonly isAutoBlocked: boolean;
  readonly autoBlockedReason?: string;
};

@Component({
  selector: 'app-admin-availability',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h1 class="text-2xl font-bold text-foreground mb-8">Disponibilités</h1>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div
        class="lg:col-span-2 bg-background border border-foreground/10 rounded-2xl p-6 shadow-lg"
      >
        <div class="flex items-center justify-between mb-6">
          <button
            (click)="previousMonth()"
            class="w-10 h-10 rounded-lg bg-foreground/5 border border-foreground/10 flex items-center justify-center hover:border-primary/50 hover:text-primary transition-colors"
            aria-label="Mois précédent"
          >
            <svg class="w-5 h-5" aria-hidden="true">
              <use href="/icons/sprite.svg#lucide-chevron-left" />
            </svg>
          </button>
          <h3 class="text-lg font-bold text-foreground capitalize">{{ monthLabel() }}</h3>
          <button
            (click)="nextMonth()"
            class="w-10 h-10 rounded-lg bg-foreground/5 border border-foreground/10 flex items-center justify-center hover:border-primary/50 hover:text-primary transition-colors"
            aria-label="Mois suivant"
          >
            <svg class="w-5 h-5" aria-hidden="true">
              <use href="/icons/sprite.svg#lucide-chevron-right" />
            </svg>
          </button>
        </div>

        <div class="grid grid-cols-7 gap-1 mb-2">
          @for (day of weekDays; track day) {
            <div class="text-center text-xs font-medium text-muted py-2">{{ day }}</div>
          }
        </div>

        <div class="grid grid-cols-7 gap-1">
          @for (day of daysGrid(); track day.date) {
            @if (day.isCurrentMonth) {
              <button
                (click)="toggleDate(day)"
                [class]="getDayClasses(day)"
                [title]="
                  day.isDisabled
                    ? 'Désactivé' + (day.reason ? ' : ' + day.reason : '')
                    : day.isAutoBlocked
                      ? 'Auto : ' + day.autoBlockedReason
                      : ''
                "
              >
                <span>{{ day.dayNumber }}</span>
                @if (day.isDisabled) {
                  <span class="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-400"></span>
                } @else if (day.isAutoBlocked) {
                  <span class="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-amber-400"></span>
                }
              </button>
            } @else {
              <div class="h-12"></div>
            }
          }
        </div>

        <div class="flex items-center gap-6 mt-4 pt-4 border-t border-foreground/10">
          <div class="flex items-center gap-2 text-xs text-muted">
            <span class="w-3 h-3 rounded bg-foreground/5 border border-foreground/10"></span>
            Disponible
          </div>
          <div class="flex items-center gap-2 text-xs text-muted">
            <span class="w-3 h-3 rounded bg-red-500/20 border border-red-500/30"></span>
            Désactivé
          </div>
          <div class="flex items-center gap-2 text-xs text-muted">
            <span class="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/30"></span>
            Weekend / Férié
          </div>
          <div class="flex items-center gap-2 text-xs text-muted">
            <span class="w-3 h-3 rounded bg-primary/10 border border-primary/30"></span>
            Aujourd'hui
          </div>
        </div>
      </div>

      <div class="space-y-6">
        @if (selectedDate()) {
          <div class="bg-background border border-foreground/10 rounded-2xl p-6 shadow-lg">
            <h3 class="text-sm font-semibold text-foreground mb-3">
              {{ formatDate(selectedDate()!) }}
            </h3>

            @if (isSelectedDisabled()) {
              <p class="text-sm text-red-400 mb-2">Cette date est désactivée</p>
              @if (selectedReason()) {
                <p class="text-xs text-muted mb-4">Raison : {{ selectedReason() }}</p>
              }
              <button
                (click)="enableDate()"
                class="w-full px-4 py-2 rounded-lg bg-green-500/10 text-green-400 text-sm font-medium hover:bg-green-500/20 transition-colors"
              >
                Réactiver cette date
              </button>
            } @else {
              <div class="space-y-3">
                <div>
                  <label for="reason" class="block text-xs font-medium text-muted mb-1.5">
                    Raison (optionnel)
                  </label>
                  <input
                    id="reason"
                    type="text"
                    [(ngModel)]="reasonInput"
                    class="w-full px-3 py-2 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground text-sm placeholder-muted focus:border-primary focus:outline-none transition-colors"
                    placeholder="Congé, formation..."
                  />
                </div>
                <button
                  (click)="disableDate()"
                  class="w-full px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
                >
                  Désactiver cette date
                </button>
              </div>
            }
          </div>
        } @else {
          <div class="bg-background border border-foreground/10 rounded-2xl p-6 shadow-lg">
            <p class="text-sm text-muted text-center">
              Cliquez sur une date pour la désactiver ou la réactiver
            </p>
          </div>
        }

        <div class="bg-background border border-foreground/10 rounded-2xl p-6 shadow-lg">
          <h3 class="text-sm font-semibold text-foreground mb-3">
            Dates désactivées ({{ disabledDates().length }})
          </h3>
          <div class="space-y-2 max-h-64 overflow-y-auto">
            @for (dd of disabledDates(); track dd.id) {
              <div
                class="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/10"
              >
                <div class="min-w-0">
                  <p class="text-xs font-medium text-foreground">{{ dd.date }}</p>
                  @if (dd.reason) {
                    <p class="text-xs text-muted truncate">{{ dd.reason }}</p>
                  }
                </div>
                <button
                  (click)="removeDate(dd)"
                  class="shrink-0 text-red-400 hover:text-red-300 transition-colors"
                  aria-label="Supprimer"
                >
                  <svg class="w-4 h-4" aria-hidden="true">
                    <use href="/icons/sprite.svg#lucide-x" />
                  </svg>
                </button>
              </div>
            } @empty {
              <p class="text-xs text-muted text-center py-4">Aucune date désactivée</p>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminAvailability {
  private readonly bookingGateway = inject(BOOKING_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly disabledDates = signal<readonly DisabledDate[]>([]);
  readonly currentMonth = signal(new Date());
  readonly selectedDate = signal<string | null>(null);
  reasonInput = '';

  readonly weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  readonly monthLabel = computed(() => {
    const date = this.currentMonth();
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  });

  readonly disabledDateSet = computed(() => {
    const map = new Map<string, DisabledDate>();
    for (const dd of this.disabledDates()) {
      map.set(dd.date, dd);
    }
    return map;
  });

  readonly isSelectedDisabled = computed(() => {
    const date = this.selectedDate();
    return date ? this.disabledDateSet().has(date) : false;
  });

  readonly selectedReason = computed(() => {
    const date = this.selectedDate();
    return date ? this.disabledDateSet().get(date)?.reason : undefined;
  });

  readonly daysGrid = computed(() => {
    const date = this.currentMonth();
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const disabled = this.disabledDateSet();
    const holidays = getFrenchHolidays(year);

    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const days: CalendarDay[] = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({
        date: `placeholder-${i}`,
        dayNumber: 0,
        isCurrentMonth: false,
        isToday: false,
        isDisabled: false,
        isAutoBlocked: false,
      });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dayDate = new Date(year, month, d);
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dd = disabled.get(dateString);
      const autoReason = getUnavailableReason(dayDate, holidays);
      days.push({
        date: dateString,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dayDate.getTime() === today.getTime(),
        isDisabled: !!dd,
        reason: dd?.reason,
        isAutoBlocked: !!autoReason,
        autoBlockedReason: autoReason ?? undefined,
      });
    }

    return days;
  });

  constructor() {
    this.loadDates();
  }

  previousMonth(): void {
    this.currentMonth.update((d) => {
      const n = new Date(d);
      n.setMonth(n.getMonth() - 1);
      return n;
    });
  }

  nextMonth(): void {
    this.currentMonth.update((d) => {
      const n = new Date(d);
      n.setMonth(n.getMonth() + 1);
      return n;
    });
  }

  toggleDate(day: CalendarDay): void {
    this.selectedDate.set(day.date);
    this.reasonInput = '';
  }

  disableDate(): void {
    const date = this.selectedDate();
    if (!date) return;

    const payload: Omit<DisabledDate, 'id'> = {
      date,
      reason: this.reasonInput || undefined,
    };

    this.bookingGateway.addDisabledDate(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.reasonInput = '';
        this.loadDates();
        this.toast.success('Date désactivée');
      },
      error: () => this.toast.error('Erreur lors de la désactivation'),
    });
  }

  enableDate(): void {
    const date = this.selectedDate();
    if (!date) return;

    const dd = this.disabledDateSet().get(date);
    if (!dd) return;

    this.bookingGateway.removeDisabledDate(dd.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loadDates();
        this.toast.success('Date réactivée');
      },
      error: () => this.toast.error('Erreur lors de la réactivation'),
    });
  }

  removeDate(dd: DisabledDate): void {
    this.bookingGateway.removeDisabledDate(dd.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loadDates();
        this.toast.success('Date supprimée');
      },
      error: () => this.toast.error('Erreur lors de la suppression'),
    });
  }

  private loadDates(): void {
    this.bookingGateway.getDisabledDates().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((dates) => this.disabledDates.set(dates));
  }

  formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  getDayClasses(day: CalendarDay): string {
    const base =
      'relative h-12 w-full rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center cursor-pointer';

    const selected = this.selectedDate() === day.date;

    if (selected && day.isDisabled) {
      return `${base} bg-red-500/30 text-red-300 ring-2 ring-red-400 shadow-lg`;
    }

    if (selected) {
      return `${base} bg-primary/20 text-primary ring-2 ring-primary shadow-lg shadow-primary/25`;
    }

    if (day.isDisabled) {
      return `${base} bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25`;
    }

    if (day.isAutoBlocked) {
      return `${base} bg-amber-500/10 text-amber-400/70 border border-amber-500/15 hover:bg-amber-500/20`;
    }

    if (day.isToday) {
      return `${base} bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20`;
    }

    return `${base} text-foreground hover:bg-foreground/5 hover:text-primary`;
  }
}
