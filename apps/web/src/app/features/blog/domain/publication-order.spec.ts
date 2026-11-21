import { byNewestPublication, isPublished } from './publication-order';

describe('byNewestPublication', () => {
  it('Given dated and undated posts When they are sorted Then the newest comes first and the undated last', () => {
    const posts = [
      { slug: 'old', publishedAt: '2026-01-10T00:00:00Z' },
      { slug: 'draft', publishedAt: null },
      { slug: 'new', publishedAt: '2026-09-01T00:00:00Z' },
      { slug: 'mid', publishedAt: '2026-05-03T00:00:00Z' },
    ];

    expect([...posts].sort(byNewestPublication).map((post) => post.slug)).toEqual([
      'new',
      'mid',
      'old',
      'draft',
    ]);
  });

  it('Given two posts published at the same instant When they are compared Then neither comes first', () => {
    const at = { publishedAt: '2026-05-03T00:00:00Z' };

    expect(byNewestPublication(at, { ...at })).toBe(0);
  });
});

describe('isPublished', () => {
  it.each([
    { status: 'published' as const, expected: true },
    { status: 'draft' as const, expected: false },
  ])('Given a $status post Then isPublished is $expected', ({ status, expected }) => {
    expect(isPublished({ status })).toBe(expected);
  });
});
