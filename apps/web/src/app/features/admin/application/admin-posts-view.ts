import type { BlogPost } from '@features/blog/domain/models/blog-post.model';
import { readingTimeMinutes } from '@features/blog/domain/reading-time';
import type { FilterOption } from '@shared/ui/filter-group';

const SUBJECTS_SIZE = 3;

export type AdminPostsFilter = 'all' | 'published' | 'draft';

export type PostsSortDirection = 'descending' | 'ascending';

export type AdminPostRowView = {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly subjects: string;
  readonly cover: string;
  readonly status: BlogPost['status'];
  readonly publishedAt: string | null;
  readonly readingTime: string;
  readonly likes: number;
};

type AdminPostsView = {
  readonly filters: readonly FilterOption<AdminPostsFilter>[];
  readonly rows: readonly AdminPostRowView[];
};

function toRow(post: BlogPost): AdminPostRowView {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    subjects: post.tags.slice(0, SUBJECTS_SIZE).join(' · '),
    cover: post.coverImage,
    status: post.status,
    publishedAt: post.publishedAt,
    readingTime: `${readingTimeMinutes(post.contentMarkdown)}\u00a0min`,
    likes: post.likesCount,
  };
}

function sortByPublication(
  posts: readonly BlogPost[],
  sortDir: PostsSortDirection,
): readonly BlogPost[] {
  const sign = sortDir === 'descending' ? -1 : 1;
  const time = (post: BlogPost): number => Date.parse(post.publishedAt ?? '');
  const dated = posts.filter((post) => post.publishedAt !== null);
  const undated = posts.filter((post) => post.publishedAt === null);
  return [...[...dated].sort((a, b) => sign * (time(a) - time(b))), ...undated];
}

export function toAdminPostsView(
  posts: readonly BlogPost[],
  filter: AdminPostsFilter,
  sortDir: PostsSortDirection,
): AdminPostsView {
  const published = posts.filter((post) => post.status === 'published').length;
  const counts: Record<AdminPostsFilter, number> = {
    all: posts.length,
    published,
    draft: posts.length - published,
  };
  const option = (value: AdminPostsFilter, label: string): FilterOption<AdminPostsFilter> => ({
    value,
    label,
    count: counts[value],
    disabled: counts[value] === 0,
  });
  const visible = filter === 'all' ? posts : posts.filter((post) => post.status === filter);
  return {
    filters: [option('all', 'Tous'), option('published', 'Publiés'), option('draft', 'Brouillons')],
    rows: sortByPublication(visible, sortDir).map(toRow),
  };
}
