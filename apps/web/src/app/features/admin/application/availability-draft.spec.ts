import type { AvailabilityRule } from '@features/booking/domain/models/booking-admin.model';
import { anAvailabilityRule } from '@features/booking/testing/booking-builders';
import {
  AVAILABILITY_WEEKDAYS,
  SLOT_GRID,
  hiddenRanges,
  summarizeSlots,
  toAvailabilityRules,
  toTimeOfDay,
  toWeeklySlotsDraft,
  toggleSlot,
} from './availability-draft';
import { aWeeklySlotsDraft } from './testing/weekly-slots-draft-builder';

const WEEK_RULES: readonly AvailabilityRule[] = [
  anAvailabilityRule({ weekday: 1, startMinute: 540, endMinute: 720 }),
  anAvailabilityRule({ weekday: 1, startMinute: 840, endMinute: 1080 }),
  anAvailabilityRule({ weekday: 3, startMinute: 600, endMinute: 690 }),
  anAvailabilityRule({ weekday: 7, startMinute: 0, endMinute: 1440 }),
];

const WHOLE_DAY = Array.from({ length: 48 }, (_, index) => index);

describe('toTimeOfDay', () => {
  it.each([
    { minute: 0, time: '00:00' },
    { minute: 30, time: '00:30' },
    { minute: 540, time: '09:00' },
    { minute: 570, time: '09:30' },
    { minute: 1410, time: '23:30' },
    { minute: 1440, time: '24:00' },
  ])('Given minute $minute When it is written Then it reads « $time »', ({ minute, time }) => {
    expect(toTimeOfDay(minute)).toBe(time);
  });
});

describe('AVAILABILITY_WEEKDAYS', () => {
  it('Given the week When it is listed Then it runs from Monday to Sunday with ISO weekdays and French labels', () => {
    expect(AVAILABILITY_WEEKDAYS).toEqual([
      { key: 'monday', weekday: 1, label: 'Lundi' },
      { key: 'tuesday', weekday: 2, label: 'Mardi' },
      { key: 'wednesday', weekday: 3, label: 'Mercredi' },
      { key: 'thursday', weekday: 4, label: 'Jeudi' },
      { key: 'friday', weekday: 5, label: 'Vendredi' },
      { key: 'saturday', weekday: 6, label: 'Samedi' },
      { key: 'sunday', weekday: 7, label: 'Dimanche' },
    ]);
  });
});

describe('SLOT_GRID', () => {
  it('Given the grid When it is listed Then it holds the 26 half hours from 08:00 to 20:30, the last one ending at 21:00', () => {
    expect({
      grid: SLOT_GRID,
      first: toTimeOfDay((SLOT_GRID[0] ?? -1) * 30),
      last: toTimeOfDay((SLOT_GRID[SLOT_GRID.length - 1] ?? -1) * 30),
    }).toEqual({
      grid: [
        16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38,
        39, 40, 41,
      ],
      first: '08:00',
      last: '20:30',
    });
  });
});

describe('toWeeklySlotsDraft', () => {
  it('Given no rules When the draft is built Then the seven days are present, Monday first, each without half hour', () => {
    const draft = toWeeklySlotsDraft(null);

    expect({ keys: Object.keys(draft), draft }).toEqual({
      keys: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      draft: aWeeklySlotsDraft(),
    });
  });

  it('Given a Monday from 07:00 to 09:00 When the draft is built Then Monday holds half hours 14 to 17', () => {
    const draft = toWeeklySlotsDraft([
      anAvailabilityRule({ weekday: 1, startMinute: 420, endMinute: 540 }),
    ]);

    expect(draft).toEqual(aWeeklySlotsDraft({ monday: [14, 15, 16, 17] }));
  });

  it('Given the rules of a week When the draft is built Then each day holds its half hours, the whole Sunday holding all 48', () => {
    expect(toWeeklySlotsDraft(WEEK_RULES)).toEqual(
      aWeeklySlotsDraft({
        monday: [18, 19, 20, 21, 22, 23, 28, 29, 30, 31, 32, 33, 34, 35],
        wednesday: [20, 21, 22],
        sunday: WHOLE_DAY,
      }),
    );
  });

  it('Given rules out of order on several days When the draft is built Then the half hours of each day are sorted', () => {
    const draft = toWeeklySlotsDraft([
      anAvailabilityRule({ weekday: 2, startMinute: 840, endMinute: 900 }),
      anAvailabilityRule({ weekday: 5, startMinute: 600, endMinute: 660 }),
      anAvailabilityRule({ weekday: 2, startMinute: 480, endMinute: 540 }),
    ]);

    expect(draft).toEqual(aWeeklySlotsDraft({ tuesday: [16, 17, 28, 29], friday: [20, 21] }));
  });

  it('Given two adjacent Thursday rules When the draft is built Then their half hours follow each other once', () => {
    const draft = toWeeklySlotsDraft([
      anAvailabilityRule({ weekday: 4, startMinute: 540, endMinute: 600 }),
      anAvailabilityRule({ weekday: 4, startMinute: 600, endMinute: 660 }),
    ]);

    expect(draft.thursday).toEqual([18, 19, 20, 21]);
  });
});

describe('toAvailabilityRules', () => {
  it('Given an empty week When the rules are built Then none is sent', () => {
    expect(toAvailabilityRules(aWeeklySlotsDraft())).toEqual([]);
  });

  it('Given Monday half hours 14 to 17 When the rules are built Then a single rule from 07:00 to 09:00 is sent', () => {
    expect(toAvailabilityRules(aWeeklySlotsDraft({ monday: [14, 15, 16, 17] }))).toEqual([
      { weekday: 1, startMinute: 420, endMinute: 540 },
    ]);
  });

  it('Given a whole Sunday When the rules are built Then it is one rule from 00:00 to 24:00', () => {
    expect(toAvailabilityRules(aWeeklySlotsDraft({ sunday: WHOLE_DAY }))).toEqual([
      { weekday: 7, startMinute: 0, endMinute: 1440 },
    ]);
  });

  it.each([
    { case: 'a single half hour', slots: [36], rules: [[1080, 1110]] },
    {
      case: 'two runs apart',
      slots: [16, 17, 20],
      rules: [
        [480, 540],
        [600, 630],
      ],
    },
    {
      case: 'the first and the last half hour',
      slots: [0, 47],
      rules: [
        [0, 30],
        [1410, 1440],
      ],
    },
    {
      case: 'three half hours apart',
      slots: [40, 42, 44],
      rules: [
        [1200, 1230],
        [1260, 1290],
        [1320, 1350],
      ],
    },
    { case: 'a run across 21:00', slots: [40, 41, 42, 43], rules: [[1200, 1320]] },
  ])(
    'Given Tuesday holding $case When the rules are built Then each contiguous run is one rule',
    ({ slots, rules }) => {
      expect(toAvailabilityRules(aWeeklySlotsDraft({ tuesday: slots }))).toEqual(
        rules.map(([startMinute, endMinute]) => ({ weekday: 2, startMinute, endMinute })),
      );
    },
  );

  it('Given several days When the rules are built Then the days go from Monday to Sunday, each run in time order', () => {
    const draft = aWeeklySlotsDraft({
      sunday: [20, 21],
      monday: [14, 15, 16, 28, 29, 30],
      thursday: WHOLE_DAY,
    });

    expect(toAvailabilityRules(draft)).toEqual([
      { weekday: 1, startMinute: 420, endMinute: 510 },
      { weekday: 1, startMinute: 840, endMinute: 930 },
      { weekday: 4, startMinute: 0, endMinute: 1440 },
      { weekday: 7, startMinute: 600, endMinute: 660 },
    ]);
  });

  it('Given 09:00–10:00 and 10:00–11:00 read on Thursday When they go to a draft and back Then a single rule 09:00–11:00 is sent', () => {
    const rules = toAvailabilityRules(
      toWeeklySlotsDraft([
        anAvailabilityRule({ weekday: 4, startMinute: 540, endMinute: 600 }),
        anAvailabilityRule({ weekday: 4, startMinute: 600, endMinute: 660 }),
      ]),
    );

    expect(rules).toEqual([{ weekday: 4, startMinute: 540, endMinute: 660 }]);
  });

  it('Given the rules of a week sorted by day and start When they go to a draft and back Then they are unchanged', () => {
    expect(toAvailabilityRules(toWeeklySlotsDraft(WEEK_RULES))).toEqual(WEEK_RULES);
  });

  it('Given a rule outside the grid next to one inside When they go to a draft and back Then the outside part is kept and merged', () => {
    const rules = toAvailabilityRules(
      toWeeklySlotsDraft([
        anAvailabilityRule({ weekday: 6, startMinute: 1200, endMinute: 1260 }),
        anAvailabilityRule({ weekday: 6, startMinute: 1260, endMinute: 1380 }),
      ]),
    );

    expect(rules).toEqual([{ weekday: 6, startMinute: 1200, endMinute: 1380 }]);
  });
});

describe('toggleSlot', () => {
  it.each([
    { case: 'switched on in an empty day', slots: [], index: 20, result: [20] },
    { case: 'switched on before the others', slots: [36, 37], index: 16, result: [16, 36, 37] },
    {
      case: 'switched on between two runs',
      slots: [16, 17, 30],
      index: 18,
      result: [16, 17, 18, 30],
    },
    { case: 'switched on after the others', slots: [14, 15], index: 41, result: [14, 15, 41] },
    { case: 'switched off in the middle', slots: [18, 19, 20], index: 19, result: [18, 20] },
    { case: 'switched off as the last one', slots: [18], index: 18, result: [] },
  ])(
    'Given $slots When half hour $index is $case Then the day holds $result, as a new sorted list',
    ({ slots, index, result }) => {
      const before = [...slots];

      const toggled = toggleSlot(slots, index);

      expect({ toggled, fresh: toggled !== slots, untouched: slots }).toEqual({
        toggled: result,
        fresh: true,
        untouched: before,
      });
    },
  );

  it('Given a day When a half hour is switched on then off Then the day is back to its half hours', () => {
    const slots = [14, 15, 36];

    expect(toggleSlot(toggleSlot(slots, 20), 20)).toEqual([14, 15, 36]);
  });
});

describe('summarizeSlots', () => {
  it.each([
    { case: 'no half hour', slots: [], summary: '' },
    { case: 'four half hours from 18:00', slots: [36, 37, 38, 39], summary: '18:00–20:00' },
    { case: 'a single half hour', slots: [41], summary: '20:30–21:00' },
    {
      case: 'two runs',
      slots: [36, 37, 42, 43],
      summary: '18:00–19:00, 21:00–22:00',
    },
    {
      case: 'three runs',
      slots: [16, 18, 20, 21],
      summary: '08:00–08:30, 09:00–09:30, 10:00–11:00',
    },
    { case: 'the last half hour of the day', slots: [47], summary: '23:30–24:00' },
    { case: 'the whole day', slots: WHOLE_DAY, summary: '00:00–24:00' },
  ])('Given $case When it is summarized Then it reads « $summary »', ({ slots, summary }) => {
    expect(summarizeSlots(slots)).toBe(summary);
  });
});

describe('hiddenRanges', () => {
  it('Given a week inside the grid, from 08:00 to 21:00 When it is checked Then nothing is hidden', () => {
    expect(
      hiddenRanges(aWeeklySlotsDraft({ monday: [16, 17], friday: [40, 41], sunday: [16, 41] })),
    ).toEqual([]);
  });

  it('Given Monday from 07:00 to 09:00 When it is checked Then Monday 07:00–08:00 is reported outside the grid', () => {
    expect(hiddenRanges(aWeeklySlotsDraft({ monday: [14, 15, 16, 17] }))).toEqual([
      { label: 'Lundi', ranges: '07:00–08:00' },
    ]);
  });

  it('Given half hours just outside both edges When it is checked Then 07:30–08:00 and 21:00–21:30 are reported', () => {
    expect(hiddenRanges(aWeeklySlotsDraft({ wednesday: [15, 16, 41, 42] }))).toEqual([
      { label: 'Mercredi', ranges: '07:30–08:00, 21:00–21:30' },
    ]);
  });

  it('Given hidden half hours on Sunday and Tuesday When it is checked Then the days come from Monday to Sunday, each with its hidden runs only', () => {
    expect(
      hiddenRanges(
        aWeeklySlotsDraft({ sunday: WHOLE_DAY, tuesday: [20, 21, 44, 45], thursday: [30] }),
      ),
    ).toEqual([
      { label: 'Mardi', ranges: '22:00–23:00' },
      { label: 'Dimanche', ranges: '00:00–08:00, 21:00–24:00' },
    ]);
  });
});
