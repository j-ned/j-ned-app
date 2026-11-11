import { ConflictException, NotFoundException } from '../common/http-errors';
import { Logger } from '../common/logger';
import type { UploadedFile } from '../common/http';
import { and, desc, eq, sql } from 'drizzle-orm';
import type { Database } from '../database/drizzle.types';
import {
  blogPosts,
  type NewBlogPost,
  type BlogPost,
} from '../database/schema/blog-posts';
import { STORAGE_BUCKET, StorageService } from '../storage/storage.service';
import { ImageOptimizer } from '../storage/image-optimizer.service';
import { deleteS3IfExists, storeOptimizedImage } from '../storage/s3-utils';
import type { BlogPostResponse } from './blog-post-response';
import { contentImageKeysIn } from './blog-content-image';
import { BlogContentImagesService } from './blog-content-images.service';
import { countWords } from './word-count';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { findByIdOrFail } from '../common/crud-helpers';
import { isUniqueViolation, slugify } from '../common/utils';

export class BlogService {
  private readonly logger = new Logger(BlogService.name);

  constructor(
    private readonly db: Database,
    private readonly storage: StorageService,
    private readonly images: ImageOptimizer,
    private readonly contentImages: BlogContentImagesService,
  ) {}

  async findAllPublished(): Promise<BlogPostResponse[]> {
    const rows = await this.db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.status, 'published'))
      .orderBy(desc(blogPosts.publishedAt));
    return rows.map((r) => this.toResponse(r));
  }

  async findAllForAdmin(): Promise<BlogPostResponse[]> {
    const rows = await this.db
      .select()
      .from(blogPosts)
      .orderBy(desc(blogPosts.createdAt));
    return rows.map((r) => this.toResponse(r));
  }

  async findBySlug(slug: string): Promise<BlogPostResponse> {
    const rows = await this.db
      .select()
      .from(blogPosts)
      .where(this.publishedSlugFilter(slug))
      .limit(1);
    if (rows.length === 0) {
      throw new NotFoundException(`Blog post "${slug}" not found`);
    }
    return this.toResponse(rows[0]);
  }

  async create(dto: CreateBlogPostDto): Promise<BlogPostResponse> {
    const slug = slugify(dto.title);
    const publishedAt = dto.status === 'published' ? new Date() : null;
    try {
      const [row] = await this.db
        .insert(blogPosts)
        .values({ ...dto, slug, publishedAt })
        .returning();
      return this.toResponse(row);
    } catch (err) {
      if (isUniqueViolation(err, 'slug')) {
        throw new ConflictException(
          `Blog post with slug "${slug}" already exists`,
        );
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateBlogPostDto): Promise<BlogPostResponse> {
    const current = await this.findByIdRaw(id);

    // coverImage extrait du spread : il ne peut être que null ou undefined
    // côté DTO (upload géré par POST /:id/image), mais on ne veut jamais
    // qu'il soit propagé tel quel dans le patch DB (colonne NOT NULL DEFAULT '').
    const { coverImage, ...rest } = dto;
    const patch: Partial<NewBlogPost> = { ...rest, updatedAt: new Date() };
    // Le slug EST l'URL publique (et la clé du thread Giscus, mappé sur le
    // pathname) : une fois l'article publié, on le fige - un titre édité
    // après coup ne doit plus casser les liens entrants/le thread existant.
    if (dto.title !== undefined && current.publishedAt === null) {
      patch.slug = slugify(dto.title);
    }
    if (coverImage === null) patch.coverImage = '';

    const isPublishing =
      dto.status === 'published' && current.status !== 'published';
    if (isPublishing) patch.publishedAt = new Date();

    let row: BlogPost;
    try {
      [row] = await this.db
        .update(blogPosts)
        .set(patch)
        .where(eq(blogPosts.id, id))
        .returning();
    } catch (err) {
      if (isUniqueViolation(err, 'slug')) {
        throw new ConflictException(
          `Blog post with slug "${patch.slug}" already exists`,
        );
      }
      throw err;
    }

    // S3 cleanup APRÈS le write DB réussi : si le write échoue, on préfère
    // garder l'objet S3 (orphelin DB-cohérent) plutôt qu'une DB cassée.
    if (coverImage === null) {
      await deleteS3IfExists(this.storage, STORAGE_BUCKET, current.coverImage);
    }

    return this.toResponse(row);
  }

  async remove(id: string): Promise<void> {
    const current = await this.findByIdRaw(id);
    await this.db.delete(blogPosts).where(eq(blogPosts.id, id));
    // La ligne est supprimée : un échec S3 ne laisse qu'un orphelin, il est journalisé sans
    // faire échouer la suppression ni sauter le nettoyage suivant.
    await deleteS3IfExists(
      this.storage,
      STORAGE_BUCKET,
      current.coverImage,
    ).catch((err: unknown) =>
      this.logger.error(
        `Suppression de la couverture ${current.coverImage} de l'article ${id} en échec`,
        err instanceof Error ? err.stack : String(err),
      ),
    );
    // Images du corps que nul autre article ne cite.
    await this.contentImages
      .removeUnreferenced(contentImageKeysIn(current.contentMarkdown), id)
      .catch((err: unknown) =>
        this.logger.error(
          `Nettoyage des images du corps de l'article ${id} en échec`,
          err instanceof Error ? err.stack : String(err),
        ),
      );
  }

  async uploadCoverImage(
    id: string,
    file: UploadedFile,
  ): Promise<BlogPostResponse> {
    const current = await this.findByIdRaw(id);
    // Ordre : upload → update DB → cleanup ancienne clé. Si une étape échoue, on préfère un orphelin S3
    // (cleanup manuel possible) à une DB qui référence une clé supprimée (image cassée côté front).
    const newKey = await storeOptimizedImage(
      this.storage,
      this.images,
      `blog/${id}`,
      file.buffer,
    );

    const [row] = await this.db
      .update(blogPosts)
      .set({ coverImage: newKey, updatedAt: new Date() })
      .where(eq(blogPosts.id, id))
      .returning();

    if (current.coverImage !== newKey) {
      await deleteS3IfExists(this.storage, STORAGE_BUCKET, current.coverImage);
    }

    return this.toResponse(row);
  }

  async like(slug: string): Promise<{ likesCount: number }> {
    // Incrément atomique côté DB (pas de read-then-write applicatif) pour
    // éviter une race condition entre deux likes concurrents. Le filtre
    // status='published' est appliqué dans la même requête (plutôt qu'un
    // find préalable) pour ne pas sacrifier cette atomicité.
    const [row] = await this.db
      .update(blogPosts)
      .set({ likesCount: sql`${blogPosts.likesCount} + 1` })
      .where(this.publishedSlugFilter(slug))
      .returning();
    if (!row) throw new NotFoundException(`Blog post "${slug}" not found`);
    return { likesCount: row.likesCount };
  }

  // Helper privé : retourne la row brute (sans transformation URL).
  // Utilisé par toutes les opérations internes qui ont besoin de la key S3.
  private findByIdRaw(id: string): Promise<BlogPost> {
    return findByIdOrFail<BlogPost>(this.db, blogPosts, id, 'Blog post');
  }

  // Filtre partagé slug + status='published' : un draft (ou un post
  // dépublié) doit 404 exactement comme un slug inexistant, aussi bien en
  // lecture (findBySlug) qu'en écriture (like).
  private publishedSlugFilter(slug: string) {
    return and(eq(blogPosts.slug, slug), eq(blogPosts.status, 'published'));
  }

  // Transforme la key DB en URL publique pour la sortie API.
  private toResponse(p: BlogPost): BlogPostResponse {
    return {
      ...p,
      coverImage: p.coverImage
        ? this.storage.getPublicUrl(STORAGE_BUCKET, p.coverImage)
        : '',
      wordCount: countWords(p.contentMarkdown),
    };
  }
}
