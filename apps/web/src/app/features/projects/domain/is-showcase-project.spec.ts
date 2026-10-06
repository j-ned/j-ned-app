import { isShowcaseProject } from './is-showcase-project';
import { makeProject } from '../testing/project-builders';

describe('isShowcaseProject', () => {
  it.each([
    { featured: true, kind: 'production', expected: true },
    { featured: true, kind: 'demo', expected: false },
    { featured: true, kind: 'script', expected: false },
    { featured: true, kind: null, expected: false },
    { featured: false, kind: 'production', expected: false },
    { featured: false, kind: 'demo', expected: false },
    { featured: false, kind: 'script', expected: false },
    { featured: false, kind: null, expected: false },
  ] as const)(
    'Given featured $featured and kind $kind When checked for the home Then it is $expected',
    ({ featured, kind, expected }) => {
      expect(isShowcaseProject(makeProject({ featured, kind }))).toBe(expected);
    },
  );
});
