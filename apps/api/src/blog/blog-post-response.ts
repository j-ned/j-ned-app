import type { BlogPost } from '../database/schema/blog-posts';

export type BlogPostResponse = BlogPost & { readonly wordCount: number };

// Sans le corps Markdown, qui ne sert qu'à la page de l'article et au flux RSS ; le nombre de mots
// reste : le site en tire le temps de lecture.
export type BlogPostSummary = Omit<BlogPostResponse, 'contentMarkdown'>;

// Champ par champ : une colonne ajoutée au schéma ne part pas dans les listes sans décision.
export function toBlogPostSummary(post: BlogPostResponse): BlogPostSummary {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    tags: post.tags,
    status: post.status,
    likesCount: post.likesCount,
    publishedAt: post.publishedAt,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    wordCount: post.wordCount,
  };
}
