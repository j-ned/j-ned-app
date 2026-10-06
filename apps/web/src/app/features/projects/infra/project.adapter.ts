import { isProjectKind } from '../domain/is-project-kind';
import type { Project, ProjectImage } from '../domain/models/project.model';
import type { ProjectDto, ProjectImageDto } from './project.types';

function resolveUrl(url: string, apiUrl: string): string {
  return url && !url.startsWith('http') ? `${apiUrl}${url}` : url;
}

function toNullableText(value: string | null | undefined): string | null {
  return value?.trim() || null;
}

export function toProjectImage(dto: ProjectImageDto, apiUrl: string): ProjectImage {
  return {
    id: dto.id,
    src: resolveUrl(dto.url, apiUrl),
    alt: dto.alt,
    width: dto.width,
    height: dto.height,
  };
}

export function toProject(dto: ProjectDto, apiUrl: string): Project {
  const { kind, gallery = [], pitch, highlight, scope, ...fields } = dto;
  return {
    ...fields,
    image: resolveUrl(dto.image, apiUrl),
    kind: isProjectKind(kind) ? kind : null,
    gallery: [...gallery]
      .sort((a, b) => a.order - b.order)
      .map((image) => toProjectImage(image, apiUrl)),
    pitch: toNullableText(pitch),
    highlight: toNullableText(highlight),
    scope: toNullableText(scope),
  };
}
