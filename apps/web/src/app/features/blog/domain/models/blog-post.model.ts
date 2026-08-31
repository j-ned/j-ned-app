export type BlogPost = {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly excerpt: string;
  readonly contentMarkdown: string;
  readonly coverImage: string;
  readonly tags: readonly string[];
  readonly status: 'draft' | 'published';
  readonly likesCount: number;
  readonly publishedAt: string | null;
};

// Payload d'écriture. `id`, `slug`, `likesCount`, `publishedAt` gérés serveur ;
// `coverImage` transite par uploadCoverImage (POST /:id/image), jamais en string ici.
export type BlogPostInput = Pick<BlogPost, 'title' | 'excerpt' | 'contentMarkdown' | 'tags' | 'status'>;
