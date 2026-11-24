import * as z from 'zod';

export const twoFactorEnableSchema = z.strictObject({
  password: z.string().min(12),
  code: z.string().length(6),
});
export type TwoFactorEnableDto = z.infer<typeof twoFactorEnableSchema>;
