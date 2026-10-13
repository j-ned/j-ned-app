import { describe, expect, it } from 'vitest';
import type { BookingSlot } from './models/booking.model';
import { aBookingSlot } from '../testing/booking-builders';
import { groupSlotsByDay } from './group-slots-by-day';

const slotAt = (startsAt: string, endsAt: string): BookingSlot =>
  aBookingSlot({ startsAt, endsAt });

describe('groupSlotsByDay', () => {
  it('Given no free slot When grouped Then there is no day', () => {
    expect(groupSlotsByDay([])).toEqual([]);
  });

  it('Given two slots of the same Paris morning When grouped Then one labelled day lists both with their wall times', () => {
    const nine = slotAt('2026-10-19T07:00:00.000Z', '2026-10-19T07:30:00.000Z');
    const nineThirty = slotAt('2026-10-19T07:30:00.000Z', '2026-10-19T08:00:00.000Z');

    expect(groupSlotsByDay([nine, nineThirty])).toEqual([
      {
        date: '2026-10-19',
        label: 'lundi 19 octobre',
        shortLabel: 'lun. 19',
        slots: [
          { ...nine, timeLabel: '09:00' },
          { ...nineThirty, timeLabel: '09:30' },
        ],
      },
    ]);
  });

  it.each([
    {
      season: 'summer time',
      before: slotAt('2026-10-19T21:30:00.000Z', '2026-10-19T22:00:00.000Z'),
      after: slotAt('2026-10-19T22:00:00.000Z', '2026-10-19T22:30:00.000Z'),
      days: [
        { date: '2026-10-19', times: ['23:30'] },
        { date: '2026-10-20', times: ['00:00'] },
      ],
    },
    {
      season: 'winter time',
      before: slotAt('2026-11-02T22:30:00.000Z', '2026-11-02T23:00:00.000Z'),
      after: slotAt('2026-11-02T23:00:00.000Z', '2026-11-02T23:30:00.000Z'),
      days: [
        { date: '2026-11-02', times: ['23:30'] },
        { date: '2026-11-03', times: ['00:00'] },
      ],
    },
  ])(
    'Given slots on either side of Paris midnight in $season When grouped Then they split on the Paris date, not the UTC one',
    ({ before, after, days }) => {
      const grouped = groupSlotsByDay([before, after]);

      expect(
        grouped.map((day) => ({
          date: day.date,
          times: day.slots.map((slot) => slot.timeLabel),
        })),
      ).toEqual(days);
    },
  );

  it('Given slots of the same UTC date across Paris midnight When grouped Then the late UTC slots join the next Paris day', () => {
    const slots = [
      slotAt('2026-10-19T22:00:00.000Z', '2026-10-19T22:30:00.000Z'),
      slotAt('2026-10-19T23:00:00.000Z', '2026-10-19T23:30:00.000Z'),
      slotAt('2026-10-20T00:30:00.000Z', '2026-10-20T01:00:00.000Z'),
    ];

    expect(
      groupSlotsByDay(slots).map((day) => ({
        date: day.date,
        label: day.label,
        times: day.slots.map((slot) => slot.timeLabel),
      })),
    ).toEqual([
      { date: '2026-10-20', label: 'mardi 20 octobre', times: ['00:00', '01:00', '02:30'] },
    ]);
  });

  it.each([
    {
      shift: 'the autumn shift (repeated hour offered once)',
      slots: [
        slotAt('2026-10-25T00:30:00.000Z', '2026-10-25T01:00:00.000Z'),
        slotAt('2026-10-25T02:00:00.000Z', '2026-10-25T02:30:00.000Z'),
      ],
      expected: {
        date: '2026-10-25',
        label: 'dimanche 25 octobre',
        times: ['02:30', '03:00'],
      },
    },
    {
      shift: 'the spring shift (skipped hour)',
      slots: [
        slotAt('2027-03-28T00:30:00.000Z', '2027-03-28T01:00:00.000Z'),
        slotAt('2027-03-28T01:00:00.000Z', '2027-03-28T01:30:00.000Z'),
      ],
      expected: { date: '2027-03-28', label: 'dimanche 28 mars', times: ['01:30', '03:00'] },
    },
  ])(
    'Given slots on $shift When grouped Then one day carries the Paris wall times',
    ({ slots, expected }) => {
      expect(
        groupSlotsByDay(slots).map((day) => ({
          date: day.date,
          label: day.label,
          times: day.slots.map((slot) => slot.timeLabel),
        })),
      ).toEqual([expected]);
    },
  );

  it('Given free slots on non-consecutive days When grouped Then days follow the slots order and no empty day is invented', () => {
    const slots = [
      slotAt('2026-10-21T08:00:00.000Z', '2026-10-21T08:30:00.000Z'),
      slotAt('2026-10-21T12:00:00.000Z', '2026-10-21T12:30:00.000Z'),
      slotAt('2026-10-23T08:00:00.000Z', '2026-10-23T08:30:00.000Z'),
    ];

    expect(
      groupSlotsByDay(slots).map((day) => ({
        date: day.date,
        shortLabel: day.shortLabel,
        times: day.slots.map((slot) => slot.timeLabel),
      })),
    ).toEqual([
      { date: '2026-10-21', shortLabel: 'mer. 21', times: ['10:00', '14:00'] },
      { date: '2026-10-23', shortLabel: 'ven. 23', times: ['10:00'] },
    ]);
  });
});
