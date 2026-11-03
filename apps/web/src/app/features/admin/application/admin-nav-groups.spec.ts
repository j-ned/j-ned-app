import { activeNavLabel, adminNavGroups, type AdminNavCounts } from './admin-nav-groups';

const COUNTS: AdminNavCounts = { projects: 6, posts: 2, unread: 3 };

describe('adminNavGroups', () => {
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
    {
      source: 'projects',
      counts: { projects: null, posts: 2, unread: 3 },
      key: 'projects',
    },
    { source: 'posts', counts: { projects: 6, posts: null, unread: 3 }, key: 'posts' },
    {
      source: 'unread',
      counts: { projects: 6, posts: 2, unread: null },
      key: 'messages',
    },
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
        profile: null,
        cv: null,
        'insert-guide': null,
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
    { url: '/admin/profile', label: 'Parcours' },
    { url: '/admin/cv', label: 'CV' },
    { url: '/admin/guide-plaquettes', label: 'Guide des plaquettes' },
    { url: '/admin/audience', label: 'Audience' },
    { url: '/admin/messages?filter=unread', label: 'Messages' },
    { url: '/admin/settings/security', label: 'Paramètres' },
    { url: '/admin/rendez-vous', label: 'Administration' },
    { url: '/admin/disponibilites', label: 'Administration' },
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
