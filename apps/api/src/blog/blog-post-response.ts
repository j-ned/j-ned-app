import type { BlogPost } from '../database/schema/blog-posts';

export type BlogPostResponse = BlogPost & { readonly wordCount: number };

// Sans le corps Markdown, qui ne sert qu'à la page de l'article et au flux RSS ; le nombre de mots
// reste : le site en tire le temps de lecture. Colonnes choisies une à une par `findPublishedSummaries`.
export type BlogPostSummary = Omit<BlogPostResponse, 'contentMarkdown'>;
