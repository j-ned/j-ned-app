import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { form } from '@angular/forms/signals';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { settle } from '@shared/testing/settle';
import type { WeeklySlotsDraft } from '../availability-draft';
import { aWeeklySlotsDraft, halfHoursBetween } from '../testing/weekly-slots-draft-builder';
import { AdminWeekTemplate } from './admin-week-template';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const;
type DayLabel = (typeof DAYS)[number];

const timeOf = (halfHour: number): string =>
  `${String(Math.floor(halfHour / 2)).padStart(2, '0')}:${halfHour % 2 === 0 ? '00' : '30'}`;

const GRID_TIMES = Array.from({ length: 26 }, (_, offset) => timeOf(16 + offset));

const WEEK = aWeeklySlotsDraft({
  monday: [...halfHoursBetween('07:00', '09:00'), ...halfHoursBetween('14:00', '15:00')],
  tuesday: halfHoursBetween('18:00', '20:00'),
  sunday: halfHoursBetween('00:00', '24:00'),
});

@Component({
  imports: [AdminWeekTemplate],
  template: `<app-admin-week-template [slots]="slotsForm" />`,
})
class WeekHost {
  readonly draft = signal<WeeklySlotsDraft>(WEEK);
  readonly slotsForm = form(this.draft);
}

const collapsed = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/\s+/g, ' ').trim();

const all = (root: ParentNode, testId: string): readonly HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`),
];

const template = (host: HTMLElement): HTMLElement => byTestId(host, 'admin-week-template') ?? host;

const dayOptions = (host: HTMLElement): readonly HTMLElement[] =>
  all(template(host), 'filter-option');

const slotButtons = (host: HTMLElement): readonly HTMLElement[] =>
  all(template(host), 'admin-slot');

const pressedTimes = (host: HTMLElement): readonly string[] =>
  GRID_TIMES.filter(
    (_, index) => slotButtons(host)[index]?.getAttribute('aria-pressed') === 'true',
  );

const summary = (host: HTMLElement): readonly string[] =>
  all(template(host), 'admin-week-summary-day').map(collapsed);

async function render(): Promise<ComponentFixture<WeekHost>> {
  const fixture = TestBed.createComponent(WeekHost);
  await settle(fixture);
  return fixture;
}

async function chooseDay(fixture: ComponentFixture<WeekHost>, label: DayLabel): Promise<void> {
  dayOptions(fixture.nativeElement as HTMLElement)[DAYS.indexOf(label)]?.click();
  await settle(fixture);
}

async function clickSlot(fixture: ComponentFixture<WeekHost>, time: string): Promise<void> {
  slotButtons(fixture.nativeElement as HTMLElement)[GRID_TIMES.indexOf(time)]?.click();
  await settle(fixture);
}

describe('AdminWeekTemplate: choix du jour', () => {
  it('Given a week When the template renders Then the days are offered in a group « Jour de la semaine », Monday pressed, each with its number of half hours', async () => {
    const fixture = await render();
    const host = fixture.nativeElement as HTMLElement;

    expect({
      group: byTestId(template(host), 'filter-group')?.getAttribute('aria-label'),
      labels: dayOptions(host).map((option) => testIdText(option, 'filter-option-label')),
      counts: dayOptions(host).map((option) => testIdText(option, 'filter-option-count')),
      pressed: dayOptions(host).map((option) => option.getAttribute('aria-pressed')),
    }).toEqual({
      group: 'Jour de la semaine',
      labels: [...DAYS],
      counts: ['6', '4', '0', '0', '0', '0', '48'],
      pressed: ['true', 'false', 'false', 'false', 'false', 'false', 'false'],
    });
  });

  it('Given a week When the template renders Then the grid shows Monday, pressed on its half hours inside the grid only', async () => {
    const fixture = await render();
    const host = fixture.nativeElement as HTMLElement;

    expect({
      heading: testIdText(template(host), 'admin-slot-grid-heading'),
      slots: slotButtons(host).length,
      pressed: pressedTimes(host),
    }).toEqual({
      heading: 'Créneaux du lundi',
      slots: 26,
      pressed: ['08:00', '08:30', '14:00', '14:30'],
    });
  });

  it('Given Monday shown When Mardi is chosen Then Mardi alone is pressed and the grid shows the Tuesday half hours', async () => {
    const fixture = await render();
    const host = fixture.nativeElement as HTMLElement;

    await chooseDay(fixture, 'Mardi');

    expect({
      pressed: dayOptions(host).map((option) => option.getAttribute('aria-pressed')),
      heading: testIdText(template(host), 'admin-slot-grid-heading'),
      slots: pressedTimes(host),
      draft: fixture.componentInstance.draft(),
    }).toEqual({
      pressed: ['false', 'true', 'false', 'false', 'false', 'false', 'false'],
      heading: 'Créneaux du mardi',
      slots: ['18:00', '18:30', '19:00', '19:30'],
      draft: WEEK,
    });
  });

  it('Given Wednesday chosen When 10:00 is clicked Then the Wednesday of the draft holds it, the other days are untouched and its count reads 1', async () => {
    const fixture = await render();
    const host = fixture.nativeElement as HTMLElement;

    await chooseDay(fixture, 'Mercredi');
    await clickSlot(fixture, '10:00');

    expect({
      draft: fixture.componentInstance.draft(),
      count: testIdText(dayOptions(host)[2] ?? host, 'filter-option-count'),
      pressed: pressedTimes(host),
    }).toEqual({
      draft: { ...WEEK, wednesday: [20] },
      count: '1',
      pressed: ['10:00'],
    });
  });

  it('Given Monday holding 07:00–08:00 outside the grid When 08:00 is clicked off Then the outside half hours stay in the draft', async () => {
    const fixture = await render();

    await clickSlot(fixture, '08:00');

    expect(fixture.componentInstance.draft().monday).toEqual([14, 15, 17, 28, 29]);
  });
});

describe('AdminWeekTemplate: résumé', () => {
  it('Given a week When the summary renders Then it is a description list of the seven days, every half hour counted, outside the grid too', async () => {
    const fixture = await render();
    const host = fixture.nativeElement as HTMLElement;

    expect({
      tag: byTestId(template(host), 'admin-week-summary')?.tagName,
      days: summary(host),
    }).toEqual({
      tag: 'DL',
      days: [
        'Lundi : 07:00–09:00, 14:00–15:00',
        'Mardi : 18:00–20:00',
        'Mercredi : aucun créneau',
        'Jeudi : aucun créneau',
        'Vendredi : aucun créneau',
        'Samedi : aucun créneau',
        'Dimanche : 00:00–24:00',
      ],
    });
  });

  it('Given Tuesday chosen When 20:00 and 20:30 are clicked Then the Tuesday summary reads one range up to 21:00', async () => {
    const fixture = await render();

    await chooseDay(fixture, 'Mardi');
    await clickSlot(fixture, '20:00');
    await clickSlot(fixture, '20:30');

    expect(summary(fixture.nativeElement as HTMLElement)[1]).toBe('Mardi : 18:00–21:00');
  });

  it('Given the draft replaced from outside When the summary renders Then it follows the new week', async () => {
    const fixture = await render();

    fixture.componentInstance.draft.set(
      aWeeklySlotsDraft({ friday: halfHoursBetween('09:00', '10:00') }),
    );
    await settle(fixture);

    expect(summary(fixture.nativeElement as HTMLElement)).toEqual([
      'Lundi : aucun créneau',
      'Mardi : aucun créneau',
      'Mercredi : aucun créneau',
      'Jeudi : aucun créneau',
      'Vendredi : 09:00–10:00',
      'Samedi : aucun créneau',
      'Dimanche : aucun créneau',
    ]);
  });
});

describe('AdminWeekTemplate: plages hors de la grille', () => {
  it('Given a single day holding half hours outside the grid When the template renders Then they are reported as kept outside the grid', async () => {
    const fixture = await render();

    fixture.componentInstance.draft.set(
      aWeeklySlotsDraft({ monday: halfHoursBetween('07:00', '09:00') }),
    );
    await settle(fixture);

    expect(
      collapsed(byTestId(fixture.nativeElement as HTMLElement, 'admin-week-hidden-ranges')),
    ).toBe('Conservé hors de la grille : lundi 07:00–08:00.');
  });

  it('Given a whole Sunday alone When the template renders Then both runs outside the grid are reported on Sunday', async () => {
    const fixture = await render();

    fixture.componentInstance.draft.set(
      aWeeklySlotsDraft({ sunday: halfHoursBetween('00:00', '24:00') }),
    );
    await settle(fixture);

    expect(
      collapsed(byTestId(fixture.nativeElement as HTMLElement, 'admin-week-hidden-ranges')),
    ).toBe('Conservé hors de la grille : dimanche 00:00–08:00, 21:00–24:00.');
  });

  it('Given a week inside the grid When the template renders Then no range is reported outside it', async () => {
    const fixture = await render();

    fixture.componentInstance.draft.set(
      aWeeklySlotsDraft({ tuesday: halfHoursBetween('08:00', '21:00') }),
    );
    await settle(fixture);

    expect({
      hidden: byTestId(fixture.nativeElement as HTMLElement, 'admin-week-hidden-ranges'),
      summary: summary(fixture.nativeElement as HTMLElement)[1],
    }).toEqual({ hidden: null, summary: 'Mardi : 08:00–21:00' });
  });
});
