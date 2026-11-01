import { isProjectKind } from '../domain/is-project-kind';
import type { Project, ProjectImage } from '../domain/models/project.model';
import type { ProjectDto, ProjectImageDto } from './project.types';

function resolveUrl(url: string, storageBase: string): string {
  return url && !url.startsWith('http') ? `${storageBase}${url}` : url;
}

function toNullableText(value: string | null | undefined): string | null {
  return value?.trim() || null;
}

export function toProjectImage(dto: ProjectImageDto, storageBase: string): ProjectImage {
  return {
    id: dto.id,
    src: resolveUrl(dto.url, storageBase),
    alt: dto.alt,
    width: dto.width,
    height: dto.height,
  };
}

export function toProject(dto: ProjectDto, storageBase: string): Project {
  const { kind, gallery = [], pitch, highlight, scope, ...fields } = dto;
  return {
    ...fields,
    image: resolveUrl(dto.image, storageBase),
    kind: isProjectKind(kind) ? kind : null,
    gallery: [...gallery]
      .sort((a, b) => a.order - b.order)
      .map((image) => toProjectImage(image, storageBase)),
    pitch: toNullableText(pitch),
    highlight: toNullableText(highlight),
    scope: toNullableText(scope),
  };
}
