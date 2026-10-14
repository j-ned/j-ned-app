import { Component, computed, input, signal } from '@angular/core';
import { FormField, type FieldTree } from '@angular/forms/signals';
import { FilterGroup, type FilterOption } from '@shared/ui/filter-group';
import {
  AVAILABILITY_WEEKDAYS,
  hiddenRanges,
  summarizeSlots,
  type AvailabilityWeekday,
  type AvailabilityWeekdayKey,
  type WeeklySlotsDraft,
} from '../availability-draft';
import { AdminSlotGrid } from './admin-slot-grid';

const MONDAY = AVAILABILITY_WEEKDAYS[0] as AvailabilityWeekday;

@Component({
  selector: 'app-admin-week-template',
  imports: [FormField, FilterGroup, AdminSlotGrid],
  host: {
    'data-testid': 'admin-week-template',
    class: 'grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_17rem]',
  },
  template: `
    <div class="grid min-w-0 content-start gap-6">
      <app-filter-group label="Jour de la semaine" [options]="dayOptions()" [(active)]="dayKey" />
      <app-admin-slot-grid [day]="day()" [formField]="slots()[dayKey()]" />
    </div>
    <div class="min-w-0">
      <h3 class="mb-3 font-display text-base font-bold font-stretch-104%">Récapitulatif</h3>
      <dl data-testid="admin-week-summary" class="border-t border-line text-sm">
        @for (line of summary(); track line.key) {
          <div
            data-testid="admin-week-summary-day"
            class="flex flex-wrap gap-x-2 border-b border-line py-2"
          >
            <dt class="font-semibold">{{ line.label }}&nbsp;:</dt>
            <dd [class]="line.ranges ? 'font-mono tabular-nums' : 'text-muted'">
              {{ line.ranges || 'aucun créneau' }}
            </dd>
          </div>
        }
      </dl>
      @if (hiddenNotice(); as notice) {
        <p
          data-testid="admin-week-hidden-ranges"
          class="mt-4 border-l-2 border-line-strong pl-3 text-sm text-muted"
        >
          Conservé hors de la grille&nbsp;: {{ notice }}.
        </p>
      }
    </div>
  `,
})
export class AdminWeekTemplate {
  readonly slots = input.required<FieldTree<WeeklySlotsDraft>>();

  protected readonly dayKey = signal<AvailabilityWeekdayKey>(MONDAY.key);
  protected readonly day = computed(
    () => AVAILABILITY_WEEKDAYS.find(({ key }) => key === this.dayKey()) ?? MONDAY,
  );

  private readonly week = computed(() => this.slots()().value());

  protected readonly dayOptions = computed((): readonly FilterOption<AvailabilityWeekdayKey>[] =>
    AVAILABILITY_WEEKDAYS.map(({ key, label }) => ({
      value: key,
      label,
      count: this.week()[key].length,
    })),
  );

  protected readonly summary = computed(() =>
    AVAILABILITY_WEEKDAYS.map(({ key, label }) => ({
      key,
      label,
      ranges: summarizeSlots(this.week()[key]),
    })),
  );

  protected readonly hiddenNotice = computed(() =>
    hiddenRanges(this.week())
      .map(({ label, ranges }) => `${label.toLowerCase()} ${ranges}`)
      .join(' ; '),
  );
}
