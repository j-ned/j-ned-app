import { groupedNumber } from './grouped-number';

const NNBSP = '\u202f';

describe('groupedNumber', () => {
  it.each([
    { value: 0, label: '0' },
    { value: 999, label: '999' },
    { value: 1234, label: `1${NNBSP}234` },
    { value: 12_345, label: `12${NNBSP}345` },
  ])('Given $value When it is grouped Then it reads « $label »', ({ value, label }) => {
    expect(groupedNumber(value)).toBe(label);
  });

  it('Given a large number When it is grouped Then every separator is a narrow no-break space', () => {
    const separators = groupedNumber(1_500_000).replace(/\d/g, '');

    expect([...separators]).toEqual([NNBSP, NNBSP]);
  });
});
