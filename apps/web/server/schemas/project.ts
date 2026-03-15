import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string()),
  description: z.string().min(1),
  liveUrl: z.string().url().nullish(),
  repoUrl: z.string().url().nullish(),
  repoUrlFront: z.string().url().nullish(),
  repoUrlBack: z.string().url().nullish(),
  image: z.string().optional().default(''),
  featured: z.boolean().optional().default(false),
  order: z.number().int().optional().default(0),
});

export const updateProjectSchema = createProjectSchema.partial();
