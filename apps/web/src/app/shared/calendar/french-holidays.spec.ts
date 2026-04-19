import { getFrenchHolidays, getUnavailableReason, isWeekend } from './french-holidays';

describe('getFrenchHolidays', () => {
  describe('Given year 2025', () => {
    const holidays = getFrenchHolidays(2025);

    it('includes all 11 official French holidays', () => {
      expect(holidays.size).toBe(11);
    });

    it.each([
      { date: '2025-01-01', name: 'Jour de l\u2019An' },
      { date: '2025-05-01', name: 'Fête du Travail' },
      { date: '2025-05-08', name: 'Victoire 1945' },
      { date: '2025-07-14', name: 'Fête nationale' },
      { date: '2025-08-15', name: 'Assomption' },
      { date: '2025-11-01', name: 'Toussaint' },
      { date: '2025-11-11', name: 'Armistice 1918' },
      { date: '2025-12-25', name: 'Noël' },
    ])('fixed holiday $date → $name', ({ date, name }) => {
      expect(holidays.get(date)).toBe(name);
    });

    it('Easter Monday 2025 is April 21', () => {
      expect(holidays.get('2025-04-21')).toBe('Lundi de Pâques');
    });

    it('Ascension 2025 is May 29', () => {
      expect(holidays.get('2025-05-29')).toBe('Ascension');
    });

    it('Whit Monday 2025 is June 9', () => {
      expect(holidays.get('2025-06-09')).toBe('Lundi de Pentecôte');
    });
  });

  describe('Given year 2026', () => {
    const holidays = getFrenchHolidays(2026);

    it('Easter Monday 2026 is April 6', () => {
      expect(holidays.get('2026-04-06')).toBe('Lundi de Pâques');
    });

    it('Ascension 2026 is May 14', () => {
      expect(holidays.get('2026-05-14')).toBe('Ascension');
    });
  });
});

describe('isWeekend', () => {
  it.each([
    { day: new Date(2025, 0, 4), name: 'Saturday', expected: true },
    { day: new Date(2025, 0, 5), name: 'Sunday', expected: true },
    { day: new Date(2025, 0, 6), name: 'Monday', expected: false },
    { day: new Date(2025, 0, 10), name: 'Friday', expected: false },
  ])('$name is weekend? $expected', ({ day, expected }) => {
    expect(isWeekend(day)).toBe(expected);
  });
});

describe('getUnavailableReason', () => {
  const holidays = getFrenchHolidays(2025);

  it('returns holiday name if date matches a holiday', () => {
    expect(getUnavailableReason(new Date(2025, 6, 14), holidays)).toBe('Fête nationale');
  });

  it('returns "Weekend" if date is a Saturday or Sunday', () => {
    expect(getUnavailableReason(new Date(2025, 0, 4), holidays)).toBe('Weekend');
  });

  it('returns null for regular working day', () => {
    expect(getUnavailableReason(new Date(2025, 0, 6), holidays)).toBeNull();
  });

  it('prioritizes holiday over weekend (edge case)', () => {
    // May 1, 2025 is a Thursday - not testing this edge case. Testing logic order.
    const result = getUnavailableReason(new Date(2025, 4, 1), holidays);
    expect(result).toBe('Fête du Travail');
  });
});
