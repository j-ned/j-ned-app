import { and, eq } from 'drizzle-orm';
import { blogPosts } from '../database/schema/blog-posts';

// Un brouillon ou un article dépublié répond 404 exactement comme un slug inconnu, en lecture comme
// en écriture publique (like, commentaire).
export function publishedSlugFilter(slug: string) {
  return and(eq(blogPosts.slug, slug), eq(blogPosts.status, 'published'));
}
