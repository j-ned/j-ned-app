import * as z from 'zod';

/**
 * Second facteur : `code` (TOTP) ou `backupCode`, pas les deux. Aucun des deux : le service répond
 * 401 (« Either code or backupCode is required »).
 */
export const twoFactorVerifySchema = z
  .strictObject({
    challengeToken: z.string().min(1),
    code: z.string().length(6).optional(),
    backupCode: z
      .string()
      .regex(/^[a-z0-9]{4}-[a-z0-9]{4}$/)
      .optional(),
  })
  .refine((dto) => dto.code === undefined || dto.backupCode === undefined, {
    path: ['code'],
    error: 'Exactly one of [code, backupCode] must be provided (got: 2)',
  });
export type TwoFactorVerifyDto = z.infer<typeof twoFactorVerifySchema>;
