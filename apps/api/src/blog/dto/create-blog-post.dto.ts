import * as z from 'zod';

export const createBlogPostSchema = z.strictObject({
  title: z.string().min(1).max(200),
  excerpt: z.string().min(1).max(300),
  contentMarkdown: z.string().min(1).max(50000),
  tags: z.array(z.string().max(50)).max(15).optional(),
  status: z.enum(['draft', 'published']).optional(),
});
export type CreateBlogPostDto = z.infer<typeof createBlogPostSchema>;
