import { z } from 'zod';

export const twoFactorEnableSchema = z.strictObject({
  code: z.string().length(6),
});
export type TwoFactorEnableDto = z.infer<typeof twoFactorEnableSchema>;
