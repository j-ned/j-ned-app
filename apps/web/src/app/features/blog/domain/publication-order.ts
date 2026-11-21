import type { BlogPost } from './models/blog-post.model';

export const isPublished = (post: Pick<BlogPost, 'status'>): boolean => post.status === 'published';

export const byNewestPublication = (
  a: Pick<BlogPost, 'publishedAt'>,
  b: Pick<BlogPost, 'publishedAt'>,
): number => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '');
