import type { Project } from '../database/schema/projects';
import type { ProjectImage } from '../database/schema/project-images';

// Calibrés pour un seul administrateur et 3 à 5 captures visées.
export const PROJECT_GALLERY_MAX = 12;
export const PROJECT_IMAGE_ALT_MAX = 300;

export type ProjectImageResponse = {
  readonly id: string;
  readonly url: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
  readonly order: number;
};

export type ProjectResponse = Project & {
  readonly gallery: readonly ProjectImageResponse[];
};

// URL publique à la place de la clé S3, jamais exposée.
export function toImageResponse(
  row: ProjectImage,
  toUrl: (key: string) => string,
): ProjectImageResponse {
  return {
    id: row.id,
    url: toUrl(row.key),
    alt: row.alt,
    width: row.width,
    height: row.height,
    order: row.order,
  };
}

// La date d'ajout départage deux captures au même rang.
const byDisplayOrder = (a: ProjectImage, b: ProjectImage): number =>
  a.order - b.order || a.createdAt.getTime() - b.createdAt.getTime();

// Un projet sans capture n'a pas d'entrée : l'appelant lui donne `[]`.
export function groupGalleryByProject(
  rows: readonly ProjectImage[],
  toUrl: (key: string) => string,
): ReadonlyMap<string, readonly ProjectImageResponse[]> {
  const gallery = new Map<string, ProjectImageResponse[]>();
  for (const row of [...rows].sort(byDisplayOrder)) {
    gallery.set(row.projectId, [
      ...(gallery.get(row.projectId) ?? []),
      toImageResponse(row, toUrl),
    ]);
  }
  return gallery;
}

// Après la dernière, même si les rangs existants ont des trous.
export function nextGalleryOrder(
  rows: readonly Pick<ProjectImage, 'order'>[],
): number {
  return rows.reduce((max, row) => Math.max(max, row.order + 1), 0);
}

// Liste exacte exigée (aucune manquante, en trop ni en double) : sinon une capture ajoutée entre-temps
// perdrait silencieusement son rang.
export function isPermutationOf(
  currentIds: readonly string[],
  requestedIds: readonly string[],
): boolean {
  const requested = new Set(requestedIds);
  return (
    requested.size === requestedIds.length &&
    requestedIds.length === currentIds.length &&
    currentIds.every((id) => requested.has(id))
  );
}
