import type { CartoucheRow } from '@shared/ui/cartouche';
import type { Fact } from '@shared/ui/fact-list';
import type { FilterOption } from '@shared/ui/filter-group';
import { countPostsByCategory } from '../domain/count-posts-by-category';
import { filterPostsByCategory } from '../domain/filter-posts-by-category';
import { filterPostsByTag } from '../domain/filter-posts-by-tag';
import type { BlogPost } from '../domain/models/blog-post.model';
import {
  BLOG_TAG_CATEGORIES,
  type BlogCategoryCounts,
  type BlogCategoryFilter,
} from '../domain/models/blog-tag.model';
import { readingTimeMinutes } from '../domain/reading-time';
import {
  articleCountLabel,
  BLOG_CATEGORY_FILTER_LABELS,
  readingTimeLabel,
  readLinkContext,
  SUBJECTS_FACT_LABEL,
} from './blog-list-copy';

const SUBJECTS_SIZE = 3;

export type BlogListFilter =
  | { readonly by: 'tag'; readonly tag: string }
  | { readonly by: 'category'; readonly category: BlogCategoryFilter };

export type BlogPostRowView = {
  readonly slug: string;
  readonly title: string;
  readonly excerpt: string;
  readonly publishedAt: string | null;
  readonly readingTime: string;
  readonly facts: readonly Fact[];
  readonly coverImage: string;
  readonly linkContext: string;
  readonly priority: boolean;
};

type BlogListView = {
  readonly total: number;
  readonly themes: readonly CartoucheRow[];
  readonly filters: readonly FilterOption<BlogCategoryFilter>[];
  readonly visibleCount: number;
  readonly rows: readonly BlogPostRowView[];
};

function subjectFacts(tags: readonly string[]): readonly Fact[] {
  return tags.length
    ? [{ label: SUBJECTS_FACT_LABEL, value: tags.slice(0, SUBJECTS_SIZE).join(' · ') }]
    : [];
}

function toRowView(post: BlogPost, priority: boolean): BlogPostRowView {
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    publishedAt: post.publishedAt,
    readingTime: readingTimeLabel(readingTimeMinutes(post.contentMarkdown)),
    facts: subjectFacts(post.tags),
    coverImage: post.coverImage,
    linkContext: readLinkContext(post.title),
    priority,
  };
}

function visiblePosts(
  posts: readonly BlogPost[],
  filter: BlogListFilter,
  counts: BlogCategoryCounts,
): readonly BlogPost[] {
  if (filter.by === 'tag') {
    return filterPostsByTag(posts, filter.tag);
  }
  const { category } = filter;
  return category !== 'all' && counts[category] === 0
    ? posts
    : filterPostsByCategory(posts, category);
}

export function toBlogListView(posts: readonly BlogPost[], filter: BlogListFilter): BlogListView {
  const counts = countPostsByCategory(posts);
  const [lcpPost] = posts;
  const visible = visiblePosts(posts, filter, counts);
  return {
    total: posts.length,
    themes: BLOG_TAG_CATEGORIES.map((category) => ({
      label: BLOG_CATEGORY_FILTER_LABELS[category],
      value: articleCountLabel(counts[category]),
    })),
    filters: [
      { value: 'all', label: BLOG_CATEGORY_FILTER_LABELS.all, count: posts.length },
      ...BLOG_TAG_CATEGORIES.map((category) => ({
        value: category,
        label: BLOG_CATEGORY_FILTER_LABELS[category],
        count: counts[category],
        disabled: counts[category] === 0,
      })),
    ],
    visibleCount: visible.length,
    rows: visible.map((post) => toRowView(post, post === lcpPost)),
  };
}
