import { z } from 'zod';

export const createContactMessageSchema = z.strictObject({
  name: z.string().min(1).max(200),
  email: z.email().max(320),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
  /** Champ piège : invisible pour un humain, rempli par un robot. Déclaré pour passer la liste blanche. */
  website: z.string().max(200).optional(),
});
export type CreateContactMessageDto = z.infer<
  typeof createContactMessageSchema
>;
