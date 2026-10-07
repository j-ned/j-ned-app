export type AdminNavKey =
  | 'overview'
  | 'projects'
  | 'posts'
  | 'cv'
  | 'audience'
  | 'messages'
  | 'settings';

export type AdminNavItem = {
  readonly key: AdminNavKey;
  readonly route: string;
  readonly icon: string;
  readonly label: string;
  readonly exact: boolean;
  readonly count: number | null;
  readonly countSuffix: string;
};

export type AdminNavGroup = {
  readonly label: string | null;
  readonly items: readonly AdminNavItem[];
};

export type AdminNavCounts = {
  readonly projects: number | null;
  readonly posts: number | null;
  readonly unread: number | null;
};

const NO_MATCH_LABEL = 'Administration';

const link = (
  key: AdminNavKey,
  route: string,
  icon: string,
  label: string,
  count: number | null = null,
  countSuffix = '',
): AdminNavItem => ({ key, route, icon, label, exact: key === 'overview', count, countSuffix });

export function adminNavGroups(counts: AdminNavCounts): readonly AdminNavGroup[] {
  const unreadSuffix = counts.unread === null ? '' : counts.unread > 1 ? 'non lus' : 'non lu';
  return [
    { label: null, items: [link('overview', '/admin', 'th-large', "Vue d'ensemble")] },
    {
      label: 'Contenu',
      items: [
        link('projects', '/admin/projects', 'desktop', 'Projets', counts.projects),
        link('posts', '/admin/blog', 'book', 'Articles', counts.posts),
        link('cv', '/admin/cv', 'file-pdf', 'CV'),
      ],
    },
    {
      label: 'Audience',
      items: [
        link('audience', '/admin/audience', 'chart-bar', 'Audience'),
        link('messages', '/admin/messages', 'envelope', 'Messages', counts.unread, unreadSuffix),
      ],
    },
    { label: 'Compte', items: [link('settings', '/admin/settings', 'cog', 'Paramètres')] },
  ];
}

export function activeNavLabel(groups: readonly AdminNavGroup[], url: string): string {
  const path = url.split(/[?#]/)[0];
  const match = groups
    .flatMap((group) => group.items)
    .find((item) =>
      item.exact ? path === item.route : path === item.route || path.startsWith(`${item.route}/`),
    );
  return match?.label ?? NO_MATCH_LABEL;
}
