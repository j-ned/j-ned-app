import { counted } from './counted';

const NNBSP = '\u202f';

describe('counted', () => {
  it.each([
    { count: 0, label: '0 projet' },
    { count: 1, label: '1 projet' },
    { count: 2, label: '2 projets' },
    { count: 999, label: '999 projets' },
    { count: 1000, label: `1${NNBSP}000 projets` },
    { count: 1234, label: `1${NNBSP}234 projets` },
    { count: 12_345, label: `12${NNBSP}345 projets` },
    { count: 1_500_000, label: `1${NNBSP}500${NNBSP}000 projets` },
  ])('Given a count of $count When it is labelled Then it reads « $label »', ({ count, label }) => {
    expect(counted(count, 'projet', 'projets')).toBe(label);
  });
});
