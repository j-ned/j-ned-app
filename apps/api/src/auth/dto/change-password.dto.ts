import * as z from 'zod';

export const changePasswordSchema = z.strictObject({
  currentPassword: z.string().min(12),
  newPassword: z.string().min(12),
});
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
