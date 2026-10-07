import { activeNavLabel, adminNavGroups, type AdminNavCounts } from './admin-nav-groups';

const COUNTS: AdminNavCounts = { projects: 6, posts: 2, unread: 3 };

describe('adminNavGroups', () => {
  it('Given counts When the groups are built Then the overview stands alone, followed by Contenu, Audience and Compte in order', () => {
    const groups = adminNavGroups(COUNTS);

    expect(
      groups.map((group) => ({
        label: group.label,
        items: group.items.map(({ key, route, label, exact }) => ({ key, route, label, exact })),
      })),
    ).toEqual([
      {
        label: null,
        items: [{ key: 'overview', route: '/admin', label: "Vue d'ensemble", exact: true }],
      },
      {
        label: 'Contenu',
        items: [
          { key: 'projects', route: '/admin/projects', label: 'Projets', exact: false },
          { key: 'posts', route: '/admin/blog', label: 'Articles', exact: false },
          { key: 'cv', route: '/admin/cv', label: 'CV', exact: false },
        ],
      },
      {
        label: 'Audience',
        items: [
          { key: 'audience', route: '/admin/audience', label: 'Audience', exact: false },
          { key: 'messages', route: '/admin/messages', label: 'Messages', exact: false },
        ],
      },
      {
        label: 'Compte',
        items: [{ key: 'settings', route: '/admin/settings', label: 'Paramètres', exact: false }],
      },
    ]);
  });

  it('Given counts When the groups are built Then only projects, articles and messages carry a count', () => {
    const counts = adminNavGroups(COUNTS)
      .flatMap((group) => group.items)
      .map(({ key, count, countSuffix }) => ({ key, count, countSuffix }));

    expect(counts).toEqual([
      { key: 'overview', count: null, countSuffix: '' },
      { key: 'projects', count: 6, countSuffix: '' },
      { key: 'posts', count: 2, countSuffix: '' },
      { key: 'cv', count: null, countSuffix: '' },
      { key: 'audience', count: null, countSuffix: '' },
      { key: 'messages', count: 3, countSuffix: 'non lus' },
      { key: 'settings', count: null, countSuffix: '' },
    ]);
  });

  it.each([
    { unread: 0, countSuffix: 'non lu' },
    { unread: 1, countSuffix: 'non lu' },
    { unread: 2, countSuffix: 'non lus' },
    { unread: 12, countSuffix: 'non lus' },
  ])(
    'Given $unread unread message(s) When the groups are built Then the messages count reads « $unread $countSuffix »',
    ({ unread, countSuffix }) => {
      const messages = adminNavGroups({ ...COUNTS, unread })
        .flatMap((group) => group.items)
        .find((item) => item.key === 'messages');

      expect({ count: messages?.count, countSuffix: messages?.countSuffix }).toEqual({
        count: unread,
        countSuffix,
      });
    },
  );

  it.each([
    { source: 'projects', counts: { projects: null, posts: 2, unread: 3 }, key: 'projects' },
    { source: 'posts', counts: { projects: 6, posts: null, unread: 3 }, key: 'posts' },
    { source: 'unread', counts: { projects: 6, posts: 2, unread: null }, key: 'messages' },
  ] as const)(
    'Given an unknown $source count When the groups are built Then $key has no count and the others keep theirs',
    ({ counts, key }) => {
      const byKey = Object.fromEntries(
        adminNavGroups(counts)
          .flatMap((group) => group.items)
          .map((item) => [item.key, item.count]),
      );

      expect(byKey).toEqual({
        overview: null,
        projects: 6,
        posts: 2,
        cv: null,
        audience: null,
        messages: 3,
        settings: null,
        [key]: null,
      });
    },
  );
});

describe('activeNavLabel', () => {
  it.each([
    { url: '/admin', label: "Vue d'ensemble" },
    { url: '/admin/projects', label: 'Projets' },
    { url: '/admin/blog', label: 'Articles' },
    { url: '/admin/cv', label: 'CV' },
    { url: '/admin/audience', label: 'Audience' },
    { url: '/admin/messages?filter=unread', label: 'Messages' },
    { url: '/admin/settings/security', label: 'Paramètres' },
    { url: '/admin/projects/new', label: 'Projets' },
    { url: '/admin#top', label: "Vue d'ensemble" },
    { url: '/admin/blogroll', label: 'Administration' },
    { url: '/admin/inconnu', label: 'Administration' },
  ])(
    'Given the url $url When the mobile bar names the page Then it reads « $label »',
    ({ url, label }) => {
      expect(activeNavLabel(adminNavGroups(COUNTS), url)).toBe(label);
    },
  );
});
