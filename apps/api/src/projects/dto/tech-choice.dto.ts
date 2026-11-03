import * as z from 'zod';

export const techChoiceSchema = z.strictObject({
  techno: z.string().min(1).max(100),
  why: z.string().min(1).max(500),
});
export type TechChoiceDto = z.infer<typeof techChoiceSchema>;
