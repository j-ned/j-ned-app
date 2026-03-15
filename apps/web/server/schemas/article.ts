import { z } from 'zod';

export const createArticleSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  date: z.string().min(1),
  excerpt: z.string().min(1),
  content: z.string().min(1),
  image: z.string().optional().default(''),
  tags: z.array(z.string()).optional().default([]),
  featured: z.boolean().optional().default(false),
});

export const updateArticleSchema = createArticleSchema.partial();
