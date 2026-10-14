import { Component, computed, input, model } from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import { AppIcon } from '@shared/icons/app-icon';
import { SLOT_GRID, toSlotTime, toggleSlot, type AvailabilityWeekday } from '../availability-draft';

@Component({
  selector: 'app-admin-slot-grid',
  imports: [AppIcon],
  host: { class: 'block' },
  template: `
    <div data-testid="admin-slot-grid" role="group" [attr.aria-labelledby]="headingId()">
      <h3
        data-testid="admin-slot-grid-heading"
        [id]="headingId()"
        class="mb-3 font-display text-base font-bold font-stretch-104%"
      >
        {{ heading() }}
      </h3>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2">
        @for (slot of slots(); track slot.index) {
          <button
            type="button"
            data-testid="admin-slot"
            [attr.aria-pressed]="slot.on"
            (click)="toggle(slot.index)"
            class="inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-field bg-surface px-1.5 font-mono text-sm tabular-nums text-foreground transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-pressed:border-primary-bg aria-pressed:bg-primary-bg aria-pressed:font-semibold aria-pressed:text-white"
          >
            @if (slot.on) {
              <app-icon name="check" [size]="12" />
            }
            {{ slot.start }}<span class="sr-only"> à {{ slot.end }}</span>
          </button>
        }
      </div>
    </div>
  `,
})
export class AdminSlotGrid implements FormValueControl<readonly number[]> {
  readonly day = input.required<AvailabilityWeekday>();
  readonly value = model<readonly number[]>([]);

  protected readonly heading = computed(() => `Créneaux du ${this.day().label.toLowerCase()}`);
  protected readonly headingId = computed(() => `admin-slot-grid-heading-${this.day().key}`);

  protected readonly slots = computed(() => {
    const selected = new Set(this.value());
    return SLOT_GRID.map((index) => ({
      index,
      start: toSlotTime(index),
      end: toSlotTime(index + 1),
      on: selected.has(index),
    }));
  });

  protected toggle(index: number): void {
    this.value.update((slots) => toggleSlot(slots, index));
  }
}
