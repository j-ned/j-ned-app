import {
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  input,
  linkedSignal,
  output,
  viewChildren,
} from '@angular/core';
import { AppIcon } from '@shared/icons/app-icon';
import { nextCalendarDate } from '../calendar-keyboard';
import type { CalendarCell, CalendarMonthView } from '../calendar-month-view';

export type CalendarMonthRequest = { readonly month: string; readonly focusDate: string };

const WEEKDAYS = [
  { abbr: 'lundi', short: 'lun.' },
  { abbr: 'mardi', short: 'mar.' },
  { abbr: 'mercredi', short: 'mer.' },
  { abbr: 'jeudi', short: 'jeu.' },
  { abbr: 'vendredi', short: 'ven.' },
  { abbr: 'samedi', short: 'sam.' },
  { abbr: 'dimanche', short: 'dim.' },
] as const;

const cellsOf = (view: CalendarMonthView): readonly CalendarCell[] =>
  view.weeks.flat().filter((cell): cell is CalendarCell => cell !== null);

const inView = (view: CalendarMonthView, date: string | null): date is string =>
  date !== null && cellsOf(view).some((cell) => cell.date === date);

const defaultTabStop = (view: CalendarMonthView): string | null => {
  const cells = cellsOf(view);
  return (cells.find((cell) => cell.today) ?? cells[0])?.date ?? null;
};

// Sous `sm`, seul ce qui tient dans 44 px reste visible : le nombre de créneaux, le tiret ou l'icône.
function splitShortLabel({ state, shortLabel }: CalendarCell): {
  readonly compact: string;
  readonly rest: string;
} {
  if (state === 'empty') return { compact: shortLabel, rest: '' };
  if (state !== 'open') return { compact: '', rest: shortLabel };
  const space = shortLabel.indexOf(' ');
  return { compact: shortLabel.slice(0, space), rest: shortLabel.slice(space) };
}

@Component({
  selector: 'app-admin-month-grid',
  imports: [AppIcon],
  host: { class: 'block' },
  template: `
    <table
      data-testid="admin-calendar-grid"
      role="grid"
      aria-labelledby="admin-calendar-month-label"
      aria-describedby="admin-calendar-help"
      [attr.aria-busy]="busy() ? 'true' : null"
      class="w-full table-fixed border-separate border-spacing-0.5 transition-opacity aria-busy:opacity-60 sm:border-spacing-1"
    >
      <thead>
        <tr>
          @for (weekday of weekdays; track weekday.abbr) {
            <th scope="col" [attr.abbr]="weekday.abbr" class="table-head pt-0 text-center">
              {{ weekday.short }}
            </th>
          }
        </tr>
      </thead>
      <tbody>
        @for (week of rows(); track $index) {
          <tr>
            @for (cell of week; track $index) {
              <td role="gridcell" class="p-0 align-top">
                @if (cell) {
                  <button
                    #day
                    type="button"
                    data-testid="admin-calendar-day"
                    [attr.data-state]="cell.state"
                    [attr.data-date]="cell.date"
                    [attr.data-pending]="pending().has(cell.date) ? 'true' : null"
                    [attr.aria-label]="cell.label"
                    [attr.aria-disabled]="cell.actionable ? null : 'true'"
                    [attr.aria-current]="cell.today ? 'date' : null"
                    [attr.tabindex]="cell.date === activeDate() ? 0 : -1"
                    (click)="activate(cell)"
                    (focus)="activeDate.set(cell.date)"
                    (keydown)="move($event)"
                    class="flex min-h-11 w-full cursor-pointer flex-col items-center justify-center gap-0.5 rounded-md border border-transparent px-0.5 py-1 text-sm leading-tight transition data-pending:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-disabled:cursor-default aria-[current=date]:ring-2 aria-[current=date]:ring-foreground sm:min-h-16 sm:items-start sm:justify-between sm:p-2 hover:not-aria-disabled:border-primary data-[state=closed]:border-dashed data-[state=closed]:border-field data-[state=closed]:bg-foreground/8 data-[state=closed]:text-foreground data-[state=closed-period]:bg-status-warn/10 data-[state=closed-period]:text-status-warn data-[state=empty]:text-muted data-[state=holiday]:text-muted data-[state=open]:bg-primary/10 data-[state=open]:text-primary data-[state=past]:text-status-error data-[state=past]:line-through"
                  >
                    <span class="font-mono font-semibold tabular-nums">{{ cell.dayOfMonth }}</span>
                    <span class="inline-flex items-center gap-1 text-xs">
                      @if (cell.icon) {
                        <app-icon [name]="cell.icon" [size]="12" />
                      } @else if (cell.reopenedHoliday) {
                        <app-icon name="flag" [size]="10" />
                      }
                      {{ cell.compact }}<span class="max-sm:sr-only">{{ cell.rest }}</span>
                    </span>
                  </button>
                }
              </td>
            }
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class AdminMonthGrid {
  readonly view = input.required<CalendarMonthView>();
  readonly focusDate = input<string | null>(null);
  readonly busy = input(false);
  readonly pending = input<ReadonlySet<string>>(new Set());
  readonly dayActivated = output<string>();
  readonly monthRequested = output<CalendarMonthRequest>();

  private readonly _days = viewChildren<ElementRef<HTMLButtonElement>>('day');

  protected readonly weekdays = WEEKDAYS;

  protected readonly rows = computed(() =>
    this.view().weeks.map((week) =>
      week.map((cell) => cell && { ...cell, ...splitShortLabel(cell) }),
    ),
  );

  protected readonly activeDate = linkedSignal<
    { readonly view: CalendarMonthView; readonly focusDate: string | null },
    string | null
  >({
    source: () => ({ view: this.view(), focusDate: this.focusDate() }),
    computation: ({ view, focusDate }, previous) => {
      if (inView(view, focusDate)) return focusDate;
      const kept = previous?.value ?? null;
      if (previous?.source.view.month === view.month && inView(view, kept)) return kept;
      return defaultTabStop(view);
    },
  });

  // Un objet neuf par demande : la même date redemandée doit reprendre le focus.
  private readonly _focusRequest = linkedSignal<{ readonly date: string } | null>(() => {
    const focusDate = this.focusDate();
    return inView(this.view(), focusDate) ? { date: focusDate } : null;
  });

  private readonly _focusEffect = afterRenderEffect({
    write: () => {
      const date = this._focusRequest()?.date;
      if (date === undefined) return;
      this._days()
        .find((day) => day.nativeElement.dataset['date'] === date)
        ?.nativeElement.focus();
    },
  });

  protected activate(cell: CalendarCell): void {
    if (cell.actionable) this.dayActivated.emit(cell.date);
  }

  // Part de la date active : en répétition clavier, les touches devancent le focus.
  protected move(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const from = this.activeDate();
    const target = from === null ? null : nextCalendarDate(from, event.key);
    if (target === null) return;
    event.preventDefault();
    const view = this.view();
    const month = target.slice(0, 7);
    if (month === view.month) {
      this.activeDate.set(target);
      this._focusRequest.set({ date: target });
      return;
    }
    if (month === view.previousMonth || month === view.nextMonth) {
      this.monthRequested.emit({ month, focusDate: target });
    }
  }
}
