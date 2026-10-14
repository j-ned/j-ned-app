import { describe, expect, it } from 'vitest';
import { nextCalendarDate } from './calendar-keyboard';

describe('nextCalendarDate', () => {
  it.each([
    { key: 'ArrowRight', date: '2026-11-12', expected: '2026-11-13', when: 'next day' },
    { key: 'ArrowRight', date: '2026-11-30', expected: '2026-12-01', when: 'into the next month' },
    { key: 'ArrowRight', date: '2026-12-31', expected: '2027-01-01', when: 'into the next year' },
    { key: 'ArrowLeft', date: '2026-11-12', expected: '2026-11-11', when: 'previous day' },
    {
      key: 'ArrowLeft',
      date: '2026-11-01',
      expected: '2026-10-31',
      when: 'into the previous month',
    },
    { key: 'ArrowDown', date: '2026-11-12', expected: '2026-11-19', when: 'next week' },
    { key: 'ArrowDown', date: '2026-11-26', expected: '2026-12-03', when: 'next week, next month' },
    { key: 'ArrowUp', date: '2026-11-12', expected: '2026-11-05', when: 'previous week' },
    {
      key: 'ArrowUp',
      date: '2026-11-03',
      expected: '2026-10-27',
      when: 'previous week, previous month',
    },
    { key: 'Home', date: '2026-11-12', expected: '2026-11-09', when: 'Monday of the week' },
    { key: 'Home', date: '2026-11-09', expected: '2026-11-09', when: 'already Monday' },
    {
      key: 'Home',
      date: '2026-12-01',
      expected: '2026-11-30',
      when: 'Monday in the previous month',
    },
    { key: 'End', date: '2026-11-12', expected: '2026-11-15', when: 'Sunday of the week' },
    { key: 'End', date: '2026-11-15', expected: '2026-11-15', when: 'already Sunday' },
    { key: 'End', date: '2026-11-30', expected: '2026-12-06', when: 'Sunday in the next month' },
    { key: 'PageDown', date: '2026-11-12', expected: '2026-12-12', when: 'same day next month' },
    { key: 'PageDown', date: '2026-12-15', expected: '2027-01-15', when: 'same day next year' },
    { key: 'PageDown', date: '2027-01-31', expected: '2027-02-28', when: 'bounded to February' },
    {
      key: 'PageDown',
      date: '2028-01-31',
      expected: '2028-02-29',
      when: 'bounded to a leap February',
    },
    { key: 'PageDown', date: '2026-10-31', expected: '2026-11-30', when: 'bounded to 30 days' },
    { key: 'PageUp', date: '2026-11-12', expected: '2026-10-12', when: 'same day previous month' },
    { key: 'PageUp', date: '2027-01-15', expected: '2026-12-15', when: 'same day previous year' },
    { key: 'PageUp', date: '2026-03-31', expected: '2026-02-28', when: 'bounded to February' },
    { key: 'PageUp', date: '2026-05-31', expected: '2026-04-30', when: 'bounded to 30 days' },
  ])(
    'Given $date When $key is pressed Then it moves to $expected ($when)',
    ({ key, date, expected }) => {
      expect(nextCalendarDate(date, key)).toBe(expected);
    },
  );

  it.each(['Tab', 'Enter', ' ', 'Escape', 'a'])(
    'Given a day When « %s » is pressed Then it moves nowhere',
    (key) => {
      expect(nextCalendarDate('2026-11-12', key)).toBeNull();
    },
  );
});
