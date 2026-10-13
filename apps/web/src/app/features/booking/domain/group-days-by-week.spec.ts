import { describe, expect, it } from 'vitest';
import type { BookingDay } from './models/booking.model';
import { aBookingDay } from '../testing/booking-builders';
import { groupDaysByWeek } from './group-days-by-week';

const days = (...dates: readonly string[]): readonly BookingDay[] =>
  dates.map((date) => aBookingDay({ date }));

type WeekOutline = { readonly key: string; readonly label: string; readonly dates: string[] };

const outline = (dates: readonly string[]): WeekOutline[] =>
  groupDaysByWeek(days(...dates)).map((week) => ({
    key: week.key,
    label: week.label,
    dates: week.days.map((day) => day.date),
  }));

describe('groupDaysByWeek', () => {
  it('Given no bookable day When grouped Then there is no week', () => {
    expect(groupDaysByWeek([])).toEqual([]);
  });

  it('Given two days of the same ISO week When grouped Then one week keyed by its Monday carries the very same days', () => {
    const wednesday = aBookingDay({ date: '2026-10-21', label: 'mercredi 21 octobre' });
    const thursday = aBookingDay({ date: '2026-10-22', label: 'jeudi 22 octobre' });

    expect(groupDaysByWeek([wednesday, thursday])).toEqual([
      { key: '2026-10-19', label: 'Semaine du 19 octobre', days: [wednesday, thursday] },
    ]);
  });

  it.each([
    {
      case: 'a Sunday and the next Monday',
      dates: ['2026-10-25', '2026-10-26'],
      expected: [
        { key: '2026-10-19', label: 'Semaine du 19 octobre', dates: ['2026-10-25'] },
        { key: '2026-10-26', label: 'Semaine du 26 octobre', dates: ['2026-10-26'] },
      ],
    },
    {
      case: 'a week across two months',
      dates: ['2026-10-30', '2026-11-02'],
      expected: [
        { key: '2026-10-26', label: 'Semaine du 26 octobre', dates: ['2026-10-30'] },
        { key: '2026-11-02', label: 'Semaine du 2 novembre', dates: ['2026-11-02'] },
      ],
    },
    {
      case: 'a week across two years',
      dates: ['2026-12-31', '2027-01-01', '2027-01-04'],
      expected: [
        {
          key: '2026-12-28',
          label: 'Semaine du 28 décembre',
          dates: ['2026-12-31', '2027-01-01'],
        },
        { key: '2027-01-04', label: 'Semaine du 4 janvier', dates: ['2027-01-04'] },
      ],
    },
    {
      case: 'the spring shift week',
      dates: ['2027-03-26', '2027-03-28', '2027-03-29'],
      expected: [
        { key: '2027-03-22', label: 'Semaine du 22 mars', dates: ['2027-03-26', '2027-03-28'] },
        { key: '2027-03-29', label: 'Semaine du 29 mars', dates: ['2027-03-29'] },
      ],
    },
    {
      case: 'a week starting on the first of the month',
      dates: ['2027-02-03'],
      expected: [{ key: '2027-02-01', label: 'Semaine du 1er février', dates: ['2027-02-03'] }],
    },
    {
      case: 'a week without any free day in between',
      dates: ['2026-10-20', '2026-11-03'],
      expected: [
        { key: '2026-10-19', label: 'Semaine du 19 octobre', dates: ['2026-10-20'] },
        { key: '2026-11-02', label: 'Semaine du 2 novembre', dates: ['2026-11-03'] },
      ],
    },
  ])('Given $case When grouped Then weeks start on Monday', ({ dates, expected }) => {
    expect(outline(dates)).toEqual(expected);
  });
});
