import { z } from 'zod';

export const createCommentSchema = z.object({
  articleId: z.string().min(1),
  author: z.string().min(1),
  content: z.string().min(1),
  date: z.string().min(1),
  email: z.string().email().optional().default(''),
  rating: z.number().int().min(0).max(5).optional().default(0),
});

export const updateCommentSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  featured: z.boolean().optional(),
});
