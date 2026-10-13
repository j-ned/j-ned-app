import type { AvailabilityRule } from '@features/booking/domain/models/booking-admin.model';
import { anAvailabilityRule } from '@features/booking/testing/booking-builders';
import {
  findOverlappedRange,
  toAvailabilityDraft,
  toAvailabilityRules,
  toMinuteOfDay,
  toTimeOfDay,
  type AvailabilityDraft,
  type AvailabilityRangeRow,
} from './availability-draft';

const EMPTY_WEEK: AvailabilityDraft = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
};

const WEEK_RULES: readonly AvailabilityRule[] = [
  anAvailabilityRule({ weekday: 1, startMinute: 540, endMinute: 720 }),
  anAvailabilityRule({ weekday: 1, startMinute: 840, endMinute: 1080 }),
  anAvailabilityRule({ weekday: 3, startMinute: 600, endMinute: 690 }),
  anAvailabilityRule({ weekday: 7, startMinute: 0, endMinute: 1440 }),
];

const range = (start: string, end: string): AvailabilityRangeRow => ({ start, end });

describe('toTimeOfDay et toMinuteOfDay', () => {
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

  it.each([
    { time: '00:00', minute: 0 },
    { time: '00:30', minute: 30 },
    { time: '09:00', minute: 540 },
    { time: '13:30', minute: 810 },
    { time: '23:30', minute: 1410 },
    { time: '24:00', minute: 1440 },
  ])('Given « $time » When it is read Then it is minute $minute', ({ time, minute }) => {
    expect(toMinuteOfDay(time)).toBe(minute);
  });
});

describe('toAvailabilityDraft', () => {
  it('Given no rules When the draft is built Then the seven days are present, Monday first, each without range', () => {
    const draft = toAvailabilityDraft(null);

    expect({ keys: Object.keys(draft), draft }).toEqual({
      keys: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      draft: EMPTY_WEEK,
    });
  });

  it('Given an empty list When the draft is built Then every day is empty', () => {
    expect(toAvailabilityDraft([])).toEqual(EMPTY_WEEK);
  });

  it('Given the rules of a week When the draft is built Then each day holds its ranges as times, the whole Sunday ending at 24:00', () => {
    expect(toAvailabilityDraft(WEEK_RULES)).toEqual({
      ...EMPTY_WEEK,
      monday: [range('09:00', '12:00'), range('14:00', '18:00')],
      wednesday: [range('10:00', '11:30')],
      sunday: [range('00:00', '24:00')],
    } satisfies AvailabilityDraft);
  });

  it('Given rules out of order When the draft is built Then the ranges of a day follow their start', () => {
    const draft = toAvailabilityDraft([
      anAvailabilityRule({ weekday: 2, startMinute: 840, endMinute: 900 }),
      anAvailabilityRule({ weekday: 5, startMinute: 600, endMinute: 660 }),
      anAvailabilityRule({ weekday: 2, startMinute: 480, endMinute: 540 }),
    ]);

    expect(draft).toEqual({
      ...EMPTY_WEEK,
      tuesday: [range('08:00', '09:00'), range('14:00', '15:00')],
      friday: [range('10:00', '11:00')],
    });
  });

  it('Given a draft built from the rules When a range is edited Then the rules are left untouched', () => {
    const rules = [anAvailabilityRule({ weekday: 1, startMinute: 540, endMinute: 720 })];
    const draft = toAvailabilityDraft(rules);

    const [first] = draft.monday;
    if (first) first.end = '13:00';
    draft.tuesday.push(range('09:00', '10:00'));

    expect({ draft: draft.monday, rules }).toEqual({
      draft: [range('09:00', '13:00')],
      rules: [{ weekday: 1, startMinute: 540, endMinute: 720 }],
    });
  });
});

describe('toAvailabilityRules', () => {
  it('Given an empty week When the rules are built Then none is sent', () => {
    expect(toAvailabilityRules({ ...EMPTY_WEEK })).toEqual([]);
  });

  it('Given a draft When the rules are built Then the days go from Monday to Sunday, each in the order of its rows', () => {
    const draft: AvailabilityDraft = {
      ...EMPTY_WEEK,
      sunday: [range('10:00', '11:00')],
      monday: [range('14:00', '18:00'), range('07:00', '08:30')],
      thursday: [range('00:00', '24:00')],
    };

    expect(toAvailabilityRules(draft)).toEqual([
      { weekday: 1, startMinute: 840, endMinute: 1080 },
      { weekday: 1, startMinute: 420, endMinute: 510 },
      { weekday: 4, startMinute: 0, endMinute: 1440 },
      { weekday: 7, startMinute: 600, endMinute: 660 },
    ]);
  });

  it('Given rows marked by the form When the rules are built Then each rule carries only its three fields', () => {
    const marked = Object.assign(range('09:00', '12:00'), {
      [Symbol('form-row')]: true,
      extra: 'ignored',
    });

    const [rule] = toAvailabilityRules({ ...EMPTY_WEEK, monday: [marked] });

    expect({
      keys: Object.keys(rule ?? {}),
      symbols: Object.getOwnPropertySymbols(rule ?? {}).length,
      rule,
    }).toEqual({
      keys: ['weekday', 'startMinute', 'endMinute'],
      symbols: 0,
      rule: { weekday: 1, startMinute: 540, endMinute: 720 },
    });
  });

  it('Given the rules of a week sorted by day and start When they go to a draft and back Then they are unchanged', () => {
    expect(toAvailabilityRules(toAvailabilityDraft(WEEK_RULES))).toEqual(WEEK_RULES);
  });
});

describe('findOverlappedRange', () => {
  it.each([
    {
      case: 'the second range starts inside the first',
      rows: [range('09:00', '12:00'), range('11:00', '13:00')],
      expected: [null, 0],
    },
    {
      case: 'the ranges touch',
      rows: [range('09:00', '12:00'), range('12:00', '14:00')],
      expected: [null, null],
    },
    {
      case: 'the first row starts later than the second',
      rows: [range('14:00', '18:00'), range('09:00', '15:00')],
      expected: [1, null],
    },
    {
      case: 'both start at the same time',
      rows: [range('09:00', '10:00'), range('09:00', '11:00')],
      expected: [null, 0],
    },
    {
      case: 'the second lies inside the first',
      rows: [range('09:00', '18:00'), range('10:00', '11:00')],
      expected: [null, 0],
    },
    {
      case: 'the third overlaps the first only',
      rows: [range('09:00', '12:00'), range('10:00', '11:00'), range('11:00', '13:00')],
      expected: [null, 0, 0],
    },
    {
      case: 'a row is not filled yet',
      rows: [range('09:00', '12:00'), range('', '')],
      expected: [null, null],
    },
    {
      case: 'a row ends before it starts',
      rows: [range('09:00', '12:00'), range('11:00', '10:00')],
      expected: [null, null],
    },
    {
      case: 'the ranges are apart',
      rows: [range('08:00', '09:00'), range('17:00', '24:00')],
      expected: [null, null],
    },
  ])(
    'Given $case When each row is checked Then the overlapped earlier range is $expected',
    ({ rows, expected }) => {
      expect(rows.map((_, index) => findOverlappedRange(rows, index))).toEqual(expected);
    },
  );
});
