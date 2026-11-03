import * as z from 'zod';

export const loginSchema = z.strictObject({
  email: z.email(),
  password: z.string().min(12),
});
export type LoginDto = z.infer<typeof loginSchema>;
