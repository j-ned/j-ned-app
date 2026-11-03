import * as z from 'zod';

export const twoFactorDisableSchema = z.strictObject({
  password: z.string().min(12),
});
export type TwoFactorDisableDto = z.infer<typeof twoFactorDisableSchema>;
