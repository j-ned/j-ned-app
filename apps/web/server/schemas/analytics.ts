import { z } from 'zod';

export const trackEventSchema = z.object({
  type: z.enum(['page_view', 'project_click', 'article_view', 'cv_download', 'page_duration']),
  url: z.string().optional(),
  referrer: z.string().optional(),
  entityId: z.string().optional(),
  entityTitle: z.string().optional(),
  duration: z.number().int().optional(),
});
