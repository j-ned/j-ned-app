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
      const [row] = await this.db
        .insert(projects)
        .values({ ...dto, slug })
        .returning();
      return this.toResponse(row, []);
    } catch (err) {
      if (isUniqueViolation(err, 'slug')) {
        throw new ConflictException(
          `Project with slug "${slug}" already exists`,
        );
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateProjectDto): Promise<ProjectResponse> {
    const current = await this.findByIdRaw(id);

    // image extrait du spread : il ne peut être que null ou undefined côté DTO,
    // mais on ne veut jamais qu'il soit propagé tel quel dans le patch DB
    // (la column est NOT NULL DEFAULT '').
    const { image, ...rest } = dto;
    const patch: Partial<NewProject> = { ...rest, updatedAt: new Date() };
    if (dto.title !== undefined) patch.slug = slugify(dto.title);
    if (image === null) patch.image = '';

    let row: Project;
    try {
      [row] = await this.db
        .update(projects)
        .set(patch)
        .where(eq(projects.id, id))
        .returning();
    } catch (err) {
      if (isUniqueViolation(err, 'slug')) {
        throw new ConflictException(
          `Project with slug "${patch.slug}" already exists`,
        );
      }
      throw err;
    }

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

  async uploadImage(id: string, file: UploadedFile): Promise<ProjectResponse> {
    const current = await this.findByIdRaw(id);
    // Ordre : upload → update DB → cleanup ancienne clé. Si une étape échoue, on préfère un orphelin S3
    // (cleanup manuel possible) à une DB qui référence une clé supprimée (image cassée côté front).
    const newKey = await storeOptimizedImage(
      this.storage,
      this.images,
      `projects/${id}`,
      file.buffer,
    );

    const [row] = await this.db
      .update(projects)
      .set({ image: newKey, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();

    if (current.image !== newKey) {
      await deleteS3IfExists(this.storage, STORAGE_BUCKET, current.image);
    }

    return this.toResponse(row, await this.galleryOfOne(id));
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

  // Transforme la key DB en URL publique pour la sortie API, galerie jointe (ADR-0009 §4).
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
