import { z } from 'zod';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().regex(passwordRegex, {
    message: 'Password must contain at least 8 characters, one uppercase, one lowercase, one digit, and one special character',
  }),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  twoFactorCode: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().regex(passwordRegex),
});

export const twoFactorSchema = z.object({
  code: z.string().length(6),
});

export const disableTwoFactorSchema = z.object({
  password: z.string().min(1),
});

export const twoFactorVerifySchema = z.object({
  email: z.string().email(),
  twoFactorCode: z.string().length(6),
});
