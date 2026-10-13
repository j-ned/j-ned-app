import { activeNavLabel, adminNavGroups, type AdminNavCounts } from './admin-nav-groups';

const COUNTS: AdminNavCounts = { projects: 6, posts: 2, unread: 3, upcoming: 2 };

describe('adminNavGroups', () => {
  it('Given counts When the groups are built Then the overview stands alone, followed by Contenu, Audience, Rendez-vous and Compte in order', () => {
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
          { key: 'profile', route: '/admin/profile', label: 'Parcours', exact: false },
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
        label: 'Rendez-vous',
        items: [
          { key: 'bookings', route: '/admin/rendez-vous', label: 'Rendez-vous', exact: false },
          {
            key: 'availability',
            route: '/admin/disponibilites',
            label: 'Disponibilités',
            exact: false,
          },
        ],
      },
      {
        label: 'Compte',
        items: [{ key: 'settings', route: '/admin/settings', label: 'Paramètres', exact: false }],
      },
    ]);
  });

  it('Given counts When the groups are built Then only projects, articles, messages and bookings carry a count', () => {
    const counts = adminNavGroups(COUNTS)
      .flatMap((group) => group.items)
      .map(({ key, count, countSuffix }) => ({ key, count, countSuffix }));

    expect(counts).toEqual([
      { key: 'overview', count: null, countSuffix: '' },
      { key: 'projects', count: 6, countSuffix: '' },
      { key: 'posts', count: 2, countSuffix: '' },
      { key: 'profile', count: null, countSuffix: '' },
      { key: 'cv', count: null, countSuffix: '' },
      { key: 'audience', count: null, countSuffix: '' },
      { key: 'messages', count: 3, countSuffix: 'non lus' },
      { key: 'bookings', count: 2, countSuffix: 'à venir' },
      { key: 'availability', count: null, countSuffix: '' },
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
    {
      source: 'projects',
      counts: { projects: null, posts: 2, unread: 3, upcoming: 2 },
      key: 'projects',
    },
    { source: 'posts', counts: { projects: 6, posts: null, unread: 3, upcoming: 2 }, key: 'posts' },
    {
      source: 'unread',
      counts: { projects: 6, posts: 2, unread: null, upcoming: 2 },
      key: 'messages',
    },
    {
      source: 'upcoming',
      counts: { projects: 6, posts: 2, unread: 3, upcoming: null },
      key: 'bookings',
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
        audience: null,
        messages: 3,
        bookings: 2,
        availability: null,
        settings: null,
        [key]: null,
      });
    },
  );
});

describe('adminNavGroups: Rendez-vous', () => {
  it.each([0, 1, 5])(
    'Given %i upcoming booking(s) When the groups are built Then the bookings count reads « à venir »',
    (upcoming) => {
      const bookings = adminNavGroups({ ...COUNTS, upcoming })
        .flatMap((group) => group.items)
        .find((item) => item.key === 'bookings');

      expect({ count: bookings?.count, countSuffix: bookings?.countSuffix }).toEqual({
        count: upcoming,
        countSuffix: 'à venir',
      });
    },
  );

  it('Given an unknown upcoming count When the groups are built Then the bookings link has neither count nor suffix', () => {
    const bookings = adminNavGroups({ ...COUNTS, upcoming: null })
      .flatMap((group) => group.items)
      .find((item) => item.key === 'bookings');

    expect({ count: bookings?.count, countSuffix: bookings?.countSuffix }).toEqual({
      count: null,
      countSuffix: '',
    });
  });

  it('Given counts When the groups are built Then « Rendez-vous » is drawn with the calendar icon', () => {
    const bookings = adminNavGroups(COUNTS)
      .flatMap((group) => group.items)
      .find((item) => item.route === '/admin/rendez-vous');

    expect(bookings?.icon).toBe('calendar');
  });

  it('Given counts When the groups are built Then « Disponibilités » is drawn with the clock icon', () => {
    const availability = adminNavGroups(COUNTS)
      .flatMap((group) => group.items)
      .find((item) => item.route === '/admin/disponibilites');

    expect(availability?.icon).toBe('clock');
  });
});

describe('adminNavGroups: Parcours', () => {
  it('Given counts When the groups are built Then « Parcours » is drawn with the user icon', () => {
    const profile = adminNavGroups(COUNTS)
      .flatMap((group) => group.items)
      .find((item) => item.route === '/admin/profile');

    expect(profile?.icon).toBe('user');
  });
});

describe('activeNavLabel', () => {
  it.each([
    { url: '/admin', label: "Vue d'ensemble" },
    { url: '/admin/projects', label: 'Projets' },
    { url: '/admin/blog', label: 'Articles' },
    { url: '/admin/profile', label: 'Parcours' },
    { url: '/admin/cv', label: 'CV' },
    { url: '/admin/audience', label: 'Audience' },
    { url: '/admin/messages?filter=unread', label: 'Messages' },
    { url: '/admin/settings/security', label: 'Paramètres' },
    { url: '/admin/rendez-vous', label: 'Rendez-vous' },
    { url: '/admin/rendez-vous?scope=past', label: 'Rendez-vous' },
    { url: '/admin/disponibilites', label: 'Disponibilités' },
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
