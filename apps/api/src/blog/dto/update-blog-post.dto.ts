import { z } from 'zod';
import { createBlogPostSchema } from './create-blog-post.dto';

/** Modification partielle ; `coverImage: null` retire la couverture (l'envoi passe par sa route). */
export const updateBlogPostSchema = createBlogPostSchema.partial().extend({
  coverImage: z.null().optional(),
});
export type UpdateBlogPostDto = z.infer<typeof updateBlogPostSchema>;
