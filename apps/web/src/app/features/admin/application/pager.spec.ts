import { pager } from './pager';

describe('pager', () => {
  it.each([
    { total: 0, page: 1, size: 20, expected: { pageCount: 1, hasNewer: false, hasOlder: false } },
    { total: 20, page: 1, size: 20, expected: { pageCount: 1, hasNewer: false, hasOlder: false } },
    { total: 21, page: 1, size: 20, expected: { pageCount: 2, hasNewer: false, hasOlder: true } },
    { total: 21, page: 2, size: 20, expected: { pageCount: 2, hasNewer: true, hasOlder: false } },
    { total: 61, page: 2, size: 25, expected: { pageCount: 3, hasNewer: true, hasOlder: true } },
  ])(
    'Given $total items, $size per page, on page $page When paged Then $expected.pageCount page(s), newer $expected.hasNewer, older $expected.hasOlder',
    ({ total, page, size, expected }) => {
      expect(pager(total, page, size)).toEqual({
        ...expected,
        label: `Page ${page} sur ${expected.pageCount}`,
      });
    },
  );
});
