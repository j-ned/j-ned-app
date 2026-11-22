import { randomUUID } from 'node:crypto';
import {
  NotFoundException,
  UnprocessableEntityException,
} from '../common/http-errors';
import { and, eq, inArray } from 'drizzle-orm';
import { findByIdOrFail } from '../common/crud-helpers';
import { projects, type Project } from '../database/schema/projects';
import type { UploadedFile } from '../common/http';
import type { Database } from '../database/drizzle.types';
import {
  projectImages,
  type ProjectImage,
} from '../database/schema/project-images';
import { contentHash, deleteS3IfExists } from '../storage/s3-utils';
import { STORAGE_BUCKET, StorageService } from '../storage/storage.service';
import { ImageOptimizer } from '../storage/image-optimizer.service';
import {
  groupGalleryByProject,
  isPermutationOf,
  nextGalleryOrder,
  PROJECT_GALLERY_MAX,
  toImageResponse,
  type ProjectImageResponse,
} from './project-gallery';
import { insertedRow } from '../common/rows';
import { nextVersion } from '../common/entity-version';

// La galerie fait partie du projet édité : chaque écriture change sa version, dans la même transaction.
async function bumpProjectVersion(
  tx: Database,
  projectId: string,
): Promise<void> {
  await tx
    .update(projects)
    .set({ version: nextVersion(projects) })
    .where(eq(projects.id, projectId));
}

// Une capture = une ligne `project_image` + un objet S3.
export class ProjectImagesService {
  constructor(
    private readonly db: Database,
    private readonly storage: StorageService,
    private readonly images: ImageOptimizer,
  ) {}

  // En une requête : la liste publique n'a pas de N+1.
  async galleryOf(
    projectIds: readonly string[],
  ): Promise<ReadonlyMap<string, readonly ProjectImageResponse[]>> {
    if (projectIds.length === 0) return new Map();
    const rows = await this.db
      .select()
      .from(projectImages)
      .where(inArray(projectImages.projectId, [...projectIds]));
    return groupGalleryByProject(rows, this.toUrl);
  }

  // S3 puis base, comme la couverture : un échec d'insertion laisse un orphelin S3, jamais une ligne
  // qui pointe vers un objet absent.
  async upload(
    projectId: string,
    file: UploadedFile,
    alt: string,
  ): Promise<ProjectImageResponse> {
    await findByIdOrFail<Project>(this.db, projects, projectId, 'Project');
    const current = await this.rowsOf(projectId);
    if (current.length >= PROJECT_GALLERY_MAX) {
      throw new UnprocessableEntityException(
        `Gallery is full: ${PROJECT_GALLERY_MAX} images max per project`,
      );
    }

    const image = await this.images.optimize(file.buffer);
    const id = randomUUID();
    const key = `project-images/${id}-${contentHash(image.buffer)}.${image.ext}`;
    await this.storage.upload(
      STORAGE_BUCKET,
      key,
      image.buffer,
      image.mimetype,
    );

    const row = await this.db.transaction(async (tx) => {
      const rows = await tx
        .insert(projectImages)
        .values({
          id,
          projectId,
          key,
          alt,
          width: image.width,
          height: image.height,
          order: nextGalleryOrder(current),
        })
        .returning();
      await bumpProjectVersion(tx, projectId);
      return insertedRow(rows);
    });
    return toImageResponse(row, this.toUrl);
  }

  async updateAlt(
    projectId: string,
    imageId: string,
    alt: string,
  ): Promise<ProjectImageResponse> {
    const row = await this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(projectImages)
        .set({ alt, updatedAt: new Date() })
        .where(this.imageOf(projectId, imageId))
        .returning();
      if (!updated) throw this.imageNotFound(projectId, imageId);
      await bumpProjectVersion(tx, projectId);
      return updated;
    });
    return toImageResponse(row, this.toUrl);
  }

  // Base d'abord, S3 ensuite : un orphelin S3 plutôt qu'une ligne vers un objet effacé.
  async remove(projectId: string, imageId: string): Promise<void> {
    const row = await this.db.transaction(async (tx) => {
      const [deleted] = await tx
        .delete(projectImages)
        .where(this.imageOf(projectId, imageId))
        .returning();
      if (!deleted) throw this.imageNotFound(projectId, imageId);
      await bumpProjectVersion(tx, projectId);
      return deleted;
    });
    await deleteS3IfExists(this.storage, STORAGE_BUCKET, row.key);
  }

  // En une transaction ; 422 si la liste n'est pas exactement la galerie.
  async reorder(
    projectId: string,
    imageIds: readonly string[],
  ): Promise<readonly ProjectImageResponse[]> {
    return this.db.transaction(async (tx) => {
      await findByIdOrFail<Project>(tx, projects, projectId, 'Project');
      const rows = await this.rowsOf(projectId, tx);
      if (
        !isPermutationOf(
          rows.map((r) => r.id),
          imageIds,
        )
      ) {
        throw new UnprocessableEntityException(
          'imageIds must list every image of the project exactly once',
        );
      }

      const updatedAt = new Date();
      for (const [order, id] of imageIds.entries()) {
        await tx
          .update(projectImages)
          .set({ order, updatedAt })
          .where(this.imageOf(projectId, id));
      }
      await bumpProjectVersion(tx, projectId);

      const reordered = rows.map((r) => ({
        ...r,
        order: imageIds.indexOf(r.id),
      }));
      return groupGalleryByProject(reordered, this.toUrl).get(projectId) ?? [];
    });
  }

  // Lues avant la suppression d'un projet : la cascade efface les lignes.
  async keysOf(projectId: string): Promise<string[]> {
    const rows = await this.db
      .select({ key: projectImages.key })
      .from(projectImages)
      .where(eq(projectImages.projectId, projectId));
    return rows.map((r) => r.key);
  }

  // Une capture n'est trouvée que sous son propre projet : un imageId étranger donne 404.
  private imageOf(projectId: string, imageId: string) {
    return and(
      eq(projectImages.id, imageId),
      eq(projectImages.projectId, projectId),
    );
  }

  private imageNotFound(projectId: string, imageId: string) {
    return new NotFoundException(
      `Image ${imageId} not found in project ${projectId}`,
    );
  }

  private rowsOf(
    projectId: string,
    db: Database = this.db,
  ): Promise<ProjectImage[]> {
    return db
      .select()
      .from(projectImages)
      .where(eq(projectImages.projectId, projectId));
  }

  private readonly toUrl = (key: string): string =>
    this.storage.getPublicUrl(STORAGE_BUCKET, key);
}
