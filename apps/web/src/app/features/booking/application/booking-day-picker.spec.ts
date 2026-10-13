import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { settle } from '@shared/testing/settle';
import { describe, expect, it } from 'vitest';
import type { BookingWeek } from '../domain/models/booking.model';
import { aBookingDay } from '../testing/booking-builders';
import { radioLabel, radiosOf } from '../testing/radio-label';
import { BookingDayPicker } from './booking-day-picker';

const WEEK: BookingWeek = {
  key: '2026-10-19',
  label: 'Semaine du 19 octobre',
  days: [
    aBookingDay({ date: '2026-10-19', label: 'lundi 19 octobre', shortLabel: 'lun. 19' }),
    aBookingDay({ date: '2026-10-21', label: 'mercredi 21 octobre', shortLabel: 'mer. 21' }),
  ],
};

type Bounds = { readonly hasPrevious: boolean; readonly hasNext: boolean };

type Rendered = {
  readonly fixture: ComponentFixture<BookingDayPicker>;
  readonly host: HTMLElement;
  readonly emitted: {
    readonly days: string[];
    readonly previous: number;
    readonly next: number;
  };
};

async function renderPicker(
  selectedDate: string | null = null,
  bounds: Bounds = { hasPrevious: false, hasNext: false },
): Promise<Rendered> {
  const fixture = TestBed.createComponent(BookingDayPicker);
  fixture.componentRef.setInput('week', WEEK);
  fixture.componentRef.setInput('selectedDate', selectedDate);
  fixture.componentRef.setInput('hasPrevious', bounds.hasPrevious);
  fixture.componentRef.setInput('hasNext', bounds.hasNext);
  const days: string[] = [];
  const counts = { previous: 0, next: 0 };
  fixture.componentInstance.daySelected.subscribe((date) => days.push(date));
  fixture.componentInstance.previousWeek.subscribe(() => counts.previous++);
  fixture.componentInstance.nextWeek.subscribe(() => counts.next++);
  await settle(fixture);
  return {
    fixture,
    host: fixture.nativeElement as HTMLElement,
    emitted: {
      days,
      get previous(): number {
        return counts.previous;
      },
      get next(): number {
        return counts.next;
      },
    },
  };
}

const legendOf = (radio: HTMLInputElement | undefined): string =>
  (radio?.closest('fieldset')?.querySelector('legend')?.textContent ?? '')
    .replace(/\s+/g, ' ')
    .trim();

describe('BookingDayPicker', () => {
  it('Given a week When rendered Then each free day is a native radio named by its full label, valued by its date', async () => {
    const { host } = await renderPicker();

    const radios = radiosOf(host, 'booking-day-option');

    expect(
      radios.map((radio) => ({
        name: radioLabel(radio),
        value: radio.value,
        checked: radio.checked,
      })),
    ).toEqual([
      { name: 'lundi 19 octobre', value: '2026-10-19', checked: false },
      { name: 'mercredi 21 octobre', value: '2026-10-21', checked: false },
    ]);
  });

  it('Given a week When rendered Then the day radios form one group named by the week', async () => {
    const { host } = await renderPicker();
    const radios = radiosOf(host, 'booking-day-option');
    const groupName = new Set(radios.map((radio) => radio.name));

    expect({
      sharedName: groupName.size === 1 && !groupName.has(''),
      legend: legendOf(radios[0]),
      sameFieldset: radios.every(
        (radio) => radio.closest('fieldset') === radios[0]?.closest('fieldset'),
      ),
      weekLabel: testIdText(host, 'booking-week-label'),
    }).toEqual({
      sharedName: true,
      legend: 'Semaine du 19 octobre',
      sameFieldset: true,
      weekLabel: 'Semaine du 19 octobre',
    });
  });

  it('Given a selected date When rendered Then only its radio is checked', async () => {
    const { host } = await renderPicker('2026-10-21');

    expect(radiosOf(host, 'booking-day-option').map((radio) => radio.checked)).toEqual([
      false,
      true,
    ]);
  });

  it('Given a week When the visitor picks a day Then the picker emits its date', async () => {
    const { fixture, host, emitted } = await renderPicker();

    radiosOf(host, 'booking-day-option')[1]?.click();
    await settle(fixture);

    expect(emitted.days).toEqual(['2026-10-21']);
  });

  it('Given both neighbouring weeks exist When the visitor moves Then each button emits once and neither is marked disabled', async () => {
    const { fixture, host, emitted } = await renderPicker(null, {
      hasPrevious: true,
      hasNext: true,
    });
    const previous = byTestId(host, 'booking-week-previous');
    const next = byTestId(host, 'booking-week-next');

    previous?.click();
    next?.click();
    await settle(fixture);

    expect({
      tags: [previous?.tagName, next?.tagName],
      types: [previous?.getAttribute('type'), next?.getAttribute('type')],
      disabled: [previous?.getAttribute('aria-disabled'), next?.getAttribute('aria-disabled')],
      emitted: [emitted.previous, emitted.next],
    }).toEqual({
      tags: ['BUTTON', 'BUTTON'],
      types: ['button', 'button'],
      disabled: [null, null],
      emitted: [1, 1],
    });
  });

  it('Given the first and last week at once When the visitor presses both buttons Then both stay focusable, marked disabled, and emit nothing', async () => {
    const { fixture, host, emitted } = await renderPicker();
    const previous = byTestId(host, 'booking-week-previous') as HTMLButtonElement | null;
    const next = byTestId(host, 'booking-week-next') as HTMLButtonElement | null;

    previous?.click();
    next?.click();
    await settle(fixture);

    expect({
      present: [previous !== null, next !== null],
      nativeDisabled: [previous?.disabled, next?.disabled],
      ariaDisabled: [previous?.getAttribute('aria-disabled'), next?.getAttribute('aria-disabled')],
      emitted: [emitted.previous, emitted.next],
    }).toEqual({
      present: [true, true],
      nativeDisabled: [false, false],
      ariaDisabled: ['true', 'true'],
      emitted: [0, 0],
    });
  });

  it('Given the week buttons When rendered Then each one is named for the direction it goes', async () => {
    const { host } = await renderPicker(null, { hasPrevious: true, hasNext: true });
    const nameOf = (testId: string): string => {
      const button = byTestId(host, testId);
      return (button?.getAttribute('aria-label') ?? button?.textContent ?? '')
        .replace(/\s+/g, ' ')
        .trim();
    };

    expect([nameOf('booking-week-previous'), nameOf('booking-week-next')]).toEqual([
      'Semaine précédente',
      'Semaine suivante',
    ]);
  });
});
