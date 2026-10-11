import type { Highlight } from '../domain/models/highlight.model';
import type { ProfileDocument } from '../domain/models/profile-content.model';
import type { WhatIDo } from '../domain/models/what-i-do.model';
import type { ProfileDto } from './profile.types';

const toItem = ({
  id,
  title,
  description,
}: ProfileDto['highlights'][number]): Highlight & WhatIDo => ({
  id,
  title,
  description,
});

export function toProfileDocument(dto: ProfileDto, storageBase: string): ProfileDocument {
  const { biography, motivation } = dto;
  return {
    version: dto.version,
    updatedAt: dto.updatedAt,
    content: {
      biography: {
        title: biography.title,
        summary: biography.summary,
        leadEmphasis: biography.leadEmphasis,
        paragraphs: [...biography.paragraphs],
      },
      highlights: dto.highlights.map(toItem),
      workSummary: dto.workSummary,
      whatIDo: dto.whatIDo.map(toItem),
      technologies: dto.technologies.map(({ id, name, category, icon }) => ({
        id,
        name,
        category,
        icon,
      })),
      diplomasSummary: dto.diplomasSummary,
      diplomas: dto.diplomas.map(({ id, title, provider, level, shortDescription, skills }) => ({
        id,
        title,
        provider,
        level,
        shortDescription,
        skills: [...skills],
      })),
      motivation: {
        title: motivation.title,
        statement: motivation.statement,
        description: motivation.description,
      },
    },
    portraitUrl: dto.portrait === null ? null : `${storageBase}${dto.portrait}`,
  };
}
