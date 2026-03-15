import { z } from 'zod';

export const createBookingSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:mm format'),
  duration: z.number().int().min(15),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  subject: z.string().min(1),
  message: z.string().min(1),
});

export const createDisabledDateSchema = z.object({
  date: z.string().min(1),
  reason: z.string().optional(),
});
