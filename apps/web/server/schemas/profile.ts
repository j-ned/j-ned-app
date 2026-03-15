import { z } from 'zod';

export const updateProfileInfoSchema = z.object({
  displayName: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  avatarUrl: z.string().optional(),
  isAvailable: z.boolean().optional(),
  availabilityMessage: z.string().optional(),
});

export const updateBiographySchema = z.object({
  title: z.string().min(1).optional(),
  paragraphs: z.array(z.string()).optional(),
});

export const createSocialLinkSchema = z.object({
  icon: z.string().min(1),
  label: z.string().min(1),
  href: z.string().url(),
});

export const updateSocialLinkSchema = createSocialLinkSchema.partial();

export const createDiplomaSchema = z.object({
  title: z.string().min(1),
  provider: z.string().min(1),
  shortDescription: z.string().min(1),
  skills: z.array(z.string()).optional().default([]),
});

export const updateDiplomaSchema = createDiplomaSchema.partial();

export const createTechnologySchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  icon: z.string().min(1),
});

export const updateTechnologySchema = createTechnologySchema.partial();

export const createHighlightSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().min(1),
});

export const updateHighlightSchema = createHighlightSchema.partial();

export const createExpertiseSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

export const updateExpertiseSchema = createExpertiseSchema.partial();

export const createAspirationSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

export const updateAspirationSchema = createAspirationSchema.partial();
