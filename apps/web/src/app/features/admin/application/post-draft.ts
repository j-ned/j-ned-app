import type { BlogPost, BlogPostInput } from '@features/blog/domain/models/blog-post.model';

export type PostDraft = {
  title: string;
  excerpt: string;
  contentMarkdown: string;
  status: BlogPost['status'];
};

export function toPostDraft(post: BlogPost | null): PostDraft {
  return {
    title: post?.title ?? '',
    excerpt: post?.excerpt ?? '',
    contentMarkdown: post?.contentMarkdown ?? '',
    status: post?.status ?? 'draft',
  };
}

export function toPostInput(draft: PostDraft, tags: ReadonlySet<string>): BlogPostInput {
  return {
    title: draft.title,
    excerpt: draft.excerpt,
    contentMarkdown: draft.contentMarkdown,
    tags: [...tags],
    status: draft.status,
  };
}

export function toPreviewPost(
  draft: PostDraft,
  tags: ReadonlySet<string>,
  base: BlogPost | null,
): BlogPost {
  return {
    ...toPostInput(draft, tags),
    id: base?.id ?? '',
    slug: base?.slug ?? '',
    coverImage: base?.coverImage ?? '',
    likesCount: base?.likesCount ?? 0,
    publishedAt: base?.publishedAt ?? null,
    updatedAt: base?.updatedAt ?? '',
  };
}

export function findPostById(posts: readonly BlogPost[], id: string): BlogPost | null {
  return posts.find((post) => post.id === id) ?? null;
}
