import { z } from 'zod';

export const updateHeroSchema = z.object({
  name: z.string().min(1).optional(),
  tagline: z.string().min(1).optional(),
  availability: z.string().min(1).optional(),
});

export const createServicePricingSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  price: z.string().min(1),
  features: z.array(z.string()).optional().default([]),
  highlighted: z.boolean().optional().default(false),
  enabled: z.boolean().optional().default(true),
  order: z.number().int().optional().default(0),
});

export const updateServicePricingSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  price: z.string().min(1).optional(),
  features: z.array(z.string()).optional(),
  highlighted: z.boolean().optional(),
  enabled: z.boolean().optional(),
  order: z.number().int().optional(),
});

export const createHomeHighlightSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().min(1),
  order: z.number().int().optional().default(0),
});

export const updateHomeHighlightSchema = createHomeHighlightSchema.partial();
