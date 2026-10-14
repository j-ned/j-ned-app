import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormField, form } from '@angular/forms/signals';
import { accessibleName } from '@shared/testing/accessible-name';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { settle } from '@shared/testing/settle';
import { AVAILABILITY_WEEKDAYS, type AvailabilityWeekday } from '../availability-draft';
import { aWeeklySlotsDraft } from '../testing/weekly-slots-draft-builder';
import { AdminSlotGrid } from './admin-slot-grid';

const TUESDAY = AVAILABILITY_WEEKDAYS[1] as AvailabilityWeekday;
const SUNDAY = AVAILABILITY_WEEKDAYS[6] as AvailabilityWeekday;

const timeOf = (halfHour: number): string =>
  `${String(Math.floor(halfHour / 2)).padStart(2, '0')}:${halfHour % 2 === 0 ? '00' : '30'}`;

const GRID_TIMES = Array.from({ length: 26 }, (_, offset) => timeOf(16 + offset));

const slots = (host: HTMLElement): readonly HTMLButtonElement[] => [
  ...host.querySelectorAll<HTMLButtonElement>('[data-testid="admin-slot"]'),
];

const slotAt = (host: HTMLElement, time: string): HTMLButtonElement | null =>
  slots(host)[GRID_TIMES.indexOf(time)] ?? null;

const pressedTimes = (host: HTMLElement): readonly string[] =>
  GRID_TIMES.filter((_, index) => slots(host)[index]?.getAttribute('aria-pressed') === 'true');

async function click(fixture: ComponentFixture<unknown>, ...times: string[]): Promise<void> {
  for (const time of times) {
    slotAt(fixture.nativeElement as HTMLElement, time)?.click();
    await settle(fixture);
  }
}

describe('AdminSlotGrid', () => {
  async function render(
    value: readonly number[],
    day: AvailabilityWeekday = TUESDAY,
  ): Promise<ComponentFixture<AdminSlotGrid>> {
    const fixture = TestBed.createComponent(AdminSlotGrid);
    fixture.componentRef.setInput('day', day);
    fixture.componentRef.setInput('value', value);
    await settle(fixture);
    return fixture;
  }

  it('Given a day When the grid renders Then it shows 26 buttons from 08:00 to 20:30, each named after the half hour it covers', async () => {
    const fixture = await render([]);
    const host = fixture.nativeElement as HTMLElement;

    expect({
      count: slots(host).length,
      types: [...new Set(slots(host).map((slot) => slot.type))],
      first: accessibleName(slots(host)[0] ?? host, host),
      last: accessibleName(slots(host)[25] ?? host, host),
      names: slots(host).map((slot) => accessibleName(slot, host)),
    }).toEqual({
      count: 26,
      types: ['button'],
      first: '08:00 à 08:30',
      last: '20:30 à 21:00',
      names: GRID_TIMES.map((time, index) => `${time} à ${timeOf(17 + index)}`),
    });
  });

  it('Given Tuesday When the grid renders Then its buttons form a group named by the heading « Créneaux du mardi »', async () => {
    const fixture = await render([]);
    const host = fixture.nativeElement as HTMLElement;
    const group = byTestId(host, 'admin-slot-grid');
    const heading = byTestId(host, 'admin-slot-grid-heading');

    expect({
      role: group?.getAttribute('role'),
      name: group ? accessibleName(group, host) : null,
      heading: testIdText(host, 'admin-slot-grid-heading'),
      level: heading?.tagName,
      inGroup: slots(host).every((slot) => group?.contains(slot) ?? false),
    }).toEqual({
      role: 'group',
      name: 'Créneaux du mardi',
      heading: 'Créneaux du mardi',
      level: 'H3',
      inGroup: true,
    });
  });

  it('Given the day changes to Sunday When the grid renders Then the heading follows', async () => {
    const fixture = await render([]);

    fixture.componentRef.setInput('day', SUNDAY);
    await settle(fixture);

    expect(testIdText(fixture.nativeElement as HTMLElement, 'admin-slot-grid-heading')).toBe(
      'Créneaux du dimanche',
    );
  });

  it('Given a value holding 18:00 to 19:00 and half hours outside the grid When the grid renders Then only 18:00 and 18:30 are pressed', async () => {
    const fixture = await render([14, 15, 36, 37, 44]);
    const host = fixture.nativeElement as HTMLElement;

    expect({
      pressed: pressedTimes(host),
      states: [...new Set(slots(host).map((slot) => slot.getAttribute('aria-pressed')))].sort(),
    }).toEqual({ pressed: ['18:00', '18:30'], states: ['false', 'true'] });
  });

  it('Given the grid When it is reached by keyboard Then every half hour is a native, enabled tab stop', async () => {
    const fixture = await render([36]);
    const host = fixture.nativeElement as HTMLElement;

    expect({
      tags: [...new Set(slots(host).map((slot) => slot.tagName))],
      tabindex: slots(host).filter((slot) => slot.getAttribute('tabindex') !== null).length,
      disabled: slots(host).filter((slot) => slot.disabled).length,
      ariaDisabled: slots(host).filter((slot) => slot.getAttribute('aria-disabled') !== null)
        .length,
    }).toEqual({ tags: ['BUTTON'], tabindex: 0, disabled: 0, ariaDisabled: 0 });
  });

  it.each([
    { case: 'one half hour switched on', start: [], clicks: ['18:00'], value: [36] },
    {
      case: 'a half hour switched on before the others',
      start: [36, 37],
      clicks: ['08:00'],
      value: [16, 36, 37],
    },
    { case: 'a half hour switched off', start: [36, 37, 38], clicks: ['18:30'], value: [36, 38] },
    {
      case: 'a half hour switched on then off',
      start: [36],
      clicks: ['20:30', '20:30'],
      value: [36],
    },
    {
      case: 'the grid edited while half hours outside it are held',
      start: [14, 15, 44],
      clicks: ['08:00', '20:30'],
      value: [14, 15, 16, 41, 44],
    },
  ])(
    'Given $start When $case Then the value is $value, as a new sorted list',
    async ({ start, clicks, value }) => {
      const initial = [...start];
      const fixture = await render(initial);

      await click(fixture, ...clicks);

      expect({
        value: fixture.componentInstance.value(),
        pressed: pressedTimes(fixture.nativeElement as HTMLElement),
        initial,
      }).toEqual({
        value,
        pressed: value.filter((halfHour) => halfHour >= 16 && halfHour <= 41).map(timeOf),
        initial: start,
      });
    },
  );
});

@Component({
  imports: [AdminSlotGrid, FormField],
  template: `<app-admin-slot-grid [day]="day" [formField]="slotsForm.tuesday" />`,
})
class SlotsFieldHost {
  readonly day = TUESDAY;
  readonly draft = signal(aWeeklySlotsDraft({ monday: [20], tuesday: [36, 37] }));
  readonly slotsForm = form(this.draft);
}

describe('AdminSlotGrid: bound by [formField]', () => {
  async function renderHost(): Promise<ComponentFixture<SlotsFieldHost>> {
    const fixture = TestBed.createComponent(SlotsFieldHost);
    await settle(fixture);
    return fixture;
  }

  it('Given a form whose Tuesday holds 18:00 to 19:00 When the field renders Then 18:00 and 18:30 are pressed', async () => {
    const fixture = await renderHost();

    expect(pressedTimes(fixture.nativeElement as HTMLElement)).toEqual(['18:00', '18:30']);
  });

  it('Given the bound field When 19:00 is clicked Then the Tuesday of the form holds it and Monday is untouched', async () => {
    const fixture = await renderHost();

    await click(fixture, '19:00');

    expect(fixture.componentInstance.draft()).toEqual(
      aWeeklySlotsDraft({ monday: [20], tuesday: [36, 37, 38] }),
    );
  });

  it('Given the bound field When the form model is replaced Then the pressed half hours follow it', async () => {
    const fixture = await renderHost();

    fixture.componentInstance.draft.set(aWeeklySlotsDraft({ tuesday: [16, 41] }));
    await settle(fixture);

    expect(pressedTimes(fixture.nativeElement as HTMLElement)).toEqual(['08:00', '20:30']);
  });
});
