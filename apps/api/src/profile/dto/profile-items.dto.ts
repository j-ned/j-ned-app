import * as z from 'zod';
import {
  PROFILE_LIMITS,
  PROFILE_TECHNOLOGY_ICON_PATTERN,
} from '../profile-limits';
import { profileText } from './profile-text';

const L = PROFILE_LIMITS;

export const profileBiographySchema = z.strictObject({
  title: profileText(L.biography.title),
  summary: profileText(L.biography.summary),
  leadEmphasis: profileText(L.biography.leadEmphasis),
  paragraphs: z
    .array(profileText(L.biography.paragraph))
    .min(1)
    .max(L.biography.paragraphs),
});
export type ProfileBiographyDto = z.infer<typeof profileBiographySchema>;

export const profileHighlightSchema = z.strictObject({
  id: z.uuid(),
  title: profileText(L.highlight.title),
  description: profileText(L.highlight.description),
});
export type ProfileHighlightDto = z.infer<typeof profileHighlightSchema>;

export const profileWhatIDoSchema = z.strictObject({
  id: z.uuid(),
  title: profileText(L.whatIDo.title),
  description: profileText(L.whatIDo.description),
});
export type ProfileWhatIDoDto = z.infer<typeof profileWhatIDoSchema>;

export const profileTechnologySchema = z.strictObject({
  id: z.uuid(),
  name: profileText(L.technology.name),
  category: profileText(L.technology.category),
  icon: z.string().regex(PROFILE_TECHNOLOGY_ICON_PATTERN),
});
export type ProfileTechnologyDto = z.infer<typeof profileTechnologySchema>;

export const profileDiplomaSchema = z.strictObject({
  id: z.uuid(),
  title: profileText(L.diploma.title),
  provider: profileText(L.diploma.provider),
  level: profileText(L.diploma.level),
  shortDescription: profileText(L.diploma.shortDescription),
  skills: z.array(profileText(L.diploma.skill)).min(1).max(L.diploma.skills),
});
export type ProfileDiplomaDto = z.infer<typeof profileDiplomaSchema>;

export const profileMotivationSchema = z.strictObject({
  title: profileText(L.motivation.title),
  statement: profileText(L.motivation.statement),
  description: profileText(L.motivation.description),
});
export type ProfileMotivationDto = z.infer<typeof profileMotivationSchema>;
