import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatLongDate } from '@features/booking/domain/paris-format';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';
import { LoadError } from '@shared/ui/load-error';
import type { LoadState } from '@shared/ui/load-state';
import { AppSkeleton } from '@shared/ui/skeleton';
import type { BookingWarning, CalendarMonthView } from '../calendar-month-view';
import { AdminMonthGrid } from './admin-month-grid';
import { AdminSectionHead } from './admin-section-head';

type MonthRequest = { readonly month: string; readonly focusDate: string | null };

@Component({
  selector: 'section[app-admin-availability-calendar]',
  imports: [RouterLink, AppIcon, Button, LoadError, AppSkeleton, AdminMonthGrid, AdminSectionHead],
  host: {
    'data-testid': 'admin-calendar',
    'aria-labelledby': 'admin-calendar-heading',
    class: 'block',
  },
  template: `
    <app-admin-section-head heading="Calendrier" headingId="admin-calendar-heading" />

    @switch (state()) {
      @case ('error') {
        <app-load-error
          message="Le calendrier n'a pas pu être chargé. Vérifiez votre connexion, puis réessayez."
          (retry)="retry.emit()"
        />
      }
      @case ('loading') {
        <div data-testid="admin-calendar-loading" role="status" class="mt-6">
          <span class="sr-only">Chargement du calendrier…</span>
          <app-skeleton class="block h-80 rounded-sm" />
        </div>
      }
      @default {
        @if (view(); as month) {
          <button
            appButton
            variant="outlined"
            type="button"
            data-testid="admin-calendar-holidays-toggle"
            class="mt-5 aria-disabled:cursor-wait aria-disabled:opacity-60 aria-pressed:border-primary"
            [attr.aria-pressed]="month.closePublicHolidays"
            [attr.aria-disabled]="holidaysSaving() ? 'true' : null"
            (click)="toggleHolidays(month.closePublicHolidays)"
          >
            @if (month.closePublicHolidays) {
              <app-icon name="check" [size]="16" />
            }
            Fermer les jours fériés
          </button>

          <div class="mt-4 flex items-center justify-between gap-3">
            <p
              id="admin-calendar-month-label"
              data-testid="admin-calendar-month-label"
              aria-live="polite"
              class="font-display text-lg font-bold font-stretch-106%"
            >
              {{ month.label }}
            </p>
            <div class="flex gap-2">
              <button
                appButton
                variant="outlined"
                type="button"
                data-testid="admin-calendar-previous"
                class="min-w-11 justify-center px-3 aria-disabled:cursor-not-allowed aria-disabled:opacity-40"
                [attr.aria-disabled]="month.previousMonth ? null : 'true'"
                (click)="showMonth(month.previousMonth)"
              >
                <app-icon name="chevron-left" [size]="14" />
                <span class="max-sm:sr-only">Mois précédent</span>
              </button>
              <button
                appButton
                variant="outlined"
                type="button"
                data-testid="admin-calendar-next"
                class="min-w-11 justify-center px-3 aria-disabled:cursor-not-allowed aria-disabled:opacity-40"
                [attr.aria-disabled]="month.nextMonth ? null : 'true'"
                (click)="showMonth(month.nextMonth)"
              >
                <span class="max-sm:sr-only">Mois suivant</span>
                <app-icon name="chevron-right" [size]="14" />
              </button>
            </div>
          </div>

          <app-admin-month-grid
            class="mt-4"
            [view]="month"
            [focusDate]="focusDate()"
            [busy]="busy()"
            [pending]="pending()"
            (dayActivated)="dayActivated.emit($event)"
            (monthRequested)="monthRequested.emit($event)"
          />

          <p data-testid="admin-calendar-status" role="status" class="mt-3 min-h-6 text-sm">
            {{ announcement() }}
            @if (warning(); as notice) {
              <span data-testid="admin-calendar-booking-warning" class="font-semibold">
                {{ notice.lead }} : annulez-{{ notice.pronoun }} depuis
                <a
                  data-testid="admin-calendar-booking-warning-link"
                  routerLink="/admin/rendez-vous"
                  class="text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-primary"
                  >Rendez-vous</a
                >
                si besoin.
              </span>
            }
          </p>

          <p
            id="admin-calendar-help"
            data-testid="admin-calendar-help"
            class="mt-3 text-sm text-muted"
          >
            Cliquez un jour, ou Entrée et Espace, pour le fermer ou le rouvrir. Flèches : jour
            voisin ; Page précédente et Page suivante : mois voisin.
          </p>

          <ul
            role="list"
            data-testid="admin-calendar-legend"
            class="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm"
          >
            <li
              data-testid="admin-calendar-legend-item"
              data-state="open"
              class="flex items-center gap-2"
            >
              <span
                aria-hidden="true"
                class="inline-flex size-6 items-center justify-center rounded-sm bg-primary/10 font-mono text-xs font-semibold text-primary"
                >4</span
              >
              Ouvert (créneaux)
            </li>
            <li
              data-testid="admin-calendar-legend-item"
              data-state="empty"
              class="flex items-center gap-2"
            >
              <span
                aria-hidden="true"
                class="inline-flex size-6 items-center justify-center rounded-sm text-muted"
                >—</span
              >
              Aucun créneau
            </li>
            <li
              data-testid="admin-calendar-legend-item"
              data-state="closed"
              class="flex items-center gap-2"
            >
              <span
                class="inline-flex size-6 items-center justify-center rounded-sm border border-dashed border-field bg-foreground/8 text-foreground"
              >
                <app-icon name="lock" [size]="12" />
              </span>
              Fermé
            </li>
            <li
              data-testid="admin-calendar-legend-item"
              data-state="holiday"
              class="flex items-center gap-2"
            >
              <span class="inline-flex size-6 items-center justify-center rounded-sm text-muted">
                <app-icon name="flag" [size]="12" />
              </span>
              Férié
            </li>
            <li
              data-testid="admin-calendar-legend-item"
              data-state="closed-period"
              class="flex items-center gap-2"
            >
              <span
                class="inline-flex size-6 items-center justify-center rounded-sm bg-status-warn/10 text-status-warn"
              >
                <app-icon name="calendar" [size]="12" />
              </span>
              Période
            </li>
            <li
              data-testid="admin-calendar-legend-item"
              data-state="past"
              class="flex items-center gap-2"
            >
              <span
                class="relative inline-flex size-6 rounded-sm before:absolute before:inset-x-1 before:top-1/2 before:h-0.5 before:-translate-y-1/2 before:bg-status-error"
              ></span>
              Passé
            </li>
          </ul>
        }
      }
    }
  `,
})
export class AdminAvailabilityCalendar {
  readonly view = input.required<CalendarMonthView | null>();
  readonly state = input.required<LoadState>();
  readonly busy = input(false);
  readonly focusDate = input<string | null>(null);
  readonly pending = input<ReadonlySet<string>>(new Set());
  readonly holidaysSaving = input(false);
  readonly announcement = input('');
  readonly bookingWarning = input<BookingWarning | null>(null);
  readonly monthRequested = output<MonthRequest>();
  readonly dayActivated = output<string>();
  readonly holidaysToggled = output<boolean>();
  readonly retry = output<void>();

  protected readonly warning = computed(() => {
    const warning = this.bookingWarning();
    if (warning === null) return null;
    const date = formatLongDate(warning.date);
    return warning.count === 1
      ? { lead: `1 rendez-vous reste prévu le ${date}`, pronoun: 'le' }
      : { lead: `${warning.count} rendez-vous restent prévus le ${date}`, pronoun: 'les' };
  });

  protected showMonth(month: string | null): void {
    if (month !== null) this.monthRequested.emit({ month, focusDate: null });
  }

  protected toggleHolidays(closed: boolean): void {
    if (!this.holidaysSaving()) this.holidaysToggled.emit(!closed);
  }
}
