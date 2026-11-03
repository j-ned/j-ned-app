import { isProjectKind } from './is-project-kind';

describe('isProjectKind', () => {
  it.each(['production', 'demo', 'script'])(
    'Given %j When checked Then it is a project kind',
    (value) => {
      expect(isProjectKind(value)).toBe(true);
    },
  );

  it.each([
    { value: 'foo', label: 'unknown string' },
    { value: '', label: 'empty string' },
    { value: 'Production', label: 'wrong case' },
    { value: ' demo', label: 'padded value' },
    { value: null, label: 'null' },
    { value: undefined, label: 'undefined' },
    { value: 1, label: 'number' },
    { value: ['demo'], label: 'array holding a kind' },
  ])('Given $label When checked Then it is not a project kind', ({ value }) => {
    expect(isProjectKind(value)).toBe(false);
  });
});
