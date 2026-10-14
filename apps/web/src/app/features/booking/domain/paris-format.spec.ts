import { describe, expect, it } from 'vitest';
import {
  formatDayLabel,
  formatDayShortLabel,
  formatMonthLabel,
  formatParisDateTime,
  formatParisTime,
  toParisDateKey,
} from './paris-format';

describe('toParisDateKey', () => {
  it.each([
    { instant: '2026-10-19T07:00:00.000Z', expected: '2026-10-19', when: 'summer morning' },
    { instant: '2026-10-19T21:59:00.000Z', expected: '2026-10-19', when: '23:59 summer time' },
    { instant: '2026-10-19T22:00:00.000Z', expected: '2026-10-20', when: 'midnight summer time' },
    { instant: '2026-11-02T22:59:00.000Z', expected: '2026-11-02', when: '23:59 winter time' },
    { instant: '2026-11-02T23:00:00.000Z', expected: '2026-11-03', when: 'midnight winter time' },
    {
      instant: '2026-10-24T22:00:00.000Z',
      expected: '2026-10-25',
      when: 'start of the autumn shift',
    },
    {
      instant: '2026-10-25T22:59:00.000Z',
      expected: '2026-10-25',
      when: 'end of the autumn shift',
    },
    {
      instant: '2027-03-27T23:00:00.000Z',
      expected: '2027-03-28',
      when: 'start of the spring shift',
    },
    {
      instant: '2027-03-28T21:59:00.000Z',
      expected: '2027-03-28',
      when: 'end of the spring shift',
    },
  ])(
    'Given $instant ($when) When keyed Then it falls on Paris date $expected',
    ({ instant, expected }) => {
      expect(toParisDateKey(instant)).toBe(expected);
    },
  );
});

describe('formatParisTime', () => {
  it.each([
    { instant: '2026-10-19T07:00:00.000Z', expected: '09:00', when: 'summer time' },
    { instant: '2026-10-26T08:00:00.000Z', expected: '09:00', when: 'winter time' },
    { instant: '2026-10-19T22:00:00.000Z', expected: '00:00', when: 'midnight, never 24:00' },
    { instant: '2026-10-25T00:30:00.000Z', expected: '02:30', when: 'repeated hour, first pass' },
    { instant: '2026-10-25T02:00:00.000Z', expected: '03:00', when: 'after the repeated hour' },
    { instant: '2027-03-28T00:30:00.000Z', expected: '01:30', when: 'before the skipped hour' },
    {
      instant: '2027-03-28T01:00:00.000Z',
      expected: '03:00',
      when: 'right after the skipped hour',
    },
  ])(
    'Given $instant ($when) When formatted Then Paris wall time reads $expected',
    ({ instant, expected }) => {
      expect(formatParisTime(instant)).toBe(expected);
    },
  );
});

describe('formatParisDateTime', () => {
  it.each([
    { instant: '2026-10-19T07:00:00.000Z', expected: 'lundi 19 octobre 2026 à 09:00' },
    { instant: '2026-10-19T22:30:00.000Z', expected: 'mardi 20 octobre 2026 à 00:30' },
    { instant: '2027-03-29T07:00:00.000Z', expected: 'lundi 29 mars 2027 à 09:00' },
    { instant: '2026-11-01T08:00:00.000Z', expected: 'dimanche 1er novembre 2026 à 09:00' },
  ])('Given $instant When formatted Then it reads « $expected »', ({ instant, expected }) => {
    expect(formatParisDateTime(instant)).toBe(expected);
  });
});

describe('formatDayLabel', () => {
  it.each([
    { date: '2026-10-19', expected: 'lundi 19 octobre' },
    { date: '2026-10-25', expected: 'dimanche 25 octobre' },
    { date: '2026-11-01', expected: 'dimanche 1er novembre' },
    { date: '2027-01-01', expected: 'vendredi 1er janvier' },
    { date: '2027-03-28', expected: 'dimanche 28 mars' },
  ])('Given Paris date $date When labelled Then it reads « $expected »', ({ date, expected }) => {
    expect(formatDayLabel(date)).toBe(expected);
  });
});

describe('formatDayShortLabel', () => {
  it.each([
    { date: '2026-10-19', expected: 'lun. 19' },
    { date: '2026-10-25', expected: 'dim. 25' },
    { date: '2026-11-01', expected: 'dim. 1er' },
    { date: '2027-03-28', expected: 'dim. 28' },
  ])('Given Paris date $date When labelled Then it reads « $expected »', ({ date, expected }) => {
    expect(formatDayShortLabel(date)).toBe(expected);
  });
});

describe('formatMonthLabel', () => {
  it.each([
    { month: '2026-11', expected: 'novembre 2026' },
    { month: '2026-12', expected: 'décembre 2026' },
    { month: '2027-01', expected: 'janvier 2027' },
    { month: '2027-08', expected: 'août 2027' },
  ])('Given month $month When labelled Then it reads « $expected »', ({ month, expected }) => {
    expect(formatMonthLabel(month)).toBe(expected);
  });
});
