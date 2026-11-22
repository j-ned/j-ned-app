import { ConflictException } from '../common/http-errors';
import { Logger } from '../common/logger';
import { asc, desc, eq } from 'drizzle-orm';
import type { UploadedFile } from '../common/http';
import type { Database } from '../database/drizzle.types';
import {
  projects,
  type NewProject,
  type Project,
} from '../database/schema/projects';
import { STORAGE_BUCKET, StorageService } from '../storage/storage.service';
import { ImageOptimizer } from '../storage/image-optimizer.service';
import { deleteS3IfExists, storeOptimizedImage } from '../storage/s3-utils';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import type { ProjectImageResponse, ProjectResponse } from './project-gallery';
import { ProjectImagesService } from './project-images.service';
import { findByIdOrFail } from '../common/crud-helpers';
import { isUniqueViolation, slugify } from '../common/utils';
import { insertedRow } from '../common/rows';
import {
  assertVersion,
  missedWrite,
  nextVersion,
  versionedRow,
} from '../common/entity-version';

const STALE_PROJECT =
  'Une version plus récente de ce projet a été enregistrée ailleurs : recharge-le avant d’enregistrer.';

export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly db: Database,
    private readonly storage: StorageService,
    private readonly images: ImageOptimizer,
    private readonly gallery: ProjectImagesService,
  ) {}

  async findAll(): Promise<ProjectResponse[]> {
    const rows = await this.db
      .select()
      .from(projects)
      .orderBy(asc(projects.order), desc(projects.createdAt));
    const galleries = await this.gallery.galleryOf(rows.map((r) => r.id));
    return rows.map((r) => this.toResponse(r, galleries.get(r.id) ?? []));
  }

  async findById(id: string): Promise<ProjectResponse> {
    const row = await this.findByIdRaw(id);
    return this.toResponse(row, await this.galleryOfOne(id));
  }

  async create(dto: CreateProjectDto): Promise<ProjectResponse> {
    const slug = slugify(dto.title);
    try {
      const rows = await this.db
        .insert(projects)
        .values({ ...dto, slug })
        .returning();
      return this.toResponse(insertedRow(rows), []);
    } catch (err) {
      if (isUniqueViolation(err, 'slug')) {
        throw new ConflictException(
          `Project with slug "${slug}" already exists`,
        );
      }
      throw err;
    }
  }

  // `expectedVersion` (If-Match) : écriture refusée en 409 si le projet a changé depuis cette version.
  async update(
    id: string,
    dto: UpdateProjectDto,
    expectedVersion?: number,
  ): Promise<ProjectResponse> {
    const current = await this.findByIdRaw(id);
    assertVersion(current, expectedVersion, STALE_PROJECT);

    // image extrait du spread : il ne peut être que null ou undefined côté DTO,
    // mais on ne veut jamais qu'il soit propagé tel quel dans le patch DB
    // (la column est NOT NULL DEFAULT '').
    const { image, ...rest } = dto;
    const patch: { [K in keyof NewProject]?: NewProject[K] | undefined } = {
      ...rest,
      updatedAt: new Date(),
    };
    if (dto.title !== undefined) patch.slug = slugify(dto.title);
    if (image === null) patch.image = '';

    let rows: Project[];
    try {
      rows = await this.db
        .update(projects)
        .set({ ...patch, version: nextVersion(projects) })
        .where(versionedRow(projects, id, expectedVersion))
        .returning();
    } catch (err) {
      if (isUniqueViolation(err, 'slug')) {
        throw new ConflictException(
          `Project with slug "${patch.slug}" already exists`,
        );
      }
      throw err;
    }
    const row = rows[0] ?? (await this.missedWrite(id, expectedVersion));

    // S3 cleanup APRÈS le write DB réussi : si le write échoue, on préfère
    // garder l'objet S3 (orphelin DB-cohérent) plutôt qu'une DB cassée.
    if (image === null) {
      await deleteS3IfExists(this.storage, STORAGE_BUCKET, current.image);
    }

    return this.toResponse(row, await this.galleryOfOne(id));
  }

  async remove(id: string): Promise<void> {
    const current = await this.findByIdRaw(id);
    // Les lignes de galerie partent par cascade : leurs clés S3 sont lues avant, effacées après.
    const galleryKeys = await this.gallery.keysOf(id);
    await this.db.delete(projects).where(eq(projects.id, id));

    // La ligne est partie : un échec S3 ne laisse qu'un orphelin, logué, jamais une erreur 500.
    const keys = [current.image, ...galleryKeys];
    const results = await Promise.allSettled(
      keys.map((key) => deleteS3IfExists(this.storage, STORAGE_BUCKET, key)),
    );
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        this.logger.error(
          `S3 orphan after deleting project ${id}: ${keys[i]}`,
          result.reason instanceof Error
            ? result.reason.stack
            : String(result.reason),
        );
      }
    });
  }

  async uploadImage(
    id: string,
    file: UploadedFile,
    expectedVersion?: number,
  ): Promise<ProjectResponse> {
    const current = await this.findByIdRaw(id);
    assertVersion(current, expectedVersion, STALE_PROJECT);
    // Ordre : upload → update DB → cleanup ancienne clé. Si une étape échoue, on préfère un orphelin S3
    // (cleanup manuel possible) à une DB qui référence une clé supprimée (image cassée côté front).
    const newKey = await storeOptimizedImage(
      this.storage,
      STORAGE_BUCKET,
      this.images,
      `projects/${id}`,
      file.buffer,
    );

    // Version périmée entre-temps : la nouvelle clé reste un orphelin S3, comme un échec d'écriture.
    const [row] = await this.db
      .update(projects)
      .set({
        image: newKey,
        version: nextVersion(projects),
        updatedAt: new Date(),
      })
      .where(versionedRow(projects, id, expectedVersion))
      .returning();
    if (row === undefined) return this.missedWrite(id, expectedVersion);

    if (current.image !== newKey) {
      await deleteS3IfExists(this.storage, STORAGE_BUCKET, current.image);
    }

    return this.toResponse(row, await this.galleryOfOne(id));
  }

  private missedWrite(id: string, expectedVersion: number | undefined) {
    return missedWrite(this.db, projects, id, expectedVersion, {
      notFound: `Project ${id} not found`,
      stale: STALE_PROJECT,
    });
  }

  // Helper privé : retourne la row brute (sans transformation URL).
  // Utilisé par toutes les opérations internes qui ont besoin de la key S3.
  private findByIdRaw(id: string): Promise<Project> {
    return findByIdOrFail<Project>(this.db, projects, id, 'Project');
  }

  private async galleryOfOne(
    id: string,
  ): Promise<readonly ProjectImageResponse[]> {
    return (await this.gallery.galleryOf([id])).get(id) ?? [];
  }

  // Clé S3 remplacée par son URL publique, galerie jointe.
  private toResponse(
    p: Project,
    gallery: readonly ProjectImageResponse[],
  ): ProjectResponse {
    return {
      ...p,
      gallery,
      image: p.image ? this.storage.getPublicUrl(STORAGE_BUCKET, p.image) : '',
    };
  }
}
