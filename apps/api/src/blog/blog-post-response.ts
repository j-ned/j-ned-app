import type { BlogPost } from '../database/schema/blog-posts';

/** Article tel que l'API le renvoie : couverture en URL publique, nombre de mots du corps. */
export type BlogPostResponse = BlogPost & { readonly wordCount: number };

/**
 * Article d'une liste publique : tout sauf le corps Markdown, qui ne sert qu'à la page de l'article et
 * au flux RSS. Son nombre de mots reste : le site en tire le temps de lecture.
 */
export type BlogPostSummary = Omit<BlogPostResponse, 'contentMarkdown'>;

/** Champ par champ : une colonne ajoutée au schéma ne part pas dans les listes sans décision. */
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
